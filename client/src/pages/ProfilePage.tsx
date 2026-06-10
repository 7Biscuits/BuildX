import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  Award,
  Building2,
  CheckCircle2,
  Clock,
  Gamepad2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Trophy,
  UserRound,
  XCircle,
} from "lucide-react";
import InteractiveBackground from "@/components/InteractiveBackground";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { profileApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { AuthUser, QuizResult } from "@/types/api";

export default function ProfilePage() {
  const { user, status } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "idle" && !user) {
      navigate("/login", { replace: true, state: { blockedReason: "login" } });
      return;
    }

    let mounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);
        const result = await profileApi.getProfileOverview();
        if (!mounted) return;
        setProfile(result.profile);
        setQuizHistory(result.quizHistory);
      } catch (err) {
        if (!mounted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Unable to fetch your profile right now.",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (user) {
      void loadProfile();
    }

    return () => {
      mounted = false;
    };
  }, [navigate, status, user]);

  const stats = useMemo(() => {
    const attempts = quizHistory.length;
    const bestRank = quizHistory.reduce<number | null>((best, result) => {
      if (!result.rank) return best;
      return best === null ? result.rank : Math.min(best, result.rank);
    }, null);
    const averageScore =
      attempts === 0
        ? 0
        : quizHistory.reduce((sum, result) => sum + result.percentage, 0) /
          attempts;

    return { attempts, bestRank, averageScore };
  }, [quizHistory]);

  const memberSince = useMemo(() => {
    if (!profile?.createdAt) return null;

    const value = new Date(profile.createdAt);
    if (Number.isNaN(value.getTime())) return null;

    return value.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [profile?.createdAt]);
  const isVerified = profile?.status === "VERIFIED";
  const isRejected = profile?.status === "REJECTED";
  const rejectionReason =
    isRejected && profile?.paymentVerification?.rejectionReason
      ? profile.paymentVerification.rejectionReason
      : null;

  return (
    <div className="min-h-screen text-white font-terminal selection:bg-primary selection:text-white">
      <InteractiveBackground />
      <Navbar />

      <main className="container relative z-10 py-8">
        {loading ? (
          <ProfileSkeleton />
        ) : error ? (
          <Card className="glass-panel border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400">PROFILE_FETCH_FAILED</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="retro-btn-pink font-bold uppercase">
                <Link to="/">Return home</Link>
              </Button>
            </CardContent>
          </Card>
        ) : profile ? (
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="grid gap-6 lg:grid-cols-[0.85fr_1.45fr]"
          >
            <section className="space-y-6">
              <Card className="glass-panel border-primary/35 shadow-neon-pink rounded overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-secondary" />
                <CardHeader className="border-b border-primary/15 bg-[#0f0e20]/80">
                  <div className="flex items-center gap-4">
                    <div className="grid h-16 w-16 place-items-center rounded border border-primary/40 bg-primary/10 text-3xl font-pixel text-primary text-neon-pink">
                      {profile.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="font-pixel text-4xl text-white">
                        {profile.name}
                      </CardTitle>
                      <CardDescription className="text-xs uppercase tracking-widest">
                        BUILDX_PROFILE
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 bg-[#090812]/90 p-5">
                  <InfoRow icon={<Mail />} label="EMAIL" value={profile.email} />
                  {profile.contact && (
                    <InfoRow icon={<Phone />} label="CONTACT" value={profile.contact} />
                  )}
                  <InfoRow
                    icon={<Building2 />}
                    label="INSTITUTION"
                    value={profile.institution}
                  />
                  {memberSince && (
                    <InfoRow icon={<Clock />} label="MEMBER SINCE" value={memberSince} />
                  )}
                  <div className="rounded border border-white/10 bg-[#0d0c18] p-4">
                    <div className="flex items-center gap-2 text-white">
                      <ShieldCheck className="h-4 w-4 text-secondary" />
                      <span className="text-xs font-bold uppercase tracking-widest">
                        Payment Verification Status
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <StatusBadge
                        active={profile.status === "PENDING"}
                        tone="pending"
                        icon={<Clock className="h-4 w-4" />}
                        label="Pending"
                      />
                      <StatusBadge
                        active={isVerified}
                        tone="verified"
                        icon={<CheckCircle2 className="h-4 w-4" />}
                        label="Verified"
                      />
                      <StatusBadge
                        active={isRejected}
                        tone="rejected"
                        icon={<XCircle className="h-4 w-4" />}
                        label="Rejected"
                      />
                    </div>
                    {isRejected && rejectionReason ? (
                      <p className="mt-3 text-sm text-rose-300">
                        Rejection reason: {rejectionReason}
                      </p>
                    ) : null}
                    {!isVerified ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Quiz access will unlock after your payment receipt is verified by an admin.
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <MetricCard
                  icon={<Gamepad2 className="h-5 w-5" />}
                  label="Joined quizzes"
                  value={isVerified ? stats.attempts : "--"}
                />
                <MetricCard
                  icon={<Trophy className="h-5 w-5" />}
                  label="Best rank"
                  value={isVerified && stats.bestRank ? `#${stats.bestRank}` : "--"}
                />
                <MetricCard
                  icon={<Award className="h-5 w-5" />}
                  label="Avg score"
                  value={isVerified ? `${stats.averageScore.toFixed(1)}%` : "--"}
                />
              </div>
            </section>

            <section>
              <Card className="glass-panel-cyan min-h-full rounded border-secondary/30 shadow-neon-cyan">
                <CardHeader className="border-b border-secondary/15 bg-[#0e1d24]/70">
                  <CardTitle className="flex items-center gap-2 font-pixel text-3xl text-secondary text-neon-cyan">
                    <Clock className="h-5 w-5" />
                    QUIZ_HISTORY_LOG
                  </CardTitle>
                  <CardDescription className="text-xs uppercase tracking-widest">
                    Scores, ranks, and performance snapshots from backend history.
                  </CardDescription>
                </CardHeader>
                <CardContent className="bg-[#090812]/88 p-5">
                  {!isVerified ? (
                    <LockedQuizHistory />
                  ) : quizHistory.length === 0 ? (
                    <EmptyHistory />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[680px] text-left text-xs uppercase tracking-wider">
                        <thead>
                          <tr className="border-b border-secondary/20 text-secondary">
                            <th className="pb-3">Quiz</th>
                            <th className="pb-3 text-center">Score</th>
                            <th className="pb-3 text-center">Percentage</th>
                            <th className="pb-3 text-center">Rank</th>
                            <th className="pb-3 text-right">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary/10">
                          {quizHistory.map((result, index) => (
                            <motion.tr
                              key={result.id ?? `${result.quizId}-${index}`}
                              initial={{ opacity: 0, x: 18 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.04 }}
                              className="hover:bg-secondary/5"
                            >
                              <td className="py-4 font-bold text-white">
                                {result.quiz?.title ?? result.quizId ?? "BUILDX_QUIZ"}
                              </td>
                              <td className="py-4 text-center text-secondary">
                                {result.score}/{result.totalQuestions}
                              </td>
                              <td className="py-4 text-center text-accent">
                                {result.percentage.toFixed(1)}%
                              </td>
                              <td className="py-4 text-center">
                                <span className="rounded border border-primary/25 bg-primary/8 px-2 py-1 font-pixel text-lg text-primary">
                                  #{result.rank}
                                </span>
                              </td>
                              <td className="py-4 text-right text-muted-foreground">
                                {result.durationSeconds}s
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </motion.div>
        ) : null}
      </main>
    </div>
  );
}

function StatusBadge({
  active,
  tone,
  icon,
  label,
}: {
  active: boolean;
  tone: "pending" | "verified" | "rejected";
  icon: ReactNode;
  label: string;
}) {
  const activeClass =
    tone === "verified"
      ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-300"
      : tone === "rejected"
        ? "border-rose-500/35 bg-rose-500/12 text-rose-300"
        : "border-amber-500/35 bg-amber-500/12 text-amber-300";

  return (
    <div
      className={`flex items-center gap-2 rounded border px-3 py-2 text-sm ${
        active
          ? activeClass
          : "border-white/10 bg-white/5 text-muted-foreground"
      }`}
    >
      {icon}
      <span className="font-bold uppercase tracking-widest">{label}</span>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded border border-primary/15 bg-[#0d0c18] p-3">
      <div className="flex items-center gap-2 text-primary">
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <p className="mt-1 break-words text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded border border-secondary/25 bg-[#07050d]/88 p-4 shadow-neon-cyan"
    >
      <div className="flex items-center gap-2 text-secondary">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <div className="mt-2 font-pixel text-4xl text-white">{value}</div>
    </motion.div>
  );
}

function EmptyHistory() {
  return (
    <div className="grid place-items-center rounded border border-dashed border-secondary/25 bg-[#0b0914]/80 px-6 py-16 text-center">
      <UserRound className="mb-4 h-12 w-12 text-secondary/45" />
      <h3 className="font-pixel text-3xl text-white">NO_QUIZ_HISTORY</h3>
      <p className="mt-2 max-w-md text-xs uppercase leading-relaxed text-muted-foreground">
        You have not joined or submitted any BuildX quiz sessions yet. Scores and
        rankings will appear here once the backend publishes results.
      </p>
      <Button asChild className="mt-5 retro-btn-cyan font-bold uppercase tracking-widest">
        <Link to="/quiz">Join quiz</Link>
      </Button>
    </div>
  );
}

function LockedQuizHistory() {
  return (
    <div className="grid place-items-center rounded border border-dashed border-secondary/25 bg-[#0b0914]/80 px-6 py-16 text-center">
      <Lock className="mb-4 h-12 w-12 text-secondary/45" />
      <h3 className="font-pixel text-3xl text-white">QUIZ_LOCKED</h3>
      <p className="mt-2 max-w-md text-xs uppercase leading-relaxed text-muted-foreground">
        Your account has been created successfully. Quiz access will unlock after
        payment verification is marked as VERIFIED by an admin.
      </p>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.45fr]">
      <SkeletonPanel />
      <SkeletonPanel rows={8} />
    </div>
  );
}

function SkeletonPanel({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded border border-primary/20 bg-[#090812]/80 p-5">
      <div className="mb-6 h-16 w-16 animate-pulse rounded bg-primary/20" />
      <div className="mb-4 h-7 w-2/3 animate-pulse rounded bg-white/10" />
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="mb-3 h-12 animate-pulse rounded border border-white/5 bg-white/10"
        />
      ))}
    </div>
  );
}
