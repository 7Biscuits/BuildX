import { create } from "zustand";
import { getQuizSocket, disconnectQuizSocket } from "@/lib/socket";
import { quizApi } from "@/lib/api";
import type { QuizSessionState, ParticipantSession, QuizResult } from "@/types/api";

type QuizState = {
  session: QuizSessionState | null;
  participants: ParticipantSession[];
  leaderboard: QuizResult[];
  isConnected: boolean;
  error: string | null;

  connectSocket: (sessionId: string) => void;
  disconnectSocket: () => void;
  joinQuiz: (joinCode: string) => Promise<string>;
  submitQuizAnswers: (sessionId: string, answers: { questionId: string; selectedOptionIds: string[] }[]) => Promise<void>;
  startSession: (sessionId: string) => Promise<void>;
  endSession: (sessionId: string) => Promise<void>;
  fetchLeaderboard: (sessionId: string) => Promise<void>;
  updateSessionState: (state: QuizSessionState) => void;
  kickParticipant: (sessionId: string, userId: string) => void;
};

export const useQuizStore = create<QuizState>((set, get) => ({
  session: null,
  participants: [],
  leaderboard: [],
  isConnected: false,
  error: null,

  connectSocket(sessionId) {
    // Clean up first if any existing socket is connected
    get().disconnectSocket();

    const socket = getQuizSocket();
    socket.removeAllListeners();
    
    socket.on("connect", () => {
      set({ isConnected: true, error: null });
      socket.emit("quiz:join-room", { sessionId });
    });

    socket.on("disconnect", () => {
      set({ isConnected: false });
    });

    socket.on("connect_error", (err) => {
      set({ error: err.message });
    });

    socket.on("quiz:room-joined", ({ sessionId: joinedId }) => {
      console.log("Joined socket room:", joinedId);
    });

    socket.on("quiz:error", ({ message }) => {
      set({ error: message });
    });

    socket.on("participant:status-updated", (state: QuizSessionState) => {
      get().updateSessionState(state);
    });

    socket.on("participant:joined", (participant: ParticipantSession) => {
      set((state) => {
        const exists = state.participants.some((p) => p.userId === participant.userId);
        const updated = exists
          ? state.participants.map((p) => (p.userId === participant.userId ? participant : p))
          : [...state.participants, participant];
        return { participants: updated };
      });
    });

    socket.on("participant:left", ({ userId }: { userId: string }) => {
      set((state) => ({
        participants: state.participants.map((p) =>
          p.userId === userId ? { ...p, status: "DISCONNECTED" as const } : p
        ),
      }));
    });

    socket.on("participant:submitted", ({ userId }: { userId: string }) => {
      set((state) => ({
        participants: state.participants.map((p) =>
          p.userId === userId ? { ...p, status: "SUBMITTED" as const } : p
        ),
      }));
    });

    socket.on("quiz:started", (updatedSession: QuizSessionState) => {
      set((state) => ({
        session: state.session
          ? {
              ...state.session,
              status: "RUNNING",
              startedAt: updatedSession.startedAt,
              endsAt: updatedSession.endsAt,
            }
          : updatedSession,
      }));
    });

    socket.on("quiz:ended", ({ reason }: { reason: string }) => {
      set((state) => ({
        session: state.session ? { ...state.session, status: "ENDED" } : null,
      }));
      // Auto fetch leaderboard once ended
      const currentSession = get().session;
      if (currentSession) {
        get().fetchLeaderboard(currentSession.id);
      }
    });

    socket.on("leaderboard:published", (data: { leaderboard: QuizResult[] } | QuizResult[]) => {
      const results = Array.isArray(data) ? data : data.leaderboard;
      set({ leaderboard: results });
    });

    socket.on("participant:kicked", ({ userId }: { userId: string }) => {
      set((state) => ({
        participants: state.participants.filter((p) => p.userId !== userId),
      }));
    });

    socket.connect();
  },

  kickParticipant(sessionId, userId) {
    const socket = getQuizSocket();
    if (socket.connected) {
      socket.emit("quiz:kick-user", { sessionId, userId });
    }
  },

  disconnectSocket() {
    disconnectQuizSocket();
    set({ isConnected: false, session: null, participants: [], leaderboard: [], error: null });
  },

  async joinQuiz(joinCode) {
    const response = await quizApi.join({ joinCode });
    if (!response.success) {
      throw new Error(response.message || "Failed to join quiz session");
    }

    if ("sessionId" in response.data) {
      return response.data.sessionId;
    }

    return response.data.session.id;
  },

  async submitQuizAnswers(sessionId, answers) {
    const response = await quizApi.submitAnswers(sessionId, { answers });
    if (!response.success) {
      throw new Error(response.message || "Failed to submit answers");
    }
  },

  async startSession(sessionId) {
    const response = await quizApi.startSession(sessionId);
    if (response.success && response.data) {
      get().updateSessionState(response.data);
    }
  },

  async endSession(sessionId) {
    const response = await quizApi.endSession(sessionId);
    if (response.success && response.data) {
      set({ leaderboard: response.data.leaderboard });
    }
  },

  async fetchLeaderboard(sessionId) {
    const response = await quizApi.getLeaderboard(sessionId);
    if (response.success && response.data) {
      set({ leaderboard: response.data.leaderboard });
    }
  },

  updateSessionState(state) {
    set({
      session: state,
      participants: state.participantSessions || [],
    });
  },
}));
