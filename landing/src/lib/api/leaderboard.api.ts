import { api } from "./client";
import type { ApiEnvelope, QuizResult } from "@/types/api";

export async function getLeaderboard(sessionId: string) {
  const response = await api.get<
    ApiEnvelope<{ sessionId: string; leaderboard: QuizResult[] }>
  >(`/api/quizzes/sessions/${sessionId}/leaderboard`);
  return response.data;
}

export async function getHistory() {
  const response = await api.get<ApiEnvelope<QuizResult[]>>(
    "/api/quizzes/history/me"
  );
  return response.data;
}
