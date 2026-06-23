import * as auth from "./api/auth.api";
import * as quiz from "./api/quiz.api";
import * as admin from "./api/admin.api";
import * as leaderboard from "./api/leaderboard.api";
import * as payment from "./api/payment.api";
import * as profile from "./api/profile.api";
import { api, API_BASE_URL } from "./api/client";

export { api, API_BASE_URL };

// Re-export SDK modules to preserve compatibility with authStore and pages
export const authApi = auth;

export const paymentApi = {
  uploadReceipt: payment.uploadReceipt,
  getPending: admin.getPendingPayments,
  approve: admin.approvePayment,
  reject: admin.rejectPayment,
};

export const adminUserApi = {
  listUsers: admin.listUsers,
  searchUsers: admin.searchUsers,
  getUser: admin.getUser,
  getAccountByEmail: admin.getAccountByEmail,
  getUserByContact: admin.getUserByContact,
  updateUser: admin.updateUser,
  deleteUser: admin.deleteUser,
  updateAdminProfile: admin.updateAdminProfile,
};

export const profileApi = profile;

export const quizApi = {
  getAdminQuizzes: admin.getAdminQuizzes,
  createDraftQuiz: admin.createDraftQuiz,
  addQuestion: admin.addQuestion,
  finalizeQuiz: admin.finalizeQuiz,
  createSession: admin.createSession,
  startSession: admin.startSession,
  endSession: admin.endSession,
  join: quiz.join,
  getSession: quiz.getSession,
  submitAnswers: quiz.submitAnswers,
  getLeaderboard: leaderboard.getLeaderboard,
  getHistory: leaderboard.getHistory,
};
