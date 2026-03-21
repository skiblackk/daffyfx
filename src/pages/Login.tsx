import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdminMode = searchParams.get("role") === "admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isAdminMode) {
        // Hardcoded admin credentials
        if (email.toLowerCase() !== "daffyxau@gmail.com" || password !== "masterdaffy2026") {
          toast({ title: "Access Denied", description: "Invalid admin credentials.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (isAdminMode) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <Link to="/" className="inline-flex flex-col items-center gap-2 mb-8 group">
          <img src="/logo.png" alt="DAFFY XAU Logo" className="h-16 w-16 object-contain transition-transform group-hover:scale-110" />
          <span className="font-display text-3xl font-bold text-gold-gradient">
            DAFFY XAU
          </span>
        </Link>
        <div className="glass-card rounded-lg p-8">
          <h2 className="font-display text-xl font-bold mb-6 text-center">
            {isAdminMode ? "Admin Login" : "Client Login"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-md border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-gold-gradient py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Sign In"}
            </button>
          </form>
          {!isAdminMode && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/onboarding" className="text-gold underline">
                Get Started
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
