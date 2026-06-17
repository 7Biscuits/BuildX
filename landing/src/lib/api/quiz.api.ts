import { api } from "./client";
import type {
  ApiEnvelope,
  JoinQuizPayload,
  QuizSessionState,
  AnswerSubmissionPayload,
  ParticipantSession,
} from "@/types/api";

export async function join(payload: JoinQuizPayload) {
  const response = await api.post<
    ApiEnvelope<
      | {
          sessionId: string;
          participantSessionId: string;
          status: string;
        }
      | {
          session: QuizSessionState;
          participant: ParticipantSession;
        }
    >
  >("/api/quizzes/sessions/join", payload);
  return response.data;
}

export async function getSession(sessionId: string) {
  const response = await api.get<ApiEnvelope<QuizSessionState>>(
    `/api/quizzes/sessions/${sessionId}`
  );
  return response.data;
}

export async function submitAnswers(
  sessionId: string,
  payload: AnswerSubmissionPayload
) {
  const response = await api.post<
    ApiEnvelope<{ participantSessionId: string; submittedAt: string }>
  >(`/api/quizzes/sessions/${sessionId}/submit`, payload);
  return response.data;
}
