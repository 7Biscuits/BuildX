import { randomBytes } from "crypto";
import {
  ParticipantSessionStatus,
  QuizSessionStatus,
  QuizStatus,
  UserRole,
  AccountStatus,
} from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { emitQuizEvent } from "./quiz-realtime.service";
import { logger } from "../lib/logger";

const activeTimers = new Map<string, NodeJS.Timeout>();

const isMissingQuizSessionTableError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;

  const maybePrismaError = error as {
    code?: string;
    meta?: {
      modelName?: string;
      driverAdapterError?: {
        cause?: {
          kind?: string;
          table?: string;
        };
      };
    };
  };

  return (
    maybePrismaError.code === "P2021" &&
    (maybePrismaError.meta?.modelName === "QuizSession" ||
      maybePrismaError.meta?.driverAdapterError?.cause?.kind === "TableDoesNotExist" ||
      maybePrismaError.meta?.driverAdapterError?.cause?.table === "public.QuizSession")
  );
};

export const generateJoinCode = () => randomBytes(4).toString("hex").toUpperCase();

const createUniqueJoinCode = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const joinCode = generateJoinCode();
    const existing = await prisma.quizSession.findUnique({ where: { joinCode } });
    if (!existing) return joinCode;
  }

  throw new Error("Failed to generate unique join code");
};

export const createQuizSessionForAdmin = async (
  quizId: string,
  hostAdminId: string,
  allowLateJoin: boolean,
) => {
  const quiz = await prisma.quiz.findFirst({
    where: {
      id: quizId,
      createdByAdminId: hostAdminId,
      status: QuizStatus.READY,
    },
  });

  if (!quiz) {
    throw new Error("Quiz not found or not ready");
  }

  if (!quiz.durationMinutes) {
    throw new Error("Quiz duration is not configured");
  }

  const joinCode = await createUniqueJoinCode();

  return prisma.quizSession.create({
    data: {
      quizId,
      hostAdminId,
      allowLateJoin,
      joinCode,
      durationMinutes: quiz.durationMinutes,
      leaderboardDisplayLimit: quiz.leaderboardDisplayLimit,
    },
  });
};

export const joinQuizSession = async (joinCode: string, userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true },
  });

  if (!user || user.status !== AccountStatus.VERIFIED) {
    throw new Error("Only verified accounts can join quizzes");
  }

  const session = await prisma.quizSession.findUnique({
    where: { joinCode },
  });

  if (!session || session.status === QuizSessionStatus.ENDED) {
    throw new Error("Quiz session is not active");
  }

  if (session.status === QuizSessionStatus.RUNNING && !session.allowLateJoin) {
    throw new Error("Quiz has already started");
  }

  const participant = await prisma.participantSession.upsert({
    where: {
      sessionId_userId: {
        sessionId: session.id,
        userId,
      },
    },
    create: {
      sessionId: session.id,
      userId,
      status:
        session.status === QuizSessionStatus.RUNNING
          ? ParticipantSessionStatus.TAKING
          : ParticipantSessionStatus.JOINED,
    },
    update: {
      lastSeenAt: new Date(),
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  emitQuizEvent(session.id, "participant:joined", participant);
  await emitSessionStatus(session.id);

  return {
    sessionId: session.id,
    participantSessionId: participant.id,
    status: participant.status,
    session,
    participant,
  };
};

export const startQuizSession = async (sessionId: string, adminId: string) => {
  const now = new Date();

  const session = await prisma.quizSession.findFirst({
    where: {
      id: sessionId,
      hostAdminId: adminId,
      status: QuizSessionStatus.WAITING,
    },
  });

  if (!session) {
    throw new Error("Session not found or already started");
  }

  const endsAt = new Date(now.getTime() + session.durationMinutes * 60 * 1000);

  const updated = await prisma.$transaction(async (tx) => {
    const started = await tx.quizSession.update({
      where: { id: session.id },
      data: {
        status: QuizSessionStatus.RUNNING,
        startedAt: now,
        endsAt,
      },
    });

    await tx.participantSession.updateMany({
      where: { sessionId: session.id, status: ParticipantSessionStatus.JOINED },
      data: { status: ParticipantSessionStatus.TAKING },
    });

    return started;
  });

  scheduleSessionExpiry(updated.id, endsAt);
  emitQuizEvent(updated.id, "quiz:started", updated);
  await emitSessionStatus(updated.id);

  return updated;
};

export const submitQuizForUser = async (
  sessionId: string,
  userId: string,
  answers: { questionId: string; selectedOptionIds: string[] }[],
) => {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.status !== QuizSessionStatus.RUNNING) {
    throw new Error("Quiz is not running");
  }

  if (session.endsAt && new Date() > session.endsAt) {
    return endQuizSession(session.id, "timer");
  }

  const participant = await prisma.participantSession.findUnique({
    where: {
      sessionId_userId: { sessionId, userId },
    },
  });

  if (!participant || participant.status === ParticipantSessionStatus.SUBMITTED) {
    throw new Error("Participant not found or already submitted");
  }

  await persistAnswersAndMarkSubmitted(sessionId, userId, participant.id, answers);

  emitQuizEvent(sessionId, "participant:submitted", { userId, sessionId });
  await emitSessionStatus(sessionId);

  const remaining = await prisma.participantSession.count({
    where: {
      sessionId,
      status: { not: ParticipantSessionStatus.SUBMITTED },
    },
  });

  if (remaining === 0) {
    return endQuizSession(sessionId, "all-submitted");
  }

  return { success: true };
};

export const endQuizSession = async (
  sessionId: string,
  reason: "admin" | "timer" | "all-submitted",
  adminId?: string,
) => {
  const session = await prisma.quizSession.findFirst({
    where: {
      id: sessionId,
      ...(adminId ? { hostAdminId: adminId } : {}),
    },
    include: {
      quiz: { include: { questions: { include: { options: true } } } },
      participantSessions: true,
    },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.status === QuizSessionStatus.ENDED) {
    return getLeaderboard(sessionId);
  }

  clearSessionTimer(sessionId);
  const endedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.quizSession.update({
      where: { id: sessionId },
      data: {
        status: QuizSessionStatus.ENDED,
        endedAt,
      },
    });

    await tx.participantSession.updateMany({
      where: {
        sessionId,
        status: { not: ParticipantSessionStatus.SUBMITTED },
      },
      data: {
        status: ParticipantSessionStatus.SUBMITTED,
        submittedAt: endedAt,
      },
    });
  });

  await calculateAndStoreResults(sessionId);
  const leaderboard = await getLeaderboard(sessionId);

  emitQuizEvent(sessionId, "quiz:ended", { sessionId, reason });
  emitQuizEvent(sessionId, "leaderboard:published", leaderboard);

  return leaderboard;
};

