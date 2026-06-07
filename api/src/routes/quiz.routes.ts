import { Router } from "express";
import {
  addQuestion,
  createQuiz,
  createQuizSession,
  endSession,
  finalizeQuiz,
  getMyQuizHistory,
  getSession,
  getSessionLeaderboard,
  joinSession,
  listMyQuizzes,
  startSession,
  submitSession,
} from "../controllers/quiz.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

export const quizRouter = Router();

quizRouter.use(authenticate);

quizRouter.get("/history/me", getMyQuizHistory);
quizRouter.post("/sessions/join", joinSession);
quizRouter.get("/sessions/:id", getSession);
quizRouter.post("/sessions/:id/submit", submitSession);
quizRouter.get("/sessions/:id/leaderboard", getSessionLeaderboard);

quizRouter.get("/admin/quizzes", authorize(["ADMIN"]), listMyQuizzes);
quizRouter.post("/admin/quizzes", authorize(["ADMIN"]), createQuiz);
quizRouter.post("/admin/quizzes/:id/questions", authorize(["ADMIN"]), addQuestion);
quizRouter.patch("/admin/quizzes/:id/finalize", authorize(["ADMIN"]), finalizeQuiz);
quizRouter.post("/admin/sessions", authorize(["ADMIN"]), createQuizSession);
quizRouter.patch("/admin/sessions/:id/start", authorize(["ADMIN"]), startSession);
quizRouter.patch("/admin/sessions/:id/end", authorize(["ADMIN"]), endSession);
