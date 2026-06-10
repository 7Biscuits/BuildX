export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
  errors?: unknown[];
};

export type UserRole = "USER" | "ADMIN";
export type AccountStatus = "PENDING" | "VERIFIED" | "REJECTED";
export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type QuizStatus = "DRAFT" | "READY" | "ARCHIVED";
export type QuizSessionStatus = "WAITING" | "RUNNING" | "ENDED";
export type ParticipantSessionStatus = "JOINED" | "TAKING" | "SUBMITTED" | "DISCONNECTED";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  contact?: string;
  institution: string;
  role: UserRole;
  status: AccountStatus;
  createdAt?: string;
  paymentVerification?: PaymentVerification | null;
};

export type AdminManagedUser = AuthUser & {
  deletedUsers?: string[];
  updatedAt?: string;
  paymentVerification?: PaymentVerification | null;
};

export type AdminUserFilters = {
  status?: AccountStatus | "";
  query?: string;
  name?: string;
  institution?: string;
};

export type PaymentVerification = {
  id: string;
  paymentSlipUrl: string | null;
  submittedAmount: number | null;
  verifiedAmount: number | null;
  status: VerificationStatus;
  rejectionReason: string;
  submittedAt: string;
  verifiedAt: string | null;
  userId: string;
  verifiedByAdminId: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    contact: string;
    institution: string;
  };
};

export type Option = {
  id: string;
  text: string;
  isCorrect?: boolean;
  order: number;
};

export type Question = {
  id: string;
  text: string;
  order: number;
  options: Option[];
};

export type Quiz = {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  leaderboardDisplayLimit: number;
  status: QuizStatus;
  createdAt: string;
  createdByAdminId: string;
  questions?: Question[];
  sessions?: QuizSessionState[];
};

export type QuizSessionState = {
  id: string;
  joinCode: string;
  status: QuizSessionStatus;
  allowLateJoin: boolean;
  durationMinutes: number;
  leaderboardDisplayLimit: number;
  startedAt: string | null;
  endsAt: string | null;
  endedAt: string | null;
  quiz?: {
    id: string;
    title: string;
    durationMinutes: number;
    questions?: Question[];
  };
  participantSessions?: ParticipantSession[];
};

export type ParticipantSession = {
  id: string;
  sessionId: string;
  userId: string;
  status: ParticipantSessionStatus;
  joinedAt: string;
  submittedAt: string | null;
  lastSeenAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

export type QuizResult = {
  id: string;
  quizId: string;
  sessionId: string;
  participantSessionId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  rank: number;
  submittedAt: string;
  durationSeconds: number;
  quiz?: {
    id: string;
    title: string;
  };
  session?: {
    id: string;
    startedAt: string | null;
    endedAt: string | null;
  };
  user?: {
    id: string;
    name: string;
  };
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  contact: string;
  institution: string;
  submittedAmount?: string;
  paymentReceipt: File;
};

export type AdminRegisterPayload = {
  name: string;
  email: string;
  institution: string;
  password: string;
};

export type JoinQuizPayload = {
  joinCode: string;
};

export type AnswerSubmissionPayload = {
  answers: {
    questionId: string;
    selectedOptionIds: string[];
  }[];
};