export const getSessionState = async (sessionId: string) => {
  return prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          durationMinutes: true,
          questions: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              text: true,
              order: true,
              options: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  text: true,
                  order: true,
                },
              },
            },
          },
        },
      },
      participantSessions: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
};

export const getLeaderboard = async (sessionId: string) => {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
  });

  const results = await prisma.quizResult.findMany({
    where: { sessionId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      quiz: { select: { id: true, title: true } },
    },
    orderBy: [{ rank: "asc" }],
    take: session?.leaderboardDisplayLimit ?? 10,
  });

  return { sessionId, leaderboard: results };
};

export const getUserQuizHistory = async (userId: string) => {
  return prisma.quizResult.findMany({
    where: { userId },
    include: {
      quiz: { select: { id: true, title: true } },
      session: { select: { id: true, startedAt: true, endedAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const resumeRunningQuizTimers = async () => {
  let runningSessions: { id: string; endsAt: Date | null }[] = [];

  try {
    runningSessions = await prisma.quizSession.findMany({
      where: {
        status: QuizSessionStatus.RUNNING,
        endsAt: { not: null },
      },
      select: {
        id: true,
        endsAt: true,
      },
    });
  } catch (error) {
    if (isMissingQuizSessionTableError(error)) {
      logger.warn(
        "Quiz session table is missing; skipping quiz timer recovery during startup. Apply database migrations before using quiz features.",
      );
      return;
    }

    throw error;
  }

  for (const session of runningSessions) {
    if (!session.endsAt) continue;

    if (session.endsAt <= new Date()) {
      void endQuizSession(session.id, "timer");
      continue;
    }

    scheduleSessionExpiry(session.id, session.endsAt);
  }
};

export const assertSessionAccess = async (sessionId: string, userId: string, role: string) => {
  if (role === UserRole.ADMIN) {
    const adminSession = await prisma.quizSession.findFirst({
      where: { id: sessionId, hostAdminId: userId },
    });
    if (adminSession) return true;
  }

  const participant = await prisma.participantSession.findUnique({
    where: { sessionId_userId: { sessionId, userId } },
  });

  return Boolean(participant);
};

const persistAnswersAndMarkSubmitted = async (
  sessionId: string,
  userId: string,
  participantSessionId: string,
  answers: { questionId: string; selectedOptionIds: string[] }[],
) => {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: { quiz: { include: { questions: { include: { options: true } } } } },
  });

  if (!session) throw new Error("Session not found");

  const questionMap = new Map(session.quiz.questions.map((question) => [question.id, question]));
  const answeredQuestionIds = new Set(answers.map((answer) => answer.questionId));

  for (const question of session.quiz.questions) {
    if (!answeredQuestionIds.has(question.id)) {
      throw new Error("All questions must be submitted");
    }
  }

  const normalizedAnswers = answers.map((answer) => {
    const question = questionMap.get(answer.questionId);
    if (!question) throw new Error("Invalid question");

    const validOptionIds = new Set(question.options.map((option) => option.id));
    const selectedOptionIds = [...new Set(answer.selectedOptionIds)].filter((id) =>
      validOptionIds.has(id),
    );

    return {
      questionId: answer.questionId,
      selectedOptionIds,
      isCorrect: isAnswerCorrect(question.options, selectedOptionIds),
    };
  });

  const submittedAt = new Date();

  await prisma.$transaction(async (tx) => {
    const submitLock = await tx.participantSession.updateMany({
      where: {
        id: participantSessionId,
        status: { not: ParticipantSessionStatus.SUBMITTED },
      },
      data: {
        status: ParticipantSessionStatus.SUBMITTED,
        submittedAt,
      },
    });

    if (submitLock.count === 0) {
      throw new Error("Participant already submitted");
    }

    for (const answer of normalizedAnswers) {
      await tx.answerSubmission.upsert({
        where: {
          sessionId_participantUserId_questionId: {
            sessionId,
            participantUserId: userId,
            questionId: answer.questionId,
          },
        },
        create: {
          sessionId,
          participantUserId: userId,
          questionId: answer.questionId,
          selectedOptionIds: answer.selectedOptionIds,
          isCorrect: answer.isCorrect,
          submittedAt,
        },
        update: {
          selectedOptionIds: answer.selectedOptionIds,
          isCorrect: answer.isCorrect,
          submittedAt,
        },
      });
    }
  });
};

const calculateAndStoreResults = async (sessionId: string) => {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: {
      quiz: { include: { questions: true } },
      participantSessions: true,
      answerSubmissions: true,
    },
  });

  if (!session || !session.startedAt) return;

  const totalQuestions = session.quiz.questions.length;
  const rows = session.participantSessions.map((participant) => {
    const score = session.answerSubmissions.filter(
      (answer) => answer.participantUserId === participant.userId && answer.isCorrect,
    ).length;
    const submittedAt = participant.submittedAt ?? session.endedAt ?? new Date();
    return {
      participant,
      score,
      submittedAt,
      percentage: totalQuestions === 0 ? 0 : (score / totalQuestions) * 100,
      durationSeconds: Math.max(
        0,
        Math.floor((submittedAt.getTime() - session.startedAt!.getTime()) / 1000),
      ),
    };
  });

  rows.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.submittedAt.getTime() - b.submittedAt.getTime();
  });

  await prisma.$transaction(
    rows.map((row, index) =>
      prisma.quizResult.upsert({
        where: { sessionId_userId: { sessionId, userId: row.participant.userId } },
        create: {
          quizId: session.quizId,
          sessionId,
          participantSessionId: row.participant.id,
          userId: row.participant.userId,
          score: row.score,
          totalQuestions,
          percentage: row.percentage,
          rank: index + 1,
          submittedAt: row.submittedAt,
          durationSeconds: row.durationSeconds,
        },
        update: {
          score: row.score,
          totalQuestions,
          percentage: row.percentage,
          rank: index + 1,
          submittedAt: row.submittedAt,
          durationSeconds: row.durationSeconds,
        },
      }),
    ),
  );
};

