import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Terminal, Users, Loader2, Play, CheckCircle2, ChevronRight, ChevronLeft, ShieldAlert, Award, ArrowLeft, Trophy, Crown, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { useQuizStore } from "@/store/quizStore";
import { quizApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/error";
import InteractiveBackground from "@/components/InteractiveBackground";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";

export default function LiveQuizSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, status: authStatus } = useAuthStore();
  const navigate = useNavigate();

  const {
    session,
    participants,
    leaderboard,
    isConnected,
    error,
    connectSocket,
    disconnectSocket,
    submitQuizAnswers,
    startSession,
    endSession,
    fetchLeaderboard,
    updateSessionState,
  } = useQuizStore();

  // Active question index
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  // Selected answers tracker: { [questionId]: [optionId, ...] }
  const [answers, setAnswers] = useState<{ [qId: string]: string[] }>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Remaining seconds timer state
  const [remainingSecs, setRemainingSecs] = useState<number | null>(null);

  // Top-N leaderboard display limit
  const [topN, setTopN] = useState<number>(10);
  // Submission compiler simulation logs
  const [logs, setLogs] = useState<string[]>([]);
  // Tracking if user joined to detect kicks
  const [hasJoined, setHasJoined] = useState(false);
  const { kickParticipant } = useQuizStore();

  // Check if player has already submitted
  const playerState = useMemo(() => {
    if (!user) return null;
    return participants.find((p) => p.userId === user.id) || null;
  }, [participants, user]);

  const isPlayerSubmitted = useMemo(() => {
    return submitSuccess || playerState?.status === "SUBMITTED";
  }, [submitSuccess, playerState]);

  // Monitor if user gets kicked
  useEffect(() => {
    if (user && user.role === "USER" && participants.length > 0) {
      const isPresent = participants.some((p) => p.userId === user.id);
      if (isPresent) {
        setHasJoined(true);
      } else if (hasJoined && session?.status !== "ENDED") {
        navigate("/profile");
      }
    }
  }, [participants, user, hasJoined, session?.status, navigate]);

  // Submission logs generator
  useEffect(() => {
    if (isPlayerSubmitted) {
      const messages = [
        "INITIALIZING COMPILE PROTOCOL...",
        "CONNECTING TO SECURE DATABASE INSTANCE...",
        "VERIFYING ANSWER INTEGRITY HASHES...",
        "PAYLOAD SECURED AND COMPILED.",
        "AWAITING OTHER PARTICIPANTS TO TERMINATE SESSIONS...",
      ];
      
      let i = 0;
      const interval = setInterval(() => {
        if (i < messages.length) {
          setLogs((prev) => [...prev, `[SYS] ${messages[i]}`]);
          i++;
        } else {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isPlayerSubmitted]);

  // Load session initially & connect sockets
  useEffect(() => {
    if (authStatus === "idle" && !user) {
      navigate("/");
      return;
    }

    if (!sessionId) return;

    // Load initial state via HTTP
    async function loadInitialState() {
      try {
        const result = await quizApi.getSession(sessionId!);
        if (result.success && result.data) {
          updateSessionState(result.data);
          // If ended on load, fetch leaderboard
          if (result.data.status === "ENDED") {
            fetchLeaderboard(sessionId!);
          }
        }
      } catch (err) {
        setActionMessage(getApiErrorMessage(err, "Failed to load initial session details."));
      }
    }

    loadInitialState();
    connectSocket(sessionId);

    return () => {
      disconnectSocket();
    };
  }, [sessionId, user, authStatus, connectSocket, disconnectSocket, navigate]);

  // Live timer tick for RUNNING session state
  useEffect(() => {
    if (!session || session.status !== "RUNNING" || !session.endsAt) {
      setRemainingSecs(null);
      return;
    }

    const targetTime = new Date(session.endsAt).getTime();

    function updateTimer() {
      const diff = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
      setRemainingSecs(diff);

      // Auto-submit when timer expires
      if (diff <= 0 && user?.role === "USER" && !submitSuccess) {
        void executeSubmission();
      }
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [session, submitSuccess, user]);

  const questions = useMemo(() => session?.quiz?.questions || [], [session]);
  const currentQuestion = useMemo(() => questions[currentQIndex] || null, [questions, currentQIndex]);

  const optionStyles = [
    {
      bg: "bg-red-500/5 border-red-500/25 hover:border-red-500/80 hover:bg-red-500/10 text-red-400",
      selectedBg: "bg-red-600/35 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.25)]",
      symbol: "▲",
      symbolBg: "bg-red-500 text-black",
    },
    {
      bg: "bg-blue-500/5 border-blue-500/25 hover:border-blue-500/80 hover:bg-blue-500/10 text-blue-400",
      selectedBg: "bg-blue-600/35 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.25)]",
      symbol: "◆",
      symbolBg: "bg-blue-500 text-black",
    },
    {
      bg: "bg-yellow-500/5 border-yellow-500/25 hover:border-yellow-500/80 hover:bg-yellow-500/10 text-yellow-400",
      selectedBg: "bg-yellow-600/35 border-yellow-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.25)]",
      symbol: "●",
      symbolBg: "bg-yellow-500 text-black",
    },
    {
      bg: "bg-green-500/5 border-green-500/25 hover:border-green-500/80 hover:bg-green-500/10 text-green-400",
      selectedBg: "bg-green-600/35 border-green-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.25)]",
      symbol: "■",
      symbolBg: "bg-green-500 text-black",
    },
  ];

  // Option select toggles
  function handleToggleOption(optId: string) {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;

    setAnswers((prev) => {
      const selected = prev[qId] || [];
      const exists = selected.includes(optId);
      const updated = exists
        ? selected.filter((id) => id !== optId)
        : [...selected, optId];
      return { ...prev, [qId]: updated };
    });
  }

  // Submit answers payload creation and execution
  async function executeSubmission() {
    if (!sessionId || submitting) return;
    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({
        questionId: q.id,
        selectedOptionIds: answers[q.id] || [],
      }));
      await submitQuizAnswers(sessionId, payload);
      setSubmitSuccess(true);
    } catch (error) {
      setActionMessage(getApiErrorMessage(error, "Failed to submit answers."));
    } finally {
      setSubmitting(false);
    }
  }

  // Host dashboard controls
  async function handleStartQuiz() {
    if (!sessionId) return;
    try {
      await startSession(sessionId);
    } catch (error) {
      setActionMessage(getApiErrorMessage(error, "Failed to start quiz."));
    }
  }

  async function handleEndQuiz() {
    if (!sessionId) return;
    try {
      await endSession(sessionId);
    } catch (error) {
      setActionMessage(getApiErrorMessage(error, "Failed to end quiz."));
    }
  }

  function handleKickParticipant(targetUserId: string) {
    if (!sessionId) return;
    kickParticipant(sessionId, targetUserId);
  }

  const displayedLeaderboard = useMemo(() => {
    return leaderboard.slice(0, topN);
  }, [leaderboard, topN]);

  if (!user || !session) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-[#07060c] font-terminal text-secondary">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-secondary shadow-neon-cyan" />
          <span className="text-xs font-bold tracking-widest uppercase">Connecting to live nodes...</span>
        </div>
      </div>
    );
  }

  const durationMin = session.durationMinutes;

  return (
    <div className="min-h-screen text-white font-terminal selection:bg-primary selection:text-white">
      <InteractiveBackground />
      <Navbar />

      <main className="container py-8 relative z-10 space-y-6">
        
        {/* ROOM BANNER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-[#07050d]/85 border border-primary/20 p-6 rounded font-terminal crt-screen shadow-neon-pink/5 gap-4">
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] text-muted-foreground uppercase">SESSION_LOBBY_ID: {session.id.slice(0, 8)}...</span>
            <h1 className="text-2xl font-bold tracking-widest text-white uppercase font-display">
              {session.quiz?.title || "BUILDX_LIVE_TOURNAMENT"}
            </h1>
            <p className="text-xs text-muted-foreground uppercase">
              STATUS: <span className="text-secondary font-bold text-neon-cyan">{session.status}</span> • LINK: {isConnected ? <span className="text-green-400 font-bold">STABLE</span> : <span className="text-red-400 font-bold animate-pulse font-terminal">CONNECTING...</span>}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {remainingSecs !== null && (
              <div className="border border-secondary bg-[#090812] px-4 py-2 rounded text-center shadow-neon-cyan/15 min-w-[100px]">
                <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-terminal">TIME_LEFT</div>
                <div className="text-xl font-bold font-pixel text-secondary text-neon-cyan">
                  {Math.floor(remainingSecs / 60)}:{String(remainingSecs % 60).padStart(2, "0")}
                </div>
              </div>
            )}
            
            <div className="bg-[#121020] border border-primary/20 px-4 py-2 rounded text-center min-w-[80px]">
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-terminal">CODE</div>
              <div className="text-xl font-bold font-pixel text-primary text-neon-pink">{session.joinCode}</div>
            </div>
          </div>
        </div>

        {/* ERROR LOG CONSOLE */}
        {error && (
          <div className="border border-red-500/30 bg-red-950/20 p-3 rounded text-xs text-red-400 font-terminal flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 animate-bounce" />
            <span>CRITICAL: {error}</span>
          </div>
        )}

        {actionMessage && (
          <div className="border border-amber-500/30 bg-amber-950/20 p-3 rounded text-xs text-amber-300 font-terminal flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{actionMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionMessage(null)}
              className="rounded border border-amber-500/20 px-2 py-1 text-[10px] uppercase hover:bg-amber-500/10"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* SESSION STATE VIEWER */}
        
        {/* State A: WAITING */}
        {session.status === "WAITING" && (
          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            {/* Host Dashboard / Participant Welcome */}
            <Card className="bg-[#07050d]/90 border border-primary/20 rounded font-terminal crt-screen">
              <CardHeader className="border-b border-primary/10 bg-[#0f0e20]/60 p-4">
                <CardTitle className="text-neon-pink text-lg font-pixel flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-primary" />
                  WAITING_ROOM_PORTAL
                </CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground uppercase">
                  MONITOR ACTIVE CONNECTIONS BEFORE LAUNCHING PROTOCOLS
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 text-center space-y-6">
                
                {user.role === "ADMIN" ? (
                  <div className="max-w-md mx-auto space-y-4 py-6">
                    <Trophy className="h-16 w-16 text-primary mx-auto animate-bounce text-neon-pink" />
                    <h2 className="font-bold text-white text-lg uppercase tracking-wider">READY TO BROADCAST</h2>
                    <p className="text-xs text-muted-foreground uppercase leading-relaxed">
                      You are the host admin. Ensure all contestants are visible in the right panel directory before initializing compilation.
                    </p>
                    <Button 
                      onClick={handleStartQuiz}
                      className="w-full font-bold uppercase tracking-widest text-sm py-6 border-2 border-primary text-primary hover:bg-primary hover:text-white hover:shadow-neon-pink bg-transparent"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      DEPLOY_QUIZ_PROTOCOL
                    </Button>
                  </div>
                ) : (
                  <div className="py-12 space-y-4 max-w-sm mx-auto">
                    <Loader2 className="h-12 w-12 animate-spin text-secondary mx-auto shadow-neon-cyan" />
                    <h2 className="font-bold text-white text-md tracking-widest uppercase">SYS: AWAITING HOST INITIALIZATION</h2>
                    <p className="text-[10px] text-muted-foreground uppercase leading-relaxed">
                      Lobby secured. Keep this window open. Sockets will automatically push the active taking arena once the host deploys.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Live Participants List */}
            <Card className="bg-[#07050d]/90 border border-secondary/20 rounded font-terminal">
              <CardHeader className="border-b border-secondary/10 bg-[#0e1d24]/60 p-4 flex flex-row items-center justify-between">
                <CardTitle className="text-neon-cyan text-sm font-pixel flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-secondary" />
                  DIRECTORY ({participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2 max-h-[350px] overflow-y-auto">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between border border-secondary/10 bg-[#090812]/80 p-2.5 rounded text-[10px]">
                      <span className="font-bold text-white max-w-[100px] truncate">{p.user?.name}</span>
                      
                      <div className="flex items-center gap-1.5">
                        <span className="bg-green-500/10 border border-green-500/20 text-green-400 px-1.5 py-0.5 rounded text-[8px] font-bold">
                          CONNECTED
                        </span>
                        {user.role === "ADMIN" && (
                          <button
                            onClick={() => handleKickParticipant(p.userId)}
                            className="text-red-400 hover:text-white hover:bg-red-500 border border-red-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold transition duration-150"
                          >
                            KICK
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {participants.length === 0 && (
                    <div className="text-center py-6 text-xs text-muted-foreground uppercase">
                      Awaiting user connections...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* State B: RUNNING */}
        {session.status === "RUNNING" && (
          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            
            {/* Quiz arena for user / Admin Live Monitor */}
            <Card className="bg-[#07050d]/90 border border-primary/20 rounded font-terminal crt-screen">
              
              {user.role === "ADMIN" ? (
                // Admin monitor
                <>
                  <CardHeader className="border-b border-primary/10 bg-[#0f0e20]/60 p-4">
                    <CardTitle className="text-neon-pink text-lg font-pixel flex items-center gap-2">
                      <Terminal className="h-5 w-5 text-primary" />
                      ADMIN_LIVE_MONITOR
                    </CardTitle>
                    <CardDescription className="text-[10px] text-muted-foreground uppercase">
                      MONITOR SUBMISSIONS AND FORCE EXECUTIONS
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 text-center space-y-6">
                    <div className="max-w-md mx-auto space-y-4 py-8">
                      <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto shadow-neon-pink" />
                      <h2 className="font-bold text-white text-lg uppercase tracking-wider">CONTEST_IN_PROGRESS</h2>
                      <p className="text-xs text-muted-foreground uppercase leading-relaxed">
                        Contestants are actively selecting answers. You can wait for the timer to expire or force terminate the session to trigger score calculations immediately.
                      </p>
                      <Button 
                        onClick={handleEndQuiz}
                        className="w-full font-bold uppercase tracking-widest text-sm py-4 border-2 border-red-500 text-red-400 hover:bg-red-950 hover:text-white bg-transparent"
                      >
                        TERMINATE_PROTOCOL_NOW
                      </Button>
                    </div>
                  </CardContent>
                </>
              ) : isPlayerSubmitted ? (
                // Submission Waiting Screen
                <>
                  <CardHeader className="border-b border-primary/10 bg-[#0f0e20]/60 p-4">
                    <CardTitle className="text-neon-pink text-lg font-pixel flex items-center gap-2">
                      <Terminal className="h-5 w-5 text-primary" />
                      SUBMISSION_SECURED
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    <div className="text-center py-4 space-y-3">
                      <CheckCircle2 className="h-14 w-14 text-green-400 mx-auto animate-pulse" />
                      <h2 className="font-bold text-white text-md tracking-wider uppercase">ANSWERS COMPILED SUCCESSFULLY</h2>
                      <p className="text-[10px] text-muted-foreground uppercase max-w-sm mx-auto leading-relaxed">
                        Lobby active. Your submission payload has been verified and stored in the database. Sockets will push final rank results once the session ends.
                      </p>
                    </div>

                    {/* Scrolling terminal logs */}
                    <div className="text-left bg-[#090812] border border-primary/20 p-4 rounded font-mono text-[10px] text-green-400 space-y-1 h-36 overflow-y-auto uppercase select-none">
                      {logs.map((log, index) => (
                        <div key={index} className="animate-pulse">
                          {log}
                        </div>
                      ))}
                      <div className="animate-ping font-bold text-xs text-primary mt-1">_</div>
                    </div>
                  </CardContent>
                </>
              ) : (
                // User gameplay screen
                <>
                  {currentQuestion ? (
                    <>
                      <CardHeader className="border-b border-primary/10 bg-[#0f0e20]/60 p-5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] text-muted-foreground uppercase">QUESTION {currentQIndex + 1} OF {questions.length}</span>
                          <span className="text-[9px] bg-accent/20 border border-accent text-accent px-1.5 py-0.5 rounded font-bold uppercase">
                            MULTIPLE_SELECT_SUPPORTED
                          </span>
                        </div>
                        <CardTitle className="text-white text-base tracking-wider uppercase leading-snug">
                          {currentQuestion.text}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        
                        {/* Synced Timer Progress Bar */}
                        {remainingSecs !== null && durationMin && (
                          <div className="w-full h-1.5 bg-[#090812] border border-primary/25 rounded-full overflow-hidden mb-2">
                            <motion.div
                              initial={{ width: "100%" }}
                              animate={{ 
                                width: `${(remainingSecs / (durationMin * 60)) * 100}%` 
                              }}
                              transition={{ duration: 1, ease: "linear" }}
                              className="h-full bg-gradient-to-r from-neon-pink to-neon-cyan"
                            />
                          </div>
                        )}

                        {/* Multiple Choice Option Buttons (Kahoot-inspired) */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          {currentQuestion.options.map((opt, index) => {
                            const isSelected = (answers[currentQuestion.id] || []).includes(opt.id);
                            const style = optionStyles[index % optionStyles.length];
                            return (
                              <button
                                key={opt.id}
                                disabled={submitting || isPlayerSubmitted}
                                onClick={() => handleToggleOption(opt.id)}
                                className={`w-full flex items-center justify-between text-left text-xs uppercase p-5 rounded-md border-2 transition-all duration-200 cursor-pointer ${
                                  isSelected 
                                    ? style.selectedBg 
                                    : `${style.bg} hover:scale-[1.01]`
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {/* Kahoot-inspired Symbol Badge */}
                                  <div className={`h-6 w-6 rounded-sm flex items-center justify-center font-bold text-sm ${style.symbolBg}`}>
                                    {style.symbol}
                                  </div>
                                  <span className="font-bold tracking-wide text-white">{opt.text}</span>
                                </div>
                                
                                <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center ${
                                  isSelected 
                                    ? "border-white bg-white/20" 
                                    : "border-white/10 bg-transparent"
                                }`}>
                                  {isSelected && <Check className="h-2.5 w-2.5 stroke-[3] text-white" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center pt-2 border-t border-primary/10">
                          <Button
                            disabled={currentQIndex === 0}
                            onClick={() => setCurrentQIndex(prev => prev - 1)}
                            variant="ghost"
                            className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-white"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            PREV
                          </Button>

                          {currentQIndex < questions.length - 1 ? (
                            <Button
                              onClick={() => setCurrentQIndex(prev => prev + 1)}
                              variant="ghost"
                              className="text-xs font-bold uppercase tracking-widest text-secondary hover:text-white"
                            >
                              NEXT
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          ) : (
                            <Button
                              onClick={executeSubmission}
                              disabled={submitting}
                              className="retro-btn-pink font-bold uppercase tracking-widest text-xs h-9 px-6 animate-pulse"
                            >
                              {submitting ? "SUBMITTING..." : "SUBMIT_PAYLOAD"}
                            </Button>
                          )}
                        </div>

                      </CardContent>
                    </>
                  ) : (
                    <CardContent className="p-6 text-center text-xs text-muted-foreground uppercase">
                      Error: Questions cache empty.
                    </CardContent>
                  )}
                </>
              )}
            </Card>

            {/* Live Participant Submission Directory */}
            <Card className="bg-[#07050d]/90 border border-secondary/20 rounded font-terminal">
              <CardHeader className="border-b border-secondary/10 bg-[#0e1d24]/60 p-4">
                <CardTitle className="text-neon-cyan text-sm font-pixel flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-secondary" />
                  SUBMISSIONS ({participants.filter(p => p.status === "SUBMITTED").length}/{participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2 max-h-[350px] overflow-y-auto">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between border border-secondary/10 bg-[#090812]/80 p-2.5 rounded text-[10px]">
                      <span className="font-bold text-white max-w-[100px] truncate">{p.user?.name}</span>
                      
                      <div className="flex items-center gap-1.5">
                        {p.status === "SUBMITTED" ? (
                          <span className="bg-green-500/10 border border-green-500/20 text-green-400 px-1.5 py-0.5 rounded text-[8px] font-bold">
                            SUBMITTED
                          </span>
                        ) : (
                          <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded text-[8px] font-bold animate-pulse">
                            TAKING
                          </span>
                        )}
                        {user.role === "ADMIN" && (
                          <button
                            onClick={() => handleKickParticipant(p.userId)}
                            className="text-red-400 hover:text-white hover:bg-red-500 border border-red-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold transition duration-150"
                          >
                            KICK
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* State C: ENDED */}
        {session.status === "ENDED" && (
          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            
            {/* Leaderboard Scoreboard */}
            <Card className="bg-[#07050d]/90 border border-accent/20 rounded font-terminal crt-screen">
              <CardHeader className="border-b border-accent/10 bg-[#0e0920]/60 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-neon-violet text-lg font-pixel flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-accent text-neon-violet" />
                    TOURNAMENT_LEADERBOARD
                  </CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground uppercase">
                    OFFICIAL STANDINGS AND CALCULATION RECORDS
                  </CardDescription>
                </div>
                
                {/* Top-N filter selector */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground font-bold uppercase tracking-wider">DISPLAY_LIMIT:</span>
                  <select 
                    value={topN} 
                    onChange={(e) => setTopN(Number(e.target.value))}
                    className="bg-[#090812] border border-accent/20 text-white rounded px-2 py-1 text-xs focus:ring-0 focus:border-accent uppercase font-bold"
                  >
                    <option value="3">TOP 3</option>
                    <option value="5">TOP 5</option>
                    <option value="10">TOP 10</option>
                    <option value="999">ALL_NODES</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                
                {/* Top 3 Podium Cards */}
                {displayedLeaderboard.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-3 mb-6 font-terminal">
                    {/* 2nd Place */}
                    {displayedLeaderboard[1] && (
                      <div className="border border-accent/20 bg-[#090812]/80 p-4 rounded text-center relative order-2 md:order-1">
                        <Crown className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                        <div className="font-pixel text-xl font-bold text-slate-300">2ND</div>
                        <div className="font-bold text-sm text-white truncate uppercase">{displayedLeaderboard[1].user?.name}</div>
                        <div className="text-xs text-accent mt-1">{displayedLeaderboard[1].score}/{displayedLeaderboard[1].totalQuestions} ({displayedLeaderboard[1].percentage.toFixed(1)}%)</div>
                      </div>
                    )}

                    {/* 1st Place Champion */}
                    {displayedLeaderboard[0] && (
                      <div className="border-2 border-secondary bg-[#0e1d24]/80 p-5 rounded text-center relative order-1 md:order-2 shadow-cyan scale-105">
                        <Crown className="h-8 w-8 text-yellow-400 mx-auto mb-2 animate-bounce" />
                        <div className="font-pixel text-2xl font-bold text-yellow-400">CHAMPION</div>
                        <div className="font-bold text-md text-white truncate uppercase">{displayedLeaderboard[0].user?.name}</div>
                        <div className="text-sm text-secondary font-bold mt-1">{displayedLeaderboard[0].score}/{displayedLeaderboard[0].totalQuestions} ({displayedLeaderboard[0].percentage.toFixed(1)}%)</div>
                      </div>
                    )}

                    {/* 3rd Place */}
                    {displayedLeaderboard[2] && (
                      <div className="border border-accent/20 bg-[#090812]/80 p-4 rounded text-center relative order-3">
                        <Crown className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                        <div className="font-pixel text-xl font-bold text-amber-600">3RD</div>
                        <div className="font-bold text-sm text-white truncate uppercase">{displayedLeaderboard[2].user?.name}</div>
                        <div className="text-xs text-accent mt-1">{displayedLeaderboard[2].score}/{displayedLeaderboard[2].totalQuestions} ({displayedLeaderboard[2].percentage.toFixed(1)}%)</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Scoreboard table */}
                {displayedLeaderboard.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground uppercase">
                    Awaiting scoreboard compilation logs...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs uppercase tracking-wider">
                      <thead>
                        <tr className="border-b border-accent/20 text-accent text-[10px]">
                          <th className="pb-3">RANK</th>
                          <th className="pb-3">CONTESTANT</th>
                          <th className="pb-3 text-center">SCORE</th>
                          <th className="pb-3 text-center">PERCENTAGE</th>
                          <th className="pb-3 text-right">TIME_TAKEN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-accent/10">
                        {displayedLeaderboard.map((row) => {
                          const isCurrentUser = row.userId === user?.id;
                          return (
                            <tr key={row.id} className={`hover:bg-accent/5 ${isCurrentUser ? "bg-accent/10 border-y border-accent" : ""}`}>
                              <td className="py-3 font-bold text-white">
                                <span className={`px-2 py-0.5 rounded font-pixel text-sm ${row.rank === 1 ? "bg-yellow-500/10 text-yellow-400" : "bg-[#14122b] text-muted-foreground"}`}>
                                  #{row.rank}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="font-bold text-white">{row.user?.name}</div>
                                {isCurrentUser && <span className="text-[8px] bg-secondary text-black font-bold px-1.5 rounded uppercase">YOU</span>}
                              </td>
                              <td className="py-3 text-center font-bold text-secondary">{row.score}/{row.totalQuestions}</td>
                              <td className="py-3 text-center text-accent">{row.percentage.toFixed(1)}%</td>
                              <td className="py-3 text-right font-mono text-muted-foreground">{row.durationSeconds}s</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

              </CardContent>
            </Card>

            {/* User Personal Statistics */}
            <Card className="bg-[#07050d]/90 border border-secondary/20 rounded font-terminal">
              <CardHeader className="border-b border-secondary/10 bg-[#0e1d24]/60 p-4">
                <CardTitle className="text-neon-cyan text-sm font-pixel flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-secondary" />
                  PERSONAL_COCKPIT_LOG
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 text-center space-y-4">
                {user.role === "USER" ? (
                  (() => {
                    const mine = leaderboard.find((row) => row.userId === user.id);
                    if (!mine) {
                      return (
                        <div className="text-xs text-muted-foreground uppercase py-6">
                          No performance logs resolved.
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-4">
                        <Trophy className="h-12 w-12 text-yellow-400 mx-auto text-neon-pink" />
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase">FINAL_RANK</div>
                          <div className="text-4xl font-bold font-pixel text-primary text-neon-pink mt-1">#{mine.rank}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs border-t border-primary/10 pt-4">
                          <div className="bg-[#090812] border border-primary/10 p-2 rounded">
                            <div className="text-[9px] text-muted-foreground">SCORE</div>
                            <div className="font-bold text-white text-md mt-1">{mine.score}/{mine.totalQuestions}</div>
                          </div>
                          <div className="bg-[#090812] border border-primary/10 p-2 rounded">
                            <div className="text-[9px] text-muted-foreground">RATIO</div>
                            <div className="font-bold text-white text-md mt-1">{mine.percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="py-6 space-y-2 text-xs">
                    <ShieldAlert className="h-8 w-8 text-secondary mx-auto animate-pulse" />
                    <h3 className="font-bold text-white uppercase">ADMIN MONITOR ACTIVE</h3>
                    <p className="text-[10px] text-muted-foreground uppercase leading-relaxed">
                      You hosted this session. All contestant answers calculated successfully.
                    </p>
                  </div>
                )}

                <Button asChild size="sm" className="w-full font-bold uppercase tracking-widest text-xs h-9 retro-btn-cyan mt-4 bg-transparent">
                  <Link to={user.role === "ADMIN" ? "/admin" : "/profile"}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    RETURN_TO_COCKPIT
                  </Link>
                </Button>
              </CardContent>
            </Card>

          </div>
        )}

      </main>
    </div>
  );
}
