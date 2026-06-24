import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { LogOut, ShieldAlert, Gamepad2, UserRound, Lock, Menu, X } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: "HOME", to: "/#home" },
    { label: "TIMELINE", to: "/#timeline" },
    { label: "SPONSORS", to: "/#sponsors" },
    { label: "CONTACT US", to: "/#contactus" },
    { label: "BUILDX TEAM", to: "/team" },
  ];

  async function handleLogout() {
    setIsMenuOpen(false);
    await logout();
    navigate("/");
  }
  const canAccessProfile = user?.role === "USER";
  const canAccessQuiz = user?.role === "USER" && user.status === "VERIFIED";

  function handleNavItemClick(target: string) {
    setIsMenuOpen(false);

    if (!target.includes("#")) {
      return;
    }

    const targetHash = target.split("#")[1];

    if (location.pathname === "/") {
      const element = document.getElementById(targetHash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", target);
      }
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-primary/30 bg-[#07060c]/90 backdrop-blur-md">
      <nav className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-neon-pink">
          <img src="/images/cobit_logo.png" alt="Cobit labs Logo" className="h-9 w-auto object-contain" />
          <span className="tracking-wider text-white hidden sm:inline">Cobit labs</span>
        </Link>

        {/* Navigation links */}
        <div className="hidden items-center gap-6 text-sm font-bold tracking-widest md:flex font-terminal">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={(e) => {
                if (item.to.includes("#") && location.pathname === "/") {
                  e.preventDefault();
                  handleNavItemClick(item.to);
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
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-10 w-10 border-primary/25 bg-[#0d0b16] text-white hover:bg-primary/10 hover:text-secondary md:hidden"
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {user ? (
            <div className="hidden items-center gap-3 md:flex">
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
                    <span><span className="hidden sm:inline">GO TO </span>PROFILE</span>
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
                  <span><span className="hidden sm:inline">GO TO </span>PROFILE</span>
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
              className="hidden cursor-not-allowed border-white/15 text-muted-foreground/60 opacity-70 md:inline-flex"
              disabled
            >
              <Lock className="mr-1 h-4 w-4" />
              <span><span className="hidden sm:inline">GO TO </span>PROFILE</span>
            </Button>
          )}
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="border-t border-primary/20 bg-[#09070f]/96 px-4 py-4 md:hidden"
          >
            <div className="container space-y-3">
              <div className="grid gap-2 rounded-md border border-primary/15 bg-[#0f0c18]/90 p-3 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => handleNavItemClick(item.to)}
                    className="rounded-md border border-transparent px-3 py-3 text-sm font-bold tracking-widest text-slate-200 transition hover:border-secondary/25 hover:bg-secondary/10 hover:text-secondary"
                  >
                    {item.label}
                  </Link>
                ))}

                {canAccessQuiz ? (
                  <Link
                    to="/quiz"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-3 text-sm font-bold tracking-widest text-slate-200 transition hover:border-secondary/25 hover:bg-secondary/10 hover:text-secondary"
                  >
                    <Gamepad2 className="h-4 w-4" />
                    QUIZ
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 rounded-md px-3 py-3 text-sm font-bold tracking-widest text-muted-foreground/50">
                    <Lock className="h-4 w-4" />
                    QUIZ
                  </div>
                )}
              </div>

              <div className="grid gap-2 rounded-md border border-white/10 bg-[#0c0a14]/92 p-3">
                {user ? (
                  <>
                    {user.role === "ADMIN" ? (
                      <Link
                        to="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2 rounded-md border border-accent/25 px-3 py-3 text-sm font-bold tracking-widest text-accent transition hover:bg-accent/10"
                      >
                        <ShieldAlert className="h-4 w-4" />
                        ADMIN
                      </Link>
                    ) : canAccessProfile ? (
                      <Link
                        to="/profile"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2 rounded-md border border-secondary/25 px-3 py-3 text-sm font-bold tracking-widest text-secondary transition hover:bg-secondary/10"
                      >
                        <UserRound className="h-4 w-4" />
                        GO TO PROFILE
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-3 text-sm font-bold tracking-widest text-muted-foreground/60">
                        <Lock className="h-4 w-4" />
                        GO TO PROFILE
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className="flex items-center gap-2 rounded-md border border-rose-500/20 px-3 py-3 text-left text-sm font-bold tracking-widest text-rose-300 transition hover:bg-rose-950/30"
                    >
                      <LogOut className="h-4 w-4" />
                      LOG OUT
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-3 text-sm font-bold tracking-widest text-muted-foreground/60">
                    <Lock className="h-4 w-4" />
                    GO TO PROFILE
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
