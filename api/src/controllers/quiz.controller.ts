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

export const createQuiz = async (req: Request, res: Response) => {
  try {
    const parsed = createQuizValidator.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.issues });
    }

    const adminId = (req as any).user.userId;
    const quiz = await prisma.quiz.create({
      data: {
        ...parsed.data,
        createdByAdmin: {
          connect: { id: adminId },
        },
      },
    });

    return res.status(201).json({ success: true, data: quiz });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to create quiz" });
  }
};

export const addQuestion = async (req: Request, res: Response) => {
  try {
    const idParsed = idValidator.safeParse(req.params);
    const bodyParsed = addQuestionValidator.safeParse(req.body);

    if (!idParsed.success) {
      return res.status(400).json({ success: false, errors: idParsed.error.issues });
    }
    if (!bodyParsed.success) {
      return res.status(400).json({ success: false, errors: bodyParsed.error.issues });
    }

    const adminId = (req as any).user.userId;
    const quiz = await prisma.quiz.findFirst({
      where: { id: idParsed.data.id, createdByAdminId: adminId, status: QuizStatus.DRAFT },
      include: { questions: true },
    });

    if (!quiz) {
      return res.status(404).json({ success: false, message: "Draft quiz not found" });
    }

    const question = await prisma.question.create({
      data: {
        quizId: quiz.id,
        text: bodyParsed.data.text,
        order: quiz.questions.length + 1,
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

    return res.status(201).json({ success: true, data: question });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to add question" });
  }
};

export const finalizeQuiz = async (req: Request, res: Response) => {
  try {
    const idParsed = idValidator.safeParse(req.params);
    const bodyParsed = finalizeQuizValidator.safeParse(req.body);
    if (!idParsed.success) {
      return res.status(400).json({ success: false, errors: idParsed.error.issues });
    }
    if (!bodyParsed.success) {
      return res.status(400).json({ success: false, errors: bodyParsed.error.issues });
    }

    const adminId = (req as any).user.userId;
    const quiz = await prisma.quiz.findFirst({
      where: { id: idParsed.data.id, createdByAdminId: adminId },
      include: { questions: { include: { options: true } } },
    });

    if (!quiz || quiz.questions.length === 0) {
      return res.status(404).json({ success: false, message: "Quiz not found or has no questions" });
    }

    const updated = await prisma.quiz.update({
      where: { id: quiz.id },
      data: {
        ...bodyParsed.data,
        status: QuizStatus.READY,
      },
    });

    return res.json({ success: true, data: updated });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to finalize quiz" });
  }
};

export const createQuizSession = async (req: Request, res: Response) => {
  try {
    const parsed = createSessionValidator.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.issues });
    }

    const session = await createQuizSessionForAdmin(
      parsed.data.quizId,
      (req as any).user.userId,
      parsed.data.allowLateJoin,
    );

    return res.status(201).json({ success: true, data: session });
  } catch (err) {
    return res.status(400).json({ success: false, message: getErrorMessage(err) });
  }
};

export const joinSession = async (req: Request, res: Response) => {
  try {
    const parsed = joinSessionValidator.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.issues });
    }

    const result = await joinQuizSession(parsed.data.joinCode, (req as any).user.userId);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: getErrorMessage(err) });
  }
};

export const startSession = async (req: Request, res: Response) => {
  try {
    const parsed = idValidator.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.issues });
    }
    const session = await startQuizSession(parsed.data.id, (req as any).user.userId);
    return res.json({ success: true, data: session });
  } catch (err) {
    return res.status(400).json({ success: false, message: getErrorMessage(err) });
  }
};

export const endSession = async (req: Request, res: Response) => {
  try {
    const parsed = idValidator.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.issues });
    }
    const leaderboard = await endQuizSession(parsed.data.id, "admin", (req as any).user.userId);
    return res.json({ success: true, data: leaderboard });
  } catch (err) {
    return res.status(400).json({ success: false, message: getErrorMessage(err) });
  }
};

export const submitSession = async (req: Request, res: Response) => {
  try {
    const idParsed = idValidator.safeParse(req.params);
    const bodyParsed = submitQuizValidator.safeParse(req.body);
    if (!idParsed.success) {
      return res.status(400).json({ success: false, errors: idParsed.error.issues });
    }
    if (!bodyParsed.success) {
      return res.status(400).json({ success: false, errors: bodyParsed.error.issues });
    }

    const result = await submitQuizForUser(
      idParsed.data.id,
      (req as any).user.userId,
      bodyParsed.data.answers,
    );
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: getErrorMessage(err) });
  }
};

export const getSession = async (req: Request, res: Response) => {
  const parsed = idValidator.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.issues });
  const user = (req as any).user;
  const canAccess = await assertSessionAccess(parsed.data.id, user.userId, user.role);
  if (!canAccess) return res.status(403).json({ success: false, message: "Forbidden" });
  const session = await getSessionState(parsed.data.id);
  return res.json({ success: true, data: session });
};

export const getSessionLeaderboard = async (req: Request, res: Response) => {
  const parsed = idValidator.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.issues });
  const user = (req as any).user;
  const canAccess = await assertSessionAccess(parsed.data.id, user.userId, user.role);
  if (!canAccess) return res.status(403).json({ success: false, message: "Forbidden" });
  const leaderboard = await getLeaderboard(parsed.data.id);
  return res.json({ success: true, data: leaderboard });
};

export const getMyQuizHistory = async (req: Request, res: Response) => {
  const history = await getUserQuizHistory((req as any).user.userId);
  return res.json({ success: true, data: history });
};

export const listMyQuizzes = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== UserRole.ADMIN) {
    return res.status(403).json({ success: false, message: "Admins only" });
  }
  const quizzes = await prisma.quiz.findMany({
    where: { createdByAdminId: user.userId },
    include: { questions: { include: { options: true } }, sessions: true },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ success: true, data: quizzes });
};

const getErrorMessage = (err: unknown) => {
  return err instanceof Error ? err.message : "Request failed";
};
