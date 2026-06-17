import { FormEvent, useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Loader2, Sparkles, Terminal, Upload } from "lucide-react";
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
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"register" | "login">("register");
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
    clearMessage();
    setLocalMessage(null);
    const form = new FormData(event.currentTarget);
    await login({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessage();
    setLocalMessage(null);

    if (!receipt) {
      setLocalMessage("Please select a payment receipt image before registering.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const contact = String(form.get("contact") ?? "");
    const email = String(form.get("email") ?? "");
    const name = String(form.get("name") ?? "");
    const institution = String(form.get("institution") ?? "");

    const validationMessage = validateRegistrationInput({
      name,
      email,
      password,
      contact,
      institution,
      receipt,
    });

    if (validationMessage) {
      setLocalMessage(validationMessage);
      return;
    }
    const didRegister = await register({
      name,
      email,
      password,
      contact,
      institution,
      submittedAmount: String(form.get("submittedAmount") ?? ""),
      paymentReceipt: receipt,
    });

    if (didRegister) {
      event.currentTarget.reset();
      setReceipt(null);
      setActiveTab("login");
    }
  }

  const blockedReason = (location.state as { blockedReason?: string } | null)?.blockedReason;
  const statusMessage =
    blockedReason === "pending"
      ? "Wait until admin has verified your payment receipt."
      : blockedReason === "rejected"
        ? "Payment rejected. Please upload a valid payment receipt."
        : message ?? localMessage;
  const messageTone = useMemo(() => {
    if (!statusMessage) return null;

    if (
      statusMessage.toLowerCase().includes("registered successfully") ||
      statusMessage.toLowerCase().includes("verification is pending")
    ) {
      return "success";
    }

    return "error";
  }, [statusMessage]);

  return (
    <Card id="auth" className="glass-panel scroll-mt-24 shadow-glow border-primary/45 rounded-md overflow-hidden font-terminal crt-screen">
      {/* Visual neon banner */}
      <div className="h-2 bg-gradient-to-r from-primary via-accent to-secondary animate-pulse" />
      
      <CardHeader className="bg-[#0f0e20]/80 border-b border-primary/20">
        <CardTitle className="text-neon-pink font-pixel text-3xl flex items-center gap-2">
          <Terminal className="h-6 w-6 text-primary" />
          ENTER BUILDX
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground uppercase tracking-wider">
          Proof of payment required for registration.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-[#090812]/90">
        {statusMessage && (
          <div
            className={
              messageTone === "success"
                ? "mb-5 rounded border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200"
                : "mb-5 rounded border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200"
            }
          >
            <div className="flex items-start gap-2">
              {messageTone === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <p className="leading-5">{statusMessage}</p>
            </div>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "register" | "login")}
          className="w-full"
        >
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
            <form className="space-y-4" onSubmit={handleRegister} noValidate>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field name="name" label="NAME" placeholder="Enter Full Name" />
                <Field name="email" label="EMAIL" type="email" placeholder="email@address.com" />
                <Field name="contact" label="CONTACT" placeholder="Contact digits" />
                <Field name="institution" label="ORGANIZATION" placeholder="School/College Name" />
                <Field
                  name="password"
                  label="PASSWORD"
                  type="password"
                  placeholder="Minimum 8 characters"
                />
                <Field name="submittedAmount" label="FEE PAID" placeholder="e.g. 499" />
              </div>

              {/* Custom Retro Slip Uploader */}
              <div className="space-y-2">
                <Label htmlFor="paymentReceipt" className="text-xs text-secondary font-bold uppercase tracking-wider">PAYMENT RECEIPT PROOF (JPG/PNG/WEBP)</Label>
                <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-secondary/30 bg-[#0d0c18] p-4 text-center text-xs transition hover:border-secondary hover:shadow-cyan">
                  <Upload className="mb-2 h-5 w-5 text-secondary animate-bounce" />
                  <span className="font-semibold text-muted-foreground">
                  {receipt ? receipt.name : "LOAD RECEIPT FILE / RESUBMIT_VALID_RECEIPT"}
                  </span>
                  <Input
                    id="paymentReceipt"
                    name="paymentReceipt"
                    className="sr-only"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(event) => setReceipt(event.target.files?.[0] ?? null)}
                    required
                  />
                </label>
              </div>

              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Use a password with at least 8 characters. Receipt images must be JPG, PNG, or WEBP and under 5 MB.
              </p>

              <Button className="w-full font-bold uppercase tracking-widest retro-btn-pink" size="lg" disabled={isLoading || !receipt}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                EXECUTE REGISTRATION
              </Button>
            </form>
          </TabsContent>

          {/* User Login Form */}
          <TabsContent value="login">
            <form className="space-y-4" onSubmit={handleLogin} noValidate>
              <Field name="email" label="EMAIL" type="email" placeholder="email@address.com" />
              <Field name="password" label="PASSWORD" type="password" placeholder="Enter password" />
              <Button className="w-full font-bold uppercase tracking-widest retro-btn-cyan" size="lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" /> : <Terminal className="mr-2 h-4 w-4" />}
                ESTABLISH CONNECTION
              </Button>
            </form>
          </TabsContent>
        </Tabs>

      </CardContent>
    </Card>
  );
}

type RegistrationValidationInput = {
  name: string;
  email: string;
  password: string;
  contact: string;
  institution: string;
  receipt: File;
};

function validateRegistrationInput({
  name,
  email,
  password,
  contact,
  institution,
  receipt,
}: RegistrationValidationInput) {
  if (name.trim().length < 2) return "Please enter your full name.";
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Please enter a valid email address.";
  if (password.length < 8) return "Password must be at least 8 characters long.";
  if (!/^\+?[0-9]{10,15}$/.test(contact.trim())) {
    return "Contact number must contain 10 to 15 digits only.";
  }
  if (institution.trim().length < 2) return "Please enter your institution name.";

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(receipt.type)) {
    return "Payment receipt must be a JPG, PNG, or WEBP image.";
  }

  if (receipt.size > 5 * 1024 * 1024) {
    return "Payment receipt must be smaller than 5 MB.";
  }

  return null;
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
