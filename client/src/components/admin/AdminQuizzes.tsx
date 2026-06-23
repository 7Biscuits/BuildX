import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  Plus,
  Trash2,
  CheckCircle2,
  Play,
  Award,
  Copy,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Timer,
  ListOrdered,
  AlertTriangle,
  HelpCircle,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { quizApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/error";
import type { Quiz, QuizResult, QuizSessionState } from "@/types/api";

export function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // New quiz draft form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Add question form state
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [questionLoading, setQuestionLoading] = useState(false);

  // Finalize form state
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [leaderboardDisplayLimit, setLeaderboardDisplayLimit] = useState(10);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [finalizeLoading, setFinalizeLoading] = useState(false);
  const [finalizeSuccess, setFinalizeSuccess] = useState(false);

  // Live session state
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [liveSession, setLiveSession] = useState<QuizSessionState | null>(null);
  const [copied, setCopied] = useState(false);

  // Session results modal state
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [resultsSessionCode, setResultsSessionCode] = useState("");
  const [resultsList, setResultsList] = useState<QuizResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);

  // Watch selected quiz to initialize specs form
  useEffect(() => {
    if (selectedQuiz) {
      setDurationMinutes(selectedQuiz.durationMinutes ?? 15);
      setLeaderboardDisplayLimit(selectedQuiz.leaderboardDisplayLimit ?? 10);
      setFinalizeError(null);
      setFinalizeSuccess(false);
    } else {
      setFinalizeSuccess(false);
    }
  }, [selectedQuiz]);

  // Load quizzes on mount
  useEffect(() => {
    void fetchQuizzes();
  }, []);

  async function fetchQuizzes() {
    try {
      setLoading(true);
      setError(null);
      const res = await quizApi.getAdminQuizzes();
      if (res.success && res.data) {
        setQuizzes(res.data);
      }
    } catch (error) {
      setError("Failed to fetch quizzes. Please check database connectivity.");
    } finally {
      setLoading(false);
    }
  }

  // Handle quiz creation
  async function handleCreateQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) {
      setCreateError("Title is required");
      return;
    }
    try {
      setCreateLoading(true);
      setCreateError(null);
      const res = await quizApi.createDraftQuiz({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
      });

      if (res.success && res.data) {
        setQuizzes((prev) => [res.data, ...prev]);
        setSelectedQuiz(res.data);
        setIsCreating(false);
        setNewTitle("");
        setNewDescription("");
      } else {
        setCreateError(res.message || "Failed to create quiz.");
      }
    } catch (error) {
      setCreateError(getApiErrorMessage(error, "Failed to create quiz."));
    } finally {
      setCreateLoading(false);
    }
  }

  // Handle adding a question
  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedQuiz) return;
    setQuestionError(null);

    // Validation
    if (!questionText.trim()) {
      setQuestionError("Question text cannot be empty.");
      return;
    }

    const filteredOptions = options.map(o => ({ ...o, text: o.text.trim() }));
    if (filteredOptions.some(o => !o.text)) {
      setQuestionError("All options must contain text.");
      return;
    }

    if (!filteredOptions.some(o => o.isCorrect)) {
      setQuestionError("At least one option must be marked as correct.");
      return;
    }

    try {
      setQuestionLoading(true);
      const res = await quizApi.addQuestion(selectedQuiz.id, {
        text: questionText.trim(),
        options: filteredOptions,
      });

      if (res.success && res.data) {
        // Refetch selected quiz to refresh questions list
        const quizzesRes = await quizApi.getAdminQuizzes();
        if (quizzesRes.success && quizzesRes.data) {
          setQuizzes(quizzesRes.data);
          const updated = quizzesRes.data.find(q => q.id === selectedQuiz.id);
          if (updated) setSelectedQuiz(updated);
        }

        // Reset question form
        setQuestionText("");
        setOptions([
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ]);
      } else {
        setQuestionError(res.message || "Failed to add question.");
      }
    } catch (error) {
      setQuestionError(getApiErrorMessage(error, "Failed to add question."));
    } finally {
      setQuestionLoading(false);
    }
  }

  // Handle option changes
  function updateOptionText(index: number, text: string) {
    setOptions(options.map((opt, i) => i === index ? { ...opt, text } : opt));
  }

  function toggleOptionCorrect(index: number) {
    setOptions(options.map((opt, i) => i === index ? { ...opt, isCorrect: !opt.isCorrect } : opt));
  }

  function addOptionRow() {
    if (options.length >= 10) return;
    setOptions([...options, { text: "", isCorrect: false }]);
  }

  function removeOptionRow(index: number) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  }

  // Handle finalization
  async function handleFinalizeQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedQuiz) return;

    if (durationMinutes < 1 || durationMinutes > 240) {
      setFinalizeError("Duration must be between 1 and 240 minutes.");
      return;
    }

    if (leaderboardDisplayLimit < 1 || leaderboardDisplayLimit > 100) {
      setFinalizeError("Leaderboard limit must be between 1 and 100.");
      return;
    }

    try {
      setFinalizeLoading(true);
      setFinalizeError(null);
      setFinalizeSuccess(false);
      const res = await quizApi.finalizeQuiz(selectedQuiz.id, {
        durationMinutes,
        leaderboardDisplayLimit,
      });

      if (res.success && res.data) {
        setFinalizeSuccess(true);
        setTimeout(() => setFinalizeSuccess(false), 3000);
        // Refresh state
        const quizzesRes = await quizApi.getAdminQuizzes();
        if (quizzesRes.success && quizzesRes.data) {
          setQuizzes(quizzesRes.data);
          const updated = quizzesRes.data.find(q => q.id === selectedQuiz.id);
          if (updated) setSelectedQuiz(updated);
        }
      } else {
        setFinalizeError(res.message || "Failed to finalize quiz.");
      }
    } catch (error) {
      setFinalizeError(getApiErrorMessage(error, "Failed to finalize quiz."));
    } finally {
      setFinalizeLoading(false);
    }
  }

  // Handle loading session results
  async function handleLoadResults(sessionId: string, joinCode: string) {
    try {
      setResultsLoading(true);
      setResultsError(null);
      setResultsSessionCode(joinCode);
      setResultsModalOpen(true);
      
      const res = await quizApi.getLeaderboard(sessionId);
      if (res.success && res.data) {
        setResultsList(res.data.leaderboard);
      } else {
        setResultsError(res.message || "Failed to load results.");
      }
    } catch (error) {
      setResultsError(getApiErrorMessage(error, "Failed to load results."));
    } finally {
      setResultsLoading(false);
    }
  }

  // Handle spinning up a live session
  async function handleSpinSession() {
    if (!selectedQuiz) return;
    try {
      setSessionLoading(true);
      setSessionError(null);
      const res = await quizApi.createSession({
        quizId: selectedQuiz.id,
        allowLateJoin: false,
      });

      if (res.success && res.data) {
        setLiveSession(res.data);
      } else {
        setSessionError(res.message || "Failed to launch session.");
      }
    } catch (error) {
      setSessionError(getApiErrorMessage(error, "Failed to launch session."));
    } finally {
      setSessionLoading(false);
    }
  }

  // Copy passcode to clipboard
  function copyToClipboard(text: string) {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
      {/* LEFT COLUMN: QUIZ INDEX */}
      <Card className="border-white/10 bg-[#0d1018]/92 shadow-terminal">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
          <div>
            <CardTitle className="text-lg">Quiz Database</CardTitle>
            <CardDescription className="text-xs">Select or construct an arena</CardDescription>
          </div>
          <Button
            size="sm"
            className="h-8 bg-pink-500 text-white hover:bg-pink-600 shadow-[0_0_8px_rgba(219,39,119,0.3)] gap-1"
            onClick={() => {
              setIsCreating(true);
              setSelectedQuiz(null);
              setLiveSession(null);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        </CardHeader>
        <CardContent className="p-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-2 text-slate-400">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
              <span className="text-xs font-mono">LOADING SCHEMAS...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-md border border-rose-500/20 bg-rose-500/10 text-xs text-rose-300">
              {error}
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm font-mono">
              [ NO QUIZZES DETECTED ]
            </div>
          ) : (
            <div className="space-y-1 max-h-[550px] overflow-y-auto pr-1">
              {quizzes.map((quiz) => {
                const isSelected = selectedQuiz?.id === quiz.id;
                const isDraft = quiz.status === "DRAFT";
                const qCount = quiz.questions?.length ?? 0;

                return (
                  <button
                    key={quiz.id}
                    type="button"
                    onClick={() => {
                      setSelectedQuiz(quiz);
                      setIsCreating(false);
                      setLiveSession(null);
                    }}
                    className={`flex w-full flex-col text-left p-3 rounded-md border transition ${
                      isSelected
                        ? "bg-secondary/10 border-secondary text-white ring-1 ring-secondary/30"
                        : "border-white/5 bg-white/2 text-slate-300 hover:border-white/15 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex w-full justify-between items-start">
                      <span className="font-semibold text-sm truncate max-w-[180px]">{quiz.title}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                          isDraft
                            ? "border-pink-500/30 bg-pink-500/10 text-pink-400"
                            : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                        }`}
                      >
                        {quiz.status}
                      </span>
                    </div>
                    {quiz.description && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{quiz.description}</p>
                    )}
                    <div className="flex justify-between items-center mt-2.5 text-[10px] text-slate-400 font-mono">
                      <span>{qCount} Questions</span>
                      {quiz.durationMinutes && <span>{quiz.durationMinutes}m duration</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* RIGHT COLUMN: WORKSPACE */}
      <div className="space-y-5">
        <AnimatePresence mode="wait">
          {/* STATE 1: NO SELECTION */}
          {!selectedQuiz && !isCreating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <Card className="border-dashed border-white/10 bg-[#0d1018]/60 shadow-inner min-h-[350px] grid place-items-center text-center p-6">
                <div className="max-w-md space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400">
                    <Gamepad2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white font-mono">WORKSPACE DEPLOYED</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Choose an existing arena database item on the left panel, or trigger a new instance blueprint.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* STATE 2: NEW QUIZ FORM */}
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <Card className="border-white/10 bg-[#0d1018]/92 shadow-terminal">
                <CardHeader className="border-b border-white/10">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-pink-500" />
                    Create New Quiz Draft
                  </CardTitle>
                  <CardDescription>
                    Initialize a new quiz entity. Questions and play limits are configured in the next workshop phase.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleCreateQuiz} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Quiz Title
                      </label>
                      <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Retro Web Development Challenge"
                        required
                        className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Description (Optional)
                      </label>
                      <textarea
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Provide details about the bootcamp/domain topic..."
                        className="min-h-[100px] w-full rounded-md border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-slate-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                      />
                    </div>

                    {createError && (
                      <div className="rounded-md border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                        {createError}
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreating(false)}
                        className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createLoading}
                        className="bg-pink-500 text-white hover:bg-pink-600 shadow-[0_0_12px_rgba(219,39,119,0.4)]"
                      >
                        {createLoading ? "Compiling..." : "Deploy Draft"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STATE 3: SELECTED QUIZ PANEL */}
          {selectedQuiz && (
            <motion.div
              key={selectedQuiz.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
            >
              {/* QUIZ HEADER CARD */}
              <Card className="border-white/10 bg-[#0d1018]/92 shadow-terminal">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-white">{selectedQuiz.title}</h2>
                        <span
                          className={`text-xs font-mono px-2 py-0.5 rounded border ${
                            selectedQuiz.status === "DRAFT"
                              ? "border-pink-500/30 bg-pink-500/10 text-pink-400"
                              : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                          }`}
                        >
                          {selectedQuiz.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">
                        {selectedQuiz.description || "No description provided."}
                      </p>
                    </div>
                    {selectedQuiz.status === "READY" && !liveSession && (
                      <Button
                        onClick={handleSpinSession}
                        disabled={sessionLoading}
                        className="bg-cyan-500 text-slate-950 hover:bg-cyan-600 hover:text-white font-semibold shadow-[0_0_12px_rgba(49,186,245,0.4)] gap-2 whitespace-nowrap self-start sm:self-auto"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        {sessionLoading ? "Spinning Lobby..." : "Spin Live Room"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* LIVE SESSION PORTAL (IF LAUNCHED) */}
              {liveSession && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border border-cyan-500/30 bg-cyan-950/20 rounded-lg p-6 space-y-4"
                >
                  <div className="flex items-center gap-3 text-cyan-400">
                    <Play className="h-5 w-5 animate-pulse" />
                    <h3 className="font-bold text-lg font-mono tracking-widest uppercase">
                      LOBBY DEPLOYED SUCCESSFULLY
                    </h3>
                  </div>

                  <p className="text-sm text-slate-300">
                    Give this passcode to participants. They can input it on the Join Quiz page to connect in real-time.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 py-2">
                    <div className="flex items-center gap-2 bg-[#07060c] border border-cyan-500/50 rounded px-5 py-3 shadow-[inset_0_0_10px_rgba(49,186,245,0.1)]">
                      <span className="text-2xl font-bold font-mono tracking-[0.2em] text-cyan-400 pl-[0.2em]">
                        {liveSession.joinCode}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(liveSession.joinCode)}
                        className="h-8 w-8 text-cyan-400 hover:bg-cyan-500/10 ml-2"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    {copied && (
                      <span className="text-xs font-mono text-emerald-400 animate-pulse">
                        Copied code!
                      </span>
                    )}
                  </div>

                  {sessionError && (
                    <div className="rounded-md border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
                      {sessionError}
                    </div>
                  )}

                  <div className="pt-2 flex flex-wrap gap-3">
                    <Link to={`/quiz/session/${liveSession.id}`}>
                      <Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-600 font-semibold gap-2 shadow-[0_0_10px_rgba(49,186,245,0.3)]">
                        Enter Live Control Deck
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => setLiveSession(null)}
                      className="border-white/10 text-slate-400 hover:text-white"
                    >
                      Hide Portal
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* TWO PANEL WORKSPACE: ADD QUESTIONS & FINALIZE (DRAFT) vs QUESTIONS LIST (READY) */}
              <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,340px)]">
                {/* COLUMN A: QUESTIONS BOARD */}
                <div className="space-y-5">
                  <Card className="border-white/10 bg-[#0d1018]/92 shadow-terminal">
                    <CardHeader className="border-b border-white/10">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ListOrdered className="h-4 w-4 text-secondary" />
                        Questions Database ({selectedQuiz.questions?.length ?? 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      {(!selectedQuiz.questions || selectedQuiz.questions.length === 0) ? (
                        <div className="text-center py-12 text-slate-500 text-sm font-mono border border-dashed border-white/5 rounded-md">
                          [ NO QUESTIONS INJECTED YET ]
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedQuiz.questions.map((q, qIndex) => (
                            <div
                              key={q.id}
                              className="p-4 rounded-md border border-white/5 bg-white/2 space-y-3"
                            >
                              <div className="flex gap-2">
                                <span className="font-mono text-slate-500 font-bold">Q{qIndex + 1}.</span>
                                <p className="font-semibold text-slate-200 text-sm">{q.text}</p>
                              </div>
                              <div className="grid gap-2 sm:grid-cols-2 pl-6">
                                {q.options.map((opt, oIndex) => (
                                  <div
                                    key={opt.id}
                                    className={`flex items-center justify-between p-2 rounded text-xs border ${
                                      opt.isCorrect
                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                        : "border-white/5 bg-white/1 text-slate-400"
                                    }`}
                                  >
                                    <span className="truncate">{opt.text}</span>
                                    {opt.isCorrect && (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 ml-2" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* ADD QUESTION FORM (ONLY SHOWN IF DRAFT) */}
                      {selectedQuiz.status === "DRAFT" && (
                        <div className="border-t border-white/10 pt-6 mt-6">
                          <form onSubmit={handleAddQuestion} className="space-y-4">
                            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider text-pink-400">
                              + Inject Question Item
                            </h3>

                            <div className="space-y-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Question Text
                              </label>
                              <Input
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                placeholder="Write the question prompt here..."
                                className="h-10 border-white/10 bg-white/5 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                              />
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                  Answer Options (2 to 10 options)
                                </label>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={addOptionRow}
                                  disabled={options.length >= 10}
                                  className="h-7 text-xs text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 px-2"
                                >
                                  + Add Option Row
                                </Button>
                              </div>

                              <div className="space-y-2">
                                {options.map((option, index) => (
                                  <div key={index} className="flex gap-2 items-center">
                                    <input
                                      type="checkbox"
                                      checked={option.isCorrect}
                                      onChange={() => toggleOptionCorrect(index)}
                                      className="h-4 w-4 rounded border-slate-600 text-pink-500 bg-slate-900 focus:ring-pink-500 focus:ring-offset-slate-900 shrink-0"
                                      title="Mark as Correct Option"
                                    />
                                    <Input
                                      value={option.text}
                                      onChange={(e) => updateOptionText(index, e.target.value)}
                                      placeholder={`Option ${index + 1}...`}
                                      className={`h-9 text-xs border-white/10 bg-white/5 text-white focus:ring-1 focus:ring-pink-500 ${
                                        option.isCorrect ? "border-emerald-500/40 bg-emerald-500/5 focus:border-emerald-500" : ""
                                      }`}
                                    />
                                    {options.length > 2 && (
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => removeOptionRow(index)}
                                        className="h-8 w-8 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 shrink-0"
                                      >
                                        <Trash2 className="h-4.5 w-4.5" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {questionError && (
                              <div className="rounded-md border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
                                {questionError}
                              </div>
                            )}

                            <Button
                              type="submit"
                              disabled={questionLoading}
                              className="w-full bg-pink-500 text-white hover:bg-pink-600 shadow-[0_0_10px_rgba(219,39,119,0.3)] text-xs font-semibold py-2.5 h-auto uppercase tracking-widest font-mono"
                            >
                              {questionLoading ? "Injecting..." : "Inject Question to Draft"}
                            </Button>
                          </form>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* SESSION HISTORY CARD (ONLY SHOWN IF READY STATUS AND SESSIONS EXIST) */}
                  {selectedQuiz.status === "READY" && selectedQuiz.sessions && selectedQuiz.sessions.length > 0 && (
                    <Card className="border-white/10 bg-[#0d1018]/92 shadow-terminal mt-5">
                      <CardHeader className="border-b border-white/10">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="h-4.5 w-4.5 text-cyan-400" />
                          Session History & Standings
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Inspect past deployed game sessions, check passcodes, and load player scoreboards.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          {selectedQuiz.sessions.map((sess) => {
                            const dateStr = sess.startedAt
                              ? new Date(sess.startedAt).toLocaleString()
                              : "Not started";
                            const isEnded = sess.status === "ENDED";
                            const isRunning = sess.status === "RUNNING";

                            return (
                              <div
                                key={sess.id}
                                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 border border-white/5 bg-white/2 rounded-md"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-bold text-white">
                                      ROOM: {sess.joinCode}
                                    </span>
                                    <span
                                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                                        isEnded
                                          ? "border-slate-500/30 bg-slate-500/10 text-slate-400"
                                          : isRunning
                                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 animate-pulse"
                                          : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                                      }`}
                                    >
                                      {sess.status}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-mono">
                                    Started: {dateStr}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {(isEnded || isRunning) ? (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleLoadResults(sess.id, sess.joinCode)}
                                      className="h-8 text-xs border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 font-mono"
                                    >
                                      View Scoreboard
                                    </Button>
                                  ) : (
                                    <Link to={`/quiz/session/${sess.id}`}>
                                      <Button
                                        type="button"
                                        size="sm"
                                        className="h-8 text-xs bg-yellow-500 text-slate-950 hover:bg-yellow-600 font-mono font-semibold"
                                      >
                                        Enter Lobby
                                      </Button>
                                    </Link>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* COLUMN B: CONFIGURATION PANEL */}
                <div className="space-y-5">
                  <Card className="border-white/10 bg-[#0d1018]/92 shadow-terminal">
                    <CardHeader className="border-b border-white/10">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Timer className="h-4 w-4 text-cyan-400" />
                        {selectedQuiz.status === "DRAFT" ? "Finalize Quiz Configuration" : "Update Quiz Specifications"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <form onSubmit={handleFinalizeQuiz} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Duration (Minutes)
                          </label>
                          <Input
                            type="number"
                            min={1}
                            max={240}
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(Number(e.target.value))}
                            className="h-10 border-white/10 bg-white/5 text-white"
                          />
                          <p className="text-[10px] text-slate-500">
                            Time limit for gameplay execution in live session. All users get this duration.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Leaderboard Display Limit
                          </label>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={leaderboardDisplayLimit}
                            onChange={(e) => setLeaderboardDisplayLimit(Number(e.target.value))}
                            className="h-10 border-white/10 bg-white/5 text-white"
                          />
                          <p className="text-[10px] text-slate-500">
                            Number of top participants to list on public screens.
                          </p>
                        </div>

                        {finalizeError && (
                          <div className="rounded-md border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
                            {finalizeError}
                          </div>
                        )}

                        {finalizeSuccess && (
                          <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300 font-mono text-center">
                            ✓ Specifications updated.
                          </div>
                        )}

                        <Button
                          type="submit"
                          disabled={finalizeLoading || (selectedQuiz.status === "DRAFT" && (!selectedQuiz.questions || selectedQuiz.questions.length === 0))}
                          className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-600 hover:text-white font-semibold font-mono text-xs py-2.5 h-auto shadow-[0_0_12px_rgba(49,186,245,0.4)] disabled:opacity-50 disabled:pointer-events-none uppercase tracking-widest"
                        >
                          {finalizeLoading
                            ? "Compiling..."
                            : selectedQuiz.status === "DRAFT"
                            ? "Finalize & Ready Quiz"
                            : "Update Timer & Limits"}
                        </Button>

                        {selectedQuiz.status === "DRAFT" && (!selectedQuiz.questions || selectedQuiz.questions.length === 0) && (
                          <p className="text-[10px] text-rose-400 font-mono text-center">
                            * Add at least 1 question item to enable finalization.
                          </p>
                        )}
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SESSION RESULTS MODAL */}
      <AnimatePresence>
        {resultsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl rounded-lg border border-cyan-500/30 bg-[#0d1018] shadow-[0_0_30px_rgba(49,186,245,0.15)] overflow-hidden font-mono text-white max-h-[90vh] flex flex-col"
            >
              {/* CRT Scanline effect */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_120%,rgba(13,16,24,0.1),rgba(7,6,12,0.6))] z-10" />

              {/* Header */}
              <div className="border-b border-white/10 bg-[#0f0e20]/80 p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Award className="h-5 w-5 animate-pulse" />
                  <h3 className="font-bold text-lg tracking-wider">
                    SESSION_RESULTS_LOG: {resultsSessionCode}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setResultsModalOpen(false)}
                  className="text-slate-400 hover:text-white transition text-sm font-bold uppercase tracking-wider"
                >
                  [ CLOSE ]
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {resultsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <span className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                    <span className="text-xs font-mono text-cyan-400 animate-pulse">COMPILING SCOREBOARD...</span>
                  </div>
                ) : resultsError ? (
                  <div className="p-4 rounded border border-rose-500/20 bg-rose-500/10 text-xs text-rose-400">
                    {resultsError}
                  </div>
                ) : resultsList.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 text-sm">
                    [ NO CONTESTANTS DETECTED OR COMPLETED IN THIS SESSION ]
                  </div>
                ) : (
                  <div className="rounded border border-white/10 bg-black/40 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 uppercase tracking-wider text-slate-400 text-[10px]">
                            <th className="p-3 font-semibold text-center w-16">Rank</th>
                            <th className="p-3 font-semibold">User</th>
                            <th className="p-3 font-semibold">Email</th>
                            <th className="p-3 font-semibold text-center w-24">Score</th>
                            <th className="p-3 font-semibold text-center w-24">Ratio</th>
                            <th className="p-3 font-semibold text-center w-28">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                          {resultsList.map((res) => {
                            const isPodium = res.rank <= 3;
                            const podiumColor =
                              res.rank === 1
                                ? "text-yellow-400"
                                : res.rank === 2
                                ? "text-slate-300"
                                : "text-amber-600";

                            return (
                              <tr
                                key={res.id}
                                className={`transition hover:bg-white/2 ${
                                  isPodium ? "bg-cyan-500/2" : ""
                                }`}
                              >
                                <td className="p-3 text-center font-bold">
                                  {isPodium ? (
                                    <span className={`inline-flex items-center gap-1 ${podiumColor}`}>
                                      ★ {res.rank}
                                    </span>
                                  ) : (
                                    res.rank
                                  )}
                                </td>
                                <td className="p-3 font-semibold text-white">
                                  {res.user?.name || "Anonymous"}
                                </td>
                                <td className="p-3 text-slate-400">
                                  {res.user?.email || "--"}
                                </td>
                                <td className="p-3 text-center text-cyan-400 font-bold">
                                  {res.score}
                                </td>
                                <td className="p-3 text-center text-slate-300">
                                  {Math.round(res.percentage)}%
                                </td>
                                <td className="p-3 text-center text-slate-400">
                                  {res.durationSeconds}s
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-white/10 bg-[#0f0e20]/40 p-4 flex justify-between items-center text-[10px] text-slate-500 shrink-0">
                <span>TOTAL_PARTICIPANTS: {resultsList.length}</span>
                <span>SYSTEM_COMPILE_OK</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
