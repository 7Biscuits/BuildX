import { z } from "zod";

const optionInput = z.object({
  text: z.string().trim().min(1).max(500),
  isCorrect: z.boolean(),
});

const questionInput = z
  .object({
    text: z.string().trim().min(1).max(1000),
    options: z.array(optionInput).min(2).max(10),
  })
  .refine((question) => question.options.some((option) => option.isCorrect), {
    message: "Each question must have at least one correct answer",
    path: ["options"],
  });

export const createQuizValidator = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(1000).optional(),
});

export const addQuestionValidator = questionInput;

export const finalizeQuizValidator = z.object({
  durationMinutes: z.number().int().min(1).max(240),
  leaderboardDisplayLimit: z.number().int().min(1).max(100),
});

export const createSessionValidator = z.object({
  quizId: z.uuid("Invalid quiz id"),
  allowLateJoin: z.boolean().default(false),
});

export const joinSessionValidator = z.object({
  joinCode: z.string().trim().min(4).max(12).toUpperCase(),
});

export const submitQuizValidator = z.object({
  answers: z.array(
    z.object({
      questionId: z.uuid("Invalid question id"),
      selectedOptionIds: z.array(z.uuid("Invalid option id")).max(10),
    }),
  ),
});
