import { Link, useLocation } from "react-router-dom";
import { Clock3, FileUp, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import InteractiveBackground from "@/components/InteractiveBackground";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerificationPendingPage() {
  const location = useLocation();
  const reason = (location.state as { blockedReason?: string } | null)?.blockedReason;
  const rejected = reason === "rejected";

  return (
    <div className="min-h-screen text-white font-terminal">
      <InteractiveBackground />
      <Navbar />
      <main className="container grid min-h-[calc(100vh-4rem)] place-items-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-2xl"
        >
          <Card className="glass-panel border-primary/35 shadow-neon-pink rounded overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-secondary" />
            <CardHeader className="border-b border-primary/15 bg-[#0f0e20]/80">
              <div className="mb-4 grid h-14 w-14 place-items-center rounded border border-secondary/40 bg-secondary/10 text-secondary">
                {rejected ? <XCircle className="h-7 w-7" /> : <Clock3 className="h-7 w-7" />}
              </div>
              <CardTitle className="font-pixel text-4xl text-white">
                {rejected ? "PAYMENT_REJECTED" : "VERIFICATION_PENDING"}
              </CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest text-muted-foreground">
                {rejected
                  ? "Payment rejected. Please upload a valid payment receipt."
                  : "Wait until admin has verified your payment receipt."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 bg-[#090812]/90 p-6">
              <p className="text-sm uppercase leading-relaxed text-muted-foreground">
                Protected profile, dashboard, and quiz routes are available only after
                your BuildX account status is VERIFIED. Rejected receipts can be
                resubmitted from the registration panel using the same email and password.
              </p>
              <Button asChild className="retro-btn-cyan font-bold uppercase tracking-widest">
                <Link to="/#auth">
                  <FileUp className="mr-2 h-4 w-4" />
                  {rejected ? "RESUBMIT_RECEIPT" : "RETURN_TO_PORTAL"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
