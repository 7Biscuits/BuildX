import { FormEvent, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Gamepad2, PlugZap, ArrowLeft, ShieldAlert } from "lucide-react";
import InteractiveBackground from "@/components/InteractiveBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { useQuizStore } from "@/store/quizStore";

export default function QuizPage() {
  const { user, status } = useAuthStore();
  const { joinQuiz } = useQuizStore();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If not authenticated, redirect to home
    if (status === "idle" && !user) {
      navigate("/");
    }
  }, [user, status, navigate]);

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const joinCode = String(form.get("joinCode")).trim();
    if (!joinCode) return;

    setLoading(true);
    setMessage(null);
    try {
      const sessionId = await joinQuiz(joinCode);
      navigate(`/quiz/session/${sessionId}`);
    } catch (err: any) {
      setMessage(err.message || "Could not join this quiz session. Verify code and verification status.");
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen text-white font-terminal selection:bg-primary selection:text-white">
      <InteractiveBackground />
      
      <main className="container grid min-h-screen place-items-center py-12 relative z-10">
        
        <div className="absolute top-4 left-4">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-white font-bold gap-1 font-terminal">
            <Link to={user.role === "ADMIN" ? "/admin" : "/profile"}>
              <ArrowLeft className="h-4 w-4" />
              ABORT_TO_COCKPIT
            </Link>
          </Button>
        </div>

        <Card className="glass-panel w-full max-w-xl shadow-glow border-secondary/40 rounded overflow-hidden crt-screen">
          <div className="h-1.5 bg-gradient-to-r from-secondary via-blue-500 to-cyan-400 animate-pulse" />
          
          <CardHeader className="bg-[#0f0e20]/80 border-b border-secondary/20 p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center bg-secondary/15 border border-secondary text-secondary rounded shadow-neon-cyan animate-pulse">
              <Gamepad2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-neon-cyan text-3xl font-pixel text-secondary">QUIZ_ENTER_PORTAL</CardTitle>
            <CardDescription className="text-xs text-muted-foreground uppercase tracking-widest font-terminal">
              CONNECTION GATEWAY • INPUT 4-12 CHARACTER LIVE JOIN SESSION PASSCODE
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-[#090812]/90">
            
            <form className="space-y-4" onSubmit={handleJoin}>
              <div className="space-y-2 text-left">
                <Label htmlFor="joinCode" className="text-xs text-secondary font-bold uppercase tracking-widest">SESSION_JOIN_CODE</Label>
                <Input 
                  id="joinCode" 
                  name="joinCode" 
                  placeholder="E.G. BX2026" 
                  required 
                  className="bg-[#0c0a1a] border-secondary/20 uppercase tracking-widest text-white rounded focus:border-secondary focus:ring-0 placeholder:text-muted-foreground/30 h-10 font-terminal text-sm"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full font-bold uppercase tracking-widest retro-btn-cyan py-6" size="lg">
                <PlugZap className="h-5 w-5 mr-2" />
                ESTABLISH_SESSION_LINK
              </Button>
            </form>

            {message && (
              <div className="mt-6 border border-secondary/20 bg-[#16152b]/80 p-3 rounded font-mono text-[11px] text-red-400">
                <div className="text-secondary font-bold mb-1 uppercase tracking-wider font-terminal">CONSOLE_LOG:</div>
                <p className="leading-5">{message}</p>
              </div>
            )}

            <Button asChild variant="ghost" className="mt-4 w-full text-xs hover:text-white text-muted-foreground uppercase font-terminal">
              <Link to="/">DISCONNECT_TERMINAL</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
