import { FormEvent, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Shield, ArrowLeft, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/authStore";
import InteractiveBackground from "@/components/InteractiveBackground";

type AdminLoginPageProps = {
  mode?: "login" | "register";
};

export default function AdminLoginPage({ mode = "login" }: AdminLoginPageProps) {
  const { loginAdmin, registerAdmin, status, message, user, clearMessage } = useAuthStore();
  const navigate = useNavigate();
  const isLoading = status === "loading";

  useEffect(() => {
    clearMessage();
  }, [clearMessage]);

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      navigate("/admin");
    }
  }, [user, navigate]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await loginAdmin({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await registerAdmin({
      name: String(form.get("name")),
      email: String(form.get("email")),
      institution: String(form.get("institution")),
      password: String(form.get("password")),
    });
  }

  return (
    <div className="min-h-screen grid place-items-center py-12 relative text-white font-terminal selection:bg-accent selection:text-white">
      <InteractiveBackground />
      
      <div className="absolute top-4 left-4 z-20">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-white font-bold gap-1 font-terminal">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            ABORT_TO_HOME
          </Link>
        </Button>
      </div>

      <Card className="w-full max-w-lg bg-[#07050d]/95 border-2 border-accent/40 shadow-neon-pink/10 rounded overflow-hidden relative z-10 crt-screen">
        <div className="h-1.5 bg-gradient-to-r from-accent via-purple-500 to-primary" />
        
        <CardHeader className="bg-[#0f0e20]/80 border-b border-accent/20">
          <CardTitle className="text-neon-violet font-pixel text-3xl flex items-center gap-2 text-purple-400">
            <Shield className="h-6 w-6" />
            SECURE_ADMIN_LOGIN
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground uppercase tracking-widest font-terminal">
            RESTRICTED ACCESS • COMPLIANT WITH BUILDX ADMINISTRATIVE STANDARDS
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <Tabs defaultValue={mode} className="w-full">
            <TabsList className="grid grid-cols-2 bg-[#121124] border border-accent/20 rounded p-1 mb-6">
              <TabsTrigger 
                value="login" 
                className="font-bold tracking-widest text-xs uppercase data-[state=active]:bg-accent data-[state=active]:text-white rounded py-2 transition-all duration-200"
              >
                ADMIN_LOGIN
              </TabsTrigger>
              <TabsTrigger 
                value="register"
                className="font-bold tracking-widest text-xs uppercase data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded py-2 transition-all duration-200"
              >
                BOOTSTRAP_ADMIN
              </TabsTrigger>
            </TabsList>

            {/* Admin Login Form */}
            <TabsContent value="login">
              <form className="space-y-4" onSubmit={handleLogin}>
                <Field name="email" label="SECURE_EMAIL" type="email" placeholder="admin@domain.com" />
                <Field name="password" label="ENCRYPTED_PASSPHRASE" type="password" placeholder="••••••••" />
                
                <Button className="w-full font-bold uppercase tracking-widest border-2 border-accent text-accent hover:bg-accent hover:text-white hover:shadow-neon-pink bg-transparent" size="lg" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Terminal className="mr-2 h-4 w-4" />}
                  INITIALIZE_CONSOLE
                </Button>
              </form>
            </TabsContent>

            {/* Admin Registration Form */}
            <TabsContent value="register">
              <form className="space-y-4" onSubmit={handleRegister}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field name="name" label="SYS_ADMIN_NAME" placeholder="Admin Name" />
                  <Field name="email" label="SYS_ADMIN_EMAIL" type="email" placeholder="admin@domain.com" />
                  <Field name="institution" label="SYS_ORGANIZATION" placeholder="BuildX/College" />
                  <Field name="password" label="DEFAULT_BOOTSTRAP_KEY" type="password" placeholder="ADMIN_DEFAULT_PASSWORD" />
                </div>
                
                <Button className="w-full font-bold uppercase tracking-widest border-2 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white hover:shadow-glow bg-transparent mt-4" size="lg" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Terminal className="mr-2 h-4 w-4" />}
                  REGISTER_SYSTEM_HOST
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Terminal Console Logs */}
          {message && (
            <div className="mt-6 border border-accent/20 bg-[#16152b]/80 p-3 rounded font-mono text-[11px] text-purple-400">
              <div className="text-accent font-bold mb-1 uppercase tracking-wider font-terminal">CONSOLE_LOG:</div>
              <p className="leading-5">{message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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
    <div className="space-y-1.5 font-terminal text-left">
      <Label htmlFor={name} className="text-xs text-accent font-bold uppercase tracking-wider">{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        className="bg-[#090812] border-accent/20 text-white rounded focus:border-purple-400 focus:ring-0 placeholder:text-muted-foreground/45 text-xs h-9 font-terminal"
        required
      />
    </div>
  );
}
