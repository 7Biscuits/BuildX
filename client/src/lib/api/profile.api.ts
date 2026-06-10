import { api } from "./client";
import * as leaderboardApi from "./leaderboard.api";
import type { ApiEnvelope, AuthUser, QuizResult } from "@/types/api";

export type UserProfilePayload = {
  profile: AuthUser;
  quizHistory: QuizResult[];
};

export async function getProfile(): Promise<ApiEnvelope<AuthUser>> {
  const response = await api.get<ApiEnvelope<AuthUser>>("/api/user/profile");
  return response.data;
}

export async function getProfileOverview(): Promise<UserProfilePayload> {
  const [profileResponse, historyResponse] = await Promise.all([
    getProfile(),
    leaderboardApi.getHistory(),
  ]);

  return {
    profile: profileResponse.data,
    quizHistory: historyResponse.data ?? [],
  };
}
