import { api } from "./client";
import type {
  ApiEnvelope,
  AdminManagedUser,
  AdminUserFilters,
  PaymentVerification,
  Quiz,
  Question,
  QuizSessionState,
  QuizResult,
} from "@/types/api";

// --- PAYMENTS MANAGEMENT ---
export async function getPendingPayments(): Promise<ApiEnvelope<PaymentVerification[]>> {
  const response = await api.get<ApiEnvelope<PaymentVerification[]>>(
    "/api/admin/payments/pending"
  );
  return response.data;
}

export async function approvePayment(
  id: string,
  verifiedAmount?: number
): Promise<ApiEnvelope<PaymentVerification>> {
  const response = await api.patch<ApiEnvelope<PaymentVerification>>(
    `/api/admin/payments/${id}/approve`,
    { verifiedAmount }
  );
  return response.data;
}

export async function rejectPayment(
  id: string,
  reason?: string
): Promise<ApiEnvelope<PaymentVerification>> {
  const response = await api.patch<ApiEnvelope<PaymentVerification>>(
    `/api/admin/payments/${id}/reject`,
    { reason }
  );
  return response.data;
}

// --- USER MODERATION ---
export async function listUsers(filters?: {
  status?: string;
  query?: string;
  name?: string;
  institution?: string;
}): Promise<ApiEnvelope<AdminManagedUser[]>> {
  const response = await api.get<ApiEnvelope<AdminManagedUser[]>>("/api/admin/users", {
    params: filters,
  });
  return response.data;
}

export async function getUser(id: string): Promise<ApiEnvelope<AdminManagedUser>> {
  const response = await api.get<ApiEnvelope<AdminManagedUser>>(`/api/admin/users/${id}`);
  return response.data;
}

export async function searchUsers(filters?: AdminUserFilters) {
  return listUsers(filters);
}

export async function getAccountByEmail(email: string): Promise<ApiEnvelope<AdminManagedUser>> {
  const response = await api.get<ApiEnvelope<AdminManagedUser>>(
    `/api/admin/users/email/${encodeURIComponent(email)}`
  );
  return response.data;
}

export async function getUserByContact(contact: string): Promise<ApiEnvelope<AdminManagedUser>> {
  const response = await api.get<ApiEnvelope<AdminManagedUser>>(
    `/api/admin/users/contact/${encodeURIComponent(contact)}`
  );
  return response.data;
}

export async function updateUser(
  id: string,
  payload: Partial<Omit<AdminManagedUser, "id" | "role" | "deletedUsers" | "paymentVerification">>
): Promise<ApiEnvelope<AdminManagedUser>> {
  const response = await api.patch<ApiEnvelope<AdminManagedUser>>(
    `/api/admin/users/${id}`,
    payload
  );
  return response.data;
}

export async function deleteUser(
  id: string
): Promise<ApiEnvelope<{ deletedEmail: string }>> {
  const response = await api.delete<ApiEnvelope<{ deletedEmail: string }>>(
    `/api/admin/users/${id}`
  );
  return response.data;
}

export async function updateAdminProfile(payload: {
  name?: string;
  email?: string;
  contact?: string;
  institution?: string;
}): Promise<ApiEnvelope<AdminManagedUser>> {
  const response = await api.patch<ApiEnvelope<AdminManagedUser>>(
    "/api/admin/admins/me",
    payload
  );
  return response.data;
}

// --- QUIZ WORKSHOP & SESSION HOSTING ---
export async function getAdminQuizzes(): Promise<ApiEnvelope<Quiz[]>> {
  const response = await api.get<ApiEnvelope<Quiz[]>>("/api/quizzes/admin/quizzes");
  return response.data;
}

export async function createDraftQuiz(payload: {
  title: string;
  description?: string;
}): Promise<ApiEnvelope<Quiz>> {
  const response = await api.post<ApiEnvelope<Quiz>>(
    "/api/quizzes/admin/quizzes",
    payload
  );
  return response.data;
}

export async function addQuestion(
  quizId: string,
  payload: { text: string; options: { text: string; isCorrect: boolean }[] }
): Promise<ApiEnvelope<Question>> {
  const response = await api.post<ApiEnvelope<Question>>(
    `/api/quizzes/admin/quizzes/${quizId}/questions`,
    payload
  );
  return response.data;
}

export async function finalizeQuiz(
  quizId: string,
  payload: { durationMinutes: number; leaderboardDisplayLimit: number }
): Promise<ApiEnvelope<Quiz>> {
  const response = await api.patch<ApiEnvelope<Quiz>>(
    `/api/quizzes/admin/quizzes/${quizId}/finalize`,
    payload
  );
  return response.data;
}

export async function createSession(payload: {
  quizId: string;
  allowLateJoin?: boolean;
}): Promise<ApiEnvelope<QuizSessionState>> {
  const response = await api.post<ApiEnvelope<QuizSessionState>>(
    "/api/quizzes/admin/sessions",
    payload
  );
  return response.data;
}

export async function startSession(
  sessionId: string
): Promise<ApiEnvelope<QuizSessionState>> {
  const response = await api.patch<ApiEnvelope<QuizSessionState>>(
    `/api/quizzes/admin/sessions/${sessionId}/start`
  );
  return response.data;
}

export async function endSession(sessionId: string) {
  const response = await api.patch<
    ApiEnvelope<{ sessionId: string; leaderboard: QuizResult[] }>
  >(`/api/quizzes/admin/sessions/${sessionId}/end`);
  return response.data;
}
