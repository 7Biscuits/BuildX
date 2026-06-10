import { FormEvent, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, Sparkles, Terminal, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/authStore";

export default function AuthPanel() {
  const { login, register, status, message, user, clearMessage } = useAuthStore();
  const [receipt, setReceipt] = useState<File | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isLoading = status === "loading";

  useEffect(() => {
    // Clear state messages on mount
    clearMessage();
  }, [clearMessage]);

  useEffect(() => {
    // Redirect if authenticated
    if (user) {
      if (user.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/profile");
      }
    }
  }, [user, navigate]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await login({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!receipt) return;
    const form = new FormData(event.currentTarget);
    await register({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
      contact: String(form.get("contact")),
      institution: String(form.get("institution")),
      submittedAmount: String(form.get("submittedAmount") ?? ""),
      paymentReceipt: receipt,
    });
    setReceipt(null);
  }

  const blockedReason = (location.state as { blockedReason?: string } | null)?.blockedReason;
  const statusMessage =
    blockedReason === "pending"
      ? "Wait until admin has verified your payment receipt."
      : blockedReason === "rejected"
        ? "Payment rejected. Please upload a valid payment receipt."
        : message;

  return (
    <Card id="auth" className="glass-panel scroll-mt-24 shadow-glow border-primary/45 rounded-md overflow-hidden font-terminal crt-screen">
      {/* Visual neon banner */}
      <div className="h-2 bg-gradient-to-r from-primary via-accent to-secondary animate-pulse" />
      
      <CardHeader className="bg-[#0f0e20]/80 border-b border-primary/20">
        <CardTitle className="text-neon-pink font-pixel text-3xl flex items-center gap-2">
          <Terminal className="h-6 w-6 text-primary" />
          ENTER_BUILDX
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground uppercase tracking-wider">
          Proof of payment required for registration.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-[#090812]/90">
        <Tabs defaultValue="register" className="w-full">
          <TabsList className="grid grid-cols-2 bg-[#121124] border border-primary/20 rounded p-1 mb-6">
            <TabsTrigger 
              value="register" 
              className="font-bold tracking-widest text-xs uppercase data-[state=active]:bg-primary data-[state=active]:text-white rounded py-2 transition-all duration-200"
            >
              REGISTER
            </TabsTrigger>
            <TabsTrigger 
              value="login"
              className="font-bold tracking-widest text-xs uppercase data-[state=active]:bg-secondary data-[state=active]:text-black rounded py-2 transition-all duration-200"
            >
              LOGIN
            </TabsTrigger>
          </TabsList>

          {/* User Registration Form */}
          <TabsContent value="register">
            <form className="space-y-4" onSubmit={handleRegister}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field name="name" label="SYS_NAME" placeholder="Enter Full Name" />
                <Field name="email" label="SYS_EMAIL" type="email" placeholder="email@address.com" />
                <Field name="contact" label="SYS_CONTACT" placeholder="Contact digits" />
                <Field name="institution" label="SYS_ORGANIZATION" placeholder="School/College Name" />
                <Field name="password" label="SYS_PASSPHRASE" type="password" placeholder="Min 8 chars" />
                <Field name="submittedAmount" label="SYS_FEE_PAID" placeholder="e.g. 499" />
              </div>

              {/* Custom Retro Slip Uploader */}
              <div className="space-y-2">
                <Label htmlFor="paymentReceipt" className="text-xs text-secondary font-bold uppercase tracking-wider">PAYMENT_RECEIPT_PROOF (JPG/PNG/WEBP)</Label>
                <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-secondary/30 bg-[#0d0c18] p-4 text-center text-xs transition hover:border-secondary hover:shadow-cyan">
                  <Upload className="mb-2 h-5 w-5 text-secondary animate-bounce" />
                  <span className="font-semibold text-muted-foreground">
                  {receipt ? receipt.name : "LOAD RECEIPT FILE / RESUBMIT_VALID_RECEIPT"}
                  </span>
                  <Input
                    id="paymentReceipt"
                    className="sr-only"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(event) => setReceipt(event.target.files?.[0] ?? null)}
                    required
                  />
                </label>
              </div>

              <Button className="w-full font-bold uppercase tracking-widest retro-btn-pink" size="lg" disabled={isLoading || !receipt}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                EXECUTE_REGISTRATION
              </Button>
            </form>
          </TabsContent>

          {/* User Login Form */}
          <TabsContent value="login">
            <form className="space-y-4" onSubmit={handleLogin}>
              <Field name="email" label="SYS_EMAIL" type="email" placeholder="email@address.com" />
              <Field name="password" label="SYS_PASSPHRASE" type="password" placeholder="Enter password" />
              <Button className="w-full font-bold uppercase tracking-widest retro-btn-cyan" size="lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" /> : <Terminal className="mr-2 h-4 w-4" />}
                ESTABLISH_CONNECTION
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Message Log Console */}
        {statusMessage && (
          <div className="mt-6 border border-primary/20 bg-[#16152b]/80 p-3 rounded font-mono text-[11px] text-green-400">
            <div className="text-secondary font-bold mb-1 uppercase tracking-wider font-terminal">CONSOLE_LOG:</div>
            <p className="leading-5">{statusMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type FieldProps = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
};

function Field({ name, label, type = "text", placeholder }: FieldProps) {
  return (
    <div className="space-y-1.5 font-terminal">
      <Label htmlFor={name} className="text-xs text-primary font-bold uppercase tracking-wider">{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        className="bg-[#090812] border-primary/20 text-white rounded focus:border-secondary focus:ring-0 placeholder:text-muted-foreground/45 text-xs h-9 font-terminal"
        required
      />
    </div>
  );
}
