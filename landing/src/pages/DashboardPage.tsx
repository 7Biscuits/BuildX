import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Terminal, Gamepad2, History, User, Upload, CheckCircle, ArrowRight, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { useQuizStore } from "@/store/quizStore";
import { quizApi, paymentApi } from "@/lib/api";
import type { QuizResult } from "@/types/api";
import InteractiveBackground from "@/components/InteractiveBackground";
import Navbar from "@/components/Navbar";

export default function DashboardPage() {
  const { user, logout, status } = useAuthStore();
  const { joinQuiz } = useQuizStore();
  const navigate = useNavigate();
  
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  
  // Payment upload state
  const [receipt, setReceipt] = useState<File | null>(null);
  const [amount, setAmount] = useState("");
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    // If not authenticated, redirect to home
    if (status === "idle" && !user) {
      navigate("/");
      return;
    }
    
    // Check if user is Admin, redirect to admin panel
    if (user && user.role === "ADMIN") {
      navigate("/admin");
      return;
    }

    // Load quiz history
    async function loadHistory() {
      try {
        const result = await quizApi.getHistory();
        if (result.success && result.data) {
          setHistory(result.data);
        }
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setHistoryLoading(false);
      }
    }

    if (user) {
      loadHistory();
    }
  }, [user, status, navigate]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoinLoading(true);
    setJoinError(null);
    try {
      const sessionId = await joinQuiz(joinCode.trim());
      navigate(`/quiz/session/${sessionId}`);
    } catch (err: any) {
      setJoinError(err.message || "Could not join session. Verify join code.");
    } finally {
      setJoinLoading(false);
    }
  }

  async function handleUploadReceipt(e: React.FormEvent) {
    e.preventDefault();
    if (!receipt) return;
    setUploadLoading(true);
    setUploadMessage(null);
    try {
      const result = await paymentApi.uploadReceipt({
        submittedAmount: amount || undefined,
        paymentReceipt: receipt
      });
      if (result.success) {
        setUploadMessage("SUCCESS: Payment receipt slip uploaded successfully!");
        setReceipt(null);
        setAmount("");
      } else {
        setUploadMessage("ERROR: Upload was unsuccessful.");
      }
    } catch (err: any) {
      setUploadMessage(`ERROR: ${err.response?.data?.message || "Upload failed."}`);
    } finally {
      setUploadLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen text-white font-terminal selection:bg-primary selection:text-white">
      <InteractiveBackground />
      <Navbar />

      <main className="container py-8 relative z-10 grid gap-6 lg:grid-cols-[1fr_2fr]">
        
        {/* SIDEBAR - USER PROFILE INFO */}
        <div className="space-y-6">
          <Card className="bg-[#07050d]/90 border border-primary/20 shadow-neon-pink/5 rounded font-terminal crt-screen">
            <CardHeader className="border-b border-primary/10 bg-[#0f0e20]/60 p-4">
              <CardTitle className="text-neon-pink text-xl font-pixel flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                USER_PROFILE
              </CardTitle>
              <CardDescription className="text-[10px] text-muted-foreground uppercase">
                COCKPIT CONFIGURATION NODES
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <div className="text-muted-foreground uppercase text-[10px]">NAME:</div>
                <div className="text-white font-bold text-sm">{user.name}</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground uppercase text-[10px]">EMAIL_ADDRESS:</div>
                <div className="text-white font-bold">{user.email}</div>
              </div>
              {user.contact && (
                <div className="space-y-1">
                  <div className="text-muted-foreground uppercase text-[10px]">CONTACT_PHONE:</div>
                  <div className="text-white font-bold">{user.contact}</div>
                </div>
              )}
              <div className="space-y-1">
                <div className="text-muted-foreground uppercase text-[10px]">ORGANIZATION:</div>
                <div className="text-white font-bold">{user.institution}</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground uppercase text-[10px]">VERIFICATION_STATUS:</div>
                <div className="inline-flex items-center gap-1 bg-green-500/10 border border-green-500/30 text-green-400 font-bold px-2 py-0.5 rounded text-[10px] uppercase shadow-[0_0_8px_rgba(34,197,94,0.15)]">
                  <CheckCircle className="h-3 w-3" />
                  {user.status}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QUIZ PORT JOIN CODE */}
          <Card className="bg-[#07050d]/90 border border-secondary/20 shadow-neon-cyan/5 rounded font-terminal crt-screen">
            <CardHeader className="border-b border-secondary/10 bg-[#0e1d24]/60 p-4">
              <CardTitle className="text-neon-cyan text-xl font-pixel flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-secondary" />
                JOIN_ARENA
              </CardTitle>
              <CardDescription className="text-[10px] text-muted-foreground uppercase">
                CONNECT TO LIVE SESSION ROOMS
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleJoin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-[10px] text-secondary font-bold uppercase tracking-wider">ROOM_JOIN_CODE</Label>
                  <Input
                    id="code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="ENTER CODE (E.G. A1B2)"
                    className="bg-[#090812] border-secondary/20 text-white rounded focus:border-secondary focus:ring-0 placeholder:text-muted-foreground/30 text-xs h-9 uppercase font-terminal"
                  />
                </div>
                <Button type="submit" disabled={joinLoading} className="w-full font-bold uppercase tracking-widest text-xs h-9 retro-btn-cyan">
                  {joinLoading ? "JOINING_ROOM..." : "LAUNCH_QUIZ_ARENA"}
                </Button>
                {joinError && (
                  <div className="text-[10px] text-red-400 font-bold border border-red-500/20 bg-red-950/20 p-2 rounded mt-2">
                    ERROR: {joinError}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* DYNAMIC ADDITIONAL PAYMENTS UPLOADER */}
          <Card className="bg-[#07050d]/90 border border-primary/20 shadow-neon-pink/5 rounded font-terminal">
            <CardHeader className="border-b border-primary/10 bg-[#0f0e20]/60 p-4">
              <CardTitle className="text-neon-pink text-sm font-pixel flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                PAYMENT_NODE
              </CardTitle>
              <CardDescription className="text-[9px] text-muted-foreground uppercase">
                SUBMIT ADDITIONAL PAYMENTS
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleUploadReceipt} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="amount" className="text-[9px] text-primary font-bold uppercase">PAID_AMOUNT (INR)</Label>
                  <Input
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 499"
                    className="bg-[#090812] border-primary/20 text-white text-xs h-8 font-terminal"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] text-primary font-bold uppercase">SLIP_RECEIPT</Label>
                  <label className="flex h-14 cursor-pointer flex-col items-center justify-center rounded border border-dashed border-primary/20 bg-[#0d0c18] text-center text-[10px] hover:border-primary">
                    <span className="font-semibold text-muted-foreground truncate max-w-[150px] px-2">
                      {receipt ? receipt.name : "LOAD FILE"}
                    </span>
                    <Input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
                <Button type="submit" disabled={uploadLoading || !receipt} className="w-full text-[10px] h-8 retro-btn-pink font-bold uppercase tracking-widest">
                  {uploadLoading ? "UPLOADING..." : "UPLOAD_RECEIPT_SLIP"}
                </Button>
                {uploadMessage && (
                  <div className={`text-[9px] font-bold border p-2 rounded ${uploadMessage.startsWith("SUCCESS") ? "text-green-400 border-green-500/20 bg-green-950/20" : "text-red-400 border-red-500/20 bg-red-950/20"}`}>
                    {uploadMessage}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* MAIN BODY - QUIZ HISTORY LOG */}
        <div>
          <Card className="bg-[#07050d]/90 border border-primary/20 shadow-neon-pink/5 rounded font-terminal h-full crt-screen">
            <CardHeader className="border-b border-primary/10 bg-[#0f0e20]/60 p-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-neon-pink text-xl font-pixel flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  QUIZ_HISTORY_DATABASES
                </CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground uppercase">
                  ARCHIVED PERFORMANCE RECORDINGS
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {historyLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Terminal className="h-6 w-6 animate-pulse text-primary mr-2" />
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">SCANNING DATABASES...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-primary/20 rounded bg-[#0b0914]/80 p-8">
                  <Gamepad2 className="h-12 w-12 text-primary/30 mx-auto mb-3 animate-bounce" />
                  <h3 className="font-bold text-white tracking-widest uppercase mb-1">NO ARCHIVES FOUND</h3>
                  <p className="text-xs text-muted-foreground uppercase max-w-sm mx-auto leading-relaxed">
                    You have not participated in any live quiz sessions yet. Put in a join code inside the left console to connect!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs uppercase tracking-wider">
                    <thead>
                      <tr className="border-b border-primary/20 text-secondary text-neon-cyan text-[10px]">
                        <th className="pb-3 font-bold">QUIZ_NAME</th>
                        <th className="pb-3 font-bold text-center">SCORE</th>
                        <th className="pb-3 font-bold text-center">PERCENTAGE</th>
                        <th className="pb-3 font-bold text-center">RANK</th>
                        <th className="pb-3 font-bold text-right">DURATION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/10">
                      {history.map((row) => (
                        <tr key={row.id} className="hover:bg-primary/5 transition-all">
                          <td className="py-3 font-bold text-white max-w-[150px] truncate">
                            {row.quiz?.title || "UNRESOLVED_TITLE"}
                          </td>
                          <td className="py-3 text-center font-bold text-secondary">
                            {row.score}/{row.totalQuestions}
                          </td>
                          <td className="py-3 text-center text-accent">
                            {row.percentage.toFixed(1)}%
                          </td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-0.5 rounded font-pixel text-sm ${row.rank === 1 ? "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400" : "bg-[#14122b] border border-primary/20 text-muted-foreground"}`}>
                              #{row.rank}
                            </span>
                          </td>
                          <td className="py-3 text-right text-muted-foreground font-mono">
                            {row.durationSeconds}s
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
