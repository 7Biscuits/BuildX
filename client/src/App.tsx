import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import QuizPage from "@/pages/QuizPage";
import AdminPage from "@/pages/AdminPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import LiveQuizSessionPage from "@/pages/LiveQuizSessionPage";
import ContactsPage from "@/pages/ContactsPage";
import ProfilePage from "@/pages/ProfilePage";
import VerificationPendingPage from "@/pages/VerificationPendingPage";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";
import ScrollToHash from "@/components/ScrollToHash";
import ProtectedRoute from "@/components/ProtectedRoute";

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
      </Routes>
    </>
  );
}