const isAnswerCorrect = (
  options: { id: string; isCorrect: boolean }[],
  selectedOptionIds: string[],
) => {
  const correctIds = options
    .filter((option) => option.isCorrect)
    .map((option) => option.id)
    .sort();
  const selectedIds = [...selectedOptionIds].sort();

  return JSON.stringify(correctIds) === JSON.stringify(selectedIds);
};

const scheduleSessionExpiry = (sessionId: string, endsAt: Date) => {
  clearSessionTimer(sessionId);
  const delayMs = Math.max(0, endsAt.getTime() - Date.now());
  const timer = setTimeout(() => {
    void endQuizSession(sessionId, "timer").catch((error) => {
      logger.error("Failed to auto-end quiz session", { sessionId, error });
    });
  }, delayMs);
  activeTimers.set(sessionId, timer);
};

const clearSessionTimer = (sessionId: string) => {
  const timer = activeTimers.get(sessionId);
  if (timer) clearTimeout(timer);
  activeTimers.delete(sessionId);
};

export const clearQuizTimers = () => {
  for (const timer of activeTimers.values()) {
    clearTimeout(timer);
  }
  activeTimers.clear();
};

const emitSessionStatus = async (sessionId: string) => {
  const state = await getSessionState(sessionId);
  emitQuizEvent(sessionId, "participant:status-updated", state);
};
