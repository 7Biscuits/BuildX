import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { LogOut, ShieldAlert, Gamepad2, UserRound, Lock } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "HOME", to: "/#home" },
    { label: "TIMELINE", to: "/#timeline" },
    { label: "SPONSORS", to: "/#sponsors" },
    { label: "CONTACT US", to: "/#contactus" },
  ];

  async function handleLogout() {
    await logout();
    navigate("/");
  }
  const canAccessProfile = user?.role === "USER" && user.status === "VERIFIED";
  const canAccessQuiz = user?.role === "USER" && user.status === "VERIFIED";

  return (
    <header className="sticky top-0 z-40 border-b border-primary/30 bg-[#07060c]/90 backdrop-blur-md">
      <nav className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-neon-pink">
          <img src="/images/cobit_logo.png" alt="Cobit labs Logo" className="h-9 w-auto object-contain" />
          <span className="tracking-wider text-white">Cobit labs</span>
        </Link>

        {/* Navigation links */}
        <div className="hidden items-center gap-6 text-sm font-bold tracking-widest md:flex font-terminal">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={(e) => {
                const targetHash = item.to.split("#")[1];
                if (location.pathname === "/") {
                  e.preventDefault();
                  const element = document.getElementById(targetHash);
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                    window.history.pushState(null, "", item.to);
                  }
                }
              }}
              className="text-muted-foreground transition hover:text-secondary hover:text-neon-cyan"
            >
              {item.label}
            </Link>
          ))}
          {canAccessQuiz ? (
            <Link
              to="/quiz"
              className="flex items-center gap-1 text-muted-foreground transition hover:text-secondary hover:text-neon-cyan"
            >
              <Gamepad2 className="h-4 w-4" />
              QUIZ
            </Link>
          ) : (
            <span className="flex cursor-not-allowed items-center gap-1 text-muted-foreground/45">
              <Lock className="h-4 w-4" />
              QUIZ
            </span>
          )}
        </div>

        {/* Auth profile widget / Register button */}
        <div className="flex items-center gap-3 font-terminal">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-muted-foreground sm:inline-block">
                SYS: <span className="text-secondary font-bold">{user.name}</span>
              </span>

              {user.role === "ADMIN" ? (
                <Button asChild size="sm" variant="outline" className="border-accent text-accent hover:bg-accent/10">
                  <Link to="/admin" className="flex items-center gap-1">
                    <ShieldAlert className="h-4 w-4" />
                    ADMIN
                  </Link>
                </Button>
              ) : canAccessProfile ? (
                <Button asChild size="sm" variant="outline" className="border-secondary text-secondary hover:bg-secondary/10 hover:shadow-neon-cyan">
                  <Link to="/profile" className="flex items-center gap-1">
                    <UserRound className="h-4 w-4" />
                    GO TO PROFILE
                  </Link>
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-not-allowed border-white/15 text-muted-foreground/60 opacity-70"
                  disabled
                >
                  <Lock className="h-4 w-4" />
                  GO TO PROFILE
                </Button>
              )}

              <Button
                onClick={handleLogout}
                size="sm"
                variant="ghost"
                className="text-red-400 hover:bg-red-950/30 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="cursor-not-allowed border-white/15 text-muted-foreground/60 opacity-70"
              disabled
            >
              <Lock className="mr-1 h-4 w-4" />
              GO TO PROFILE
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
