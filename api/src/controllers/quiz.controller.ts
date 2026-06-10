import { Request, Response } from "express";
import { QuizStatus, UserRole } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { idValidator } from "../validators/id.validator";
import {
  addQuestionValidator,
  createQuizValidator,
  createSessionValidator,
  finalizeQuizValidator,
  joinSessionValidator,
  submitQuizValidator,
} from "../validators/quiz.validator";
import {
  createQuizSessionForAdmin,
  endQuizSession,
  assertSessionAccess,
  getLeaderboard,
  getSessionState,
  getUserQuizHistory,
  joinQuizSession,
  startQuizSession,
  submitQuizForUser,
} from "../services/quiz.service";
import { created, fail, ok, validationFail } from "../utils/http";

export const createQuiz = async (req: Request, res: Response) => {
  try {
    const parsed = createQuizValidator.safeParse(req.body);
    if (!parsed.success) {
      return validationFail(res, parsed.error);
    }

    const adminId = req.user!.userId;
    const quiz = await prisma.quiz.create({
      data: {
        ...parsed.data,
        createdByAdmin: {
          connect: { id: adminId },
        },
      },
    });

    return created(res, quiz);
  } catch {
    return fail(res, 500, "Failed to create quiz");
  }
};

export const addQuestion = async (req: Request, res: Response) => {
  try {
    const idParsed = idValidator.safeParse(req.params);
    const bodyParsed = addQuestionValidator.safeParse(req.body);

    if (!idParsed.success) {
      return validationFail(res, idParsed.error);
    }
    if (!bodyParsed.success) {
      return validationFail(res, bodyParsed.error);
    }

    const adminId = req.user!.userId;
    const quiz = await prisma.quiz.findFirst({
      where: { id: idParsed.data.id, createdByAdminId: adminId, status: QuizStatus.DRAFT },
      include: { questions: true },
    });

    if (!quiz) {
      return fail(res, 404, "Draft quiz not found");
    }

    const question = await prisma.$transaction(async (tx) => {
      const questionCount = await tx.question.count({ where: { quizId: quiz.id } });
      return tx.question.create({
        data: {
          quizId: quiz.id,
          text: bodyParsed.data.text,
          order: questionCount + 1,
          options: {
            create: bodyParsed.data.options.map((option, index) => ({
              text: option.text,
              isCorrect: option.isCorrect,
              order: index + 1,
            })),
          },
        },
        include: { options: true },
      });
    });

    return created(res, question);
  } catch {
    return fail(res, 500, "Failed to add question");
  }
};

export const finalizeQuiz = async (req: Request, res: Response) => {
  try {
    const idParsed = idValidator.safeParse(req.params);
    const bodyParsed = finalizeQuizValidator.safeParse(req.body);
    if (!idParsed.success) {
      return validationFail(res, idParsed.error);
    }
    if (!bodyParsed.success) {
      return validationFail(res, bodyParsed.error);
    }

    const adminId = req.user!.userId;
    const quiz = await prisma.quiz.findFirst({
      where: { id: idParsed.data.id, createdByAdminId: adminId },
      include: { questions: { include: { options: true } } },
    });

    if (!quiz || quiz.questions.length === 0) {
      return fail(res, 404, "Quiz not found or has no questions");
    }

    const updated = await prisma.quiz.update({
      where: { id: quiz.id },
      data: {
        ...bodyParsed.data,
        status: QuizStatus.READY,
      },
    });

    return ok(res, updated);
  } catch {
    return fail(res, 500, "Failed to finalize quiz");
  }
};

export const createQuizSession = async (req: Request, res: Response) => {
  try {
    const parsed = createSessionValidator.safeParse(req.body);
    if (!parsed.success) {
      return validationFail(res, parsed.error);
    }

    const session = await createQuizSessionForAdmin(
      parsed.data.quizId,
      req.user!.userId,
      parsed.data.allowLateJoin,
    );

    return created(res, session);
  } catch (err) {
    return fail(res, 400, getErrorMessage(err));
  }
};

export const joinSession = async (req: Request, res: Response) => {
  try {
    const parsed = joinSessionValidator.safeParse(req.body);
    if (!parsed.success) {
      return validationFail(res, parsed.error);
    }

    const result = await joinQuizSession(parsed.data.joinCode, req.user!.userId);
    return created(res, result);
  } catch (err) {
    return fail(res, 400, getErrorMessage(err));
  }
};

export const startSession = async (req: Request, res: Response) => {
  try {
    const parsed = idValidator.safeParse(req.params);
    if (!parsed.success) {
      return validationFail(res, parsed.error);
    }
    const session = await startQuizSession(parsed.data.id, req.user!.userId);
    return ok(res, session);
  } catch (err) {
    return fail(res, 400, getErrorMessage(err));
  }
};

export const endSession = async (req: Request, res: Response) => {
  try {
    const parsed = idValidator.safeParse(req.params);
    if (!parsed.success) {
      return validationFail(res, parsed.error);
    }
    const leaderboard = await endQuizSession(parsed.data.id, "admin", req.user!.userId);
    return ok(res, leaderboard);
  } catch (err) {
    return fail(res, 400, getErrorMessage(err));
  }
};

export const submitSession = async (req: Request, res: Response) => {
  try {
    const idParsed = idValidator.safeParse(req.params);
    const bodyParsed = submitQuizValidator.safeParse(req.body);
    if (!idParsed.success) {
      return validationFail(res, idParsed.error);
    }
    if (!bodyParsed.success) {
      return validationFail(res, bodyParsed.error);
    }

    const result = await submitQuizForUser(
      idParsed.data.id,
      req.user!.userId,
      bodyParsed.data.answers,
    );
    return ok(res, result);
  } catch (err) {
    return fail(res, 400, getErrorMessage(err));
  }
};

export const getSession = async (req: Request, res: Response) => {
  try {
    const parsed = idValidator.safeParse(req.params);
    if (!parsed.success) return validationFail(res, parsed.error);
    const user = req.user!;
    const canAccess = await assertSessionAccess(parsed.data.id, user.userId, user.role);
    if (!canAccess) return fail(res, 403, "Forbidden");
    const session = await getSessionState(parsed.data.id);
    return ok(res, session);
  } catch {
    return fail(res, 500, "Failed to fetch session");
  }
};

export const getSessionLeaderboard = async (req: Request, res: Response) => {
  try {
    const parsed = idValidator.safeParse(req.params);
    if (!parsed.success) return validationFail(res, parsed.error);
    const user = req.user!;
    const canAccess = await assertSessionAccess(parsed.data.id, user.userId, user.role);
    if (!canAccess) return fail(res, 403, "Forbidden");
    const leaderboard = await getLeaderboard(parsed.data.id);
    return ok(res, leaderboard);
  } catch {
    return fail(res, 500, "Failed to fetch leaderboard");
  }
};

export const getMyQuizHistory = async (req: Request, res: Response) => {
  try {
    const history = await getUserQuizHistory(req.user!.userId);
    return ok(res, history);
  } catch {
    return fail(res, 500, "Failed to fetch quiz history");
  }
};

export const listMyQuizzes = async (req: Request, res: Response) => {
  const user = req.user!;
  if (user.role !== UserRole.ADMIN) {
    return fail(res, 403, "Admins only");
  }
  const quizzes = await prisma.quiz.findMany({
    where: { createdByAdminId: user.userId },
    include: { questions: { include: { options: true } }, sessions: true },
    orderBy: { createdAt: "desc" },
  });
  return ok(res, quizzes);
};

const getErrorMessage = (err: unknown) => {
  return err instanceof Error ? err.message : "Request failed";
};
