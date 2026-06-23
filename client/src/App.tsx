import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";
import ScrollToHash from "@/components/ScrollToHash";
import ProtectedRoute from "@/components/ProtectedRoute";

const HomePage = lazy(() => import("@/pages/HomePage"));
const QuizPage = lazy(() => import("@/pages/QuizPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const AdminLoginPage = lazy(() => import("@/pages/AdminLoginPage"));
const LiveQuizSessionPage = lazy(() => import("@/pages/LiveQuizSessionPage"));
const ContactsPage = lazy(() => import("@/pages/ContactsPage"));
const TeamPage = lazy(() => import("@/pages/TeamPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const VerificationPendingPage = lazy(() => import("@/pages/VerificationPendingPage"));

export default function App() {
  const { checkAuth, status, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (status === "loading" && !user) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-[#07060c] font-terminal text-secondary">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary shadow-neon-pink" />
          <span className="text-sm font-bold tracking-widest uppercase">Initializing System...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollToHash />
      <Suspense fallback={<FullPageLoader label="Loading module..." />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<HomePage />} />
          <Route path="/verification-pending" element={<VerificationPendingPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/register" element={<AdminLoginPage mode="register" />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute role="USER">
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Navigate to="/profile" replace />
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz"
            element={
              <ProtectedRoute requireVerified>
                <QuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/session/:sessionId"
            element={
              <ProtectedRoute requireVerified>
                <LiveQuizSessionPage />
              </ProtectedRoute>
            }
          />
          <Route path="/contact" element={<ContactsPage />} />
          <Route path="/team" element={<TeamPage />} />
        </Routes>
      </Suspense>
    </>
  );
}

function FullPageLoader({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 grid place-items-center bg-[#07060c] font-terminal text-secondary">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary shadow-neon-pink" />
        <span className="text-sm font-bold uppercase tracking-widest">{label}</span>
      </div>
    </div>
  );
}
