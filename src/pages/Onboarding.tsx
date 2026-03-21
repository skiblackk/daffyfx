import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const onboardingSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  whatsapp: z.string().trim().min(7, "Enter a valid WhatsApp number").max(20),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters"),
  platform: z.string().min(1, "Select a platform"),
  account_balance: z.number().min(15, "Minimum capital is $15"),
  agreed_terms: z.literal(true, { errorMap: () => ({ message: "You must agree to the terms" }) }),
});

type FormData = z.infer<typeof onboardingSchema>;

const platforms = ["MetaTrader 4 (MT4)", "MetaTrader 5 (MT5)", "cTrader", "TradingView", "Other"];

const Onboarding = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [form, setForm] = useState({
    full_name: "",
    whatsapp: "",
    email: "",
    password: "",
    platform: "",
    account_balance: "",
    agreed_terms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = onboardingSchema.safeParse({
      ...form,
      account_balance: parseFloat(form.account_balance) || 0,
    });

    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      parsed.error.errors.forEach((err) => {
        const key = err.path[0] as keyof FormData;
        fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      let userId: string | undefined;

      // 1. Try to create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (authError) {
        // If user already exists in auth, try signing in instead
        if (authError.message?.toLowerCase().includes("already") || (authError as any).code === "user_already_exists") {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: parsed.data.email,
            password: parsed.data.password,
          });
          if (signInError) throw new Error("Account exists but password is incorrect. Please log in instead.");
          userId = signInData.user?.id;
        } else {
          throw authError;
        }
      } else {
        // Detect fake signup (user already exists with auto-confirm enabled)
        if (authData.user && (!authData.user.identities || authData.user.identities.length === 0)) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: parsed.data.email,
            password: parsed.data.password,
          });
          if (signInError) throw new Error("Account exists but password is incorrect. Please log in instead.");
          userId = signInData.user?.id;
        } else {
          userId = authData.user?.id;
        }
      }

      // 2. Check if client record already exists
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", userId!)
        .maybeSingle();

      if (!existingClient) {
        // Create client record
        const { error } = await supabase.from("clients").insert({
          full_name: parsed.data.full_name,
          whatsapp: parsed.data.whatsapp,
          email: parsed.data.email,
          platform: parsed.data.platform,
          account_balance: parsed.data.account_balance,
          starting_balance: parsed.data.account_balance,
          status: "approved",
          user_id: userId,
        });
        if (error) throw error;
      }

      // Send WhatsApp notification (fire-and-forget)
      supabase.functions.invoke("notify-whatsapp", {
        body: {
          event: "auto_approved",
          client_name: parsed.data.full_name,
          client_email: parsed.data.email,
          client_whatsapp: parsed.data.whatsapp,
          status: "approved",
        },
      }).catch(() => {});

      toast({
        title: "Account Created! 🎉",
        description: "Welcome to DAFFY XAU. Redirecting to your dashboard...",
      });
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Submission Failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="DAFFY XAU Logo" className="h-8 w-8 object-contain transition-transform group-hover:scale-110" />
            <span className="font-display text-2xl font-bold text-gold-gradient">
              DAFFY XAU
            </span>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-lg">
          <div className="flex flex-col items-center mb-6 text-center">
            <img src="/logo.png" alt="DAFFY XAU Logo" className="h-16 w-16 object-contain mb-4" />
            <h1 className="font-display text-3xl font-bold">
              Join <span className="text-gold-gradient">DAFFY XAU</span>
            </h1>
          </div>
          <p className="mb-8 text-center text-muted-foreground">
            Fill out the form below. We'll review your application within 24 hours.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Full Name" error={errors.full_name}>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full rounded-md border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </Field>

            <Field label="WhatsApp Number" error={errors.whatsapp}>
              <input
                name="whatsapp"
                value={form.whatsapp}
                onChange={handleChange}
                placeholder="+1 234 567 8900"
                className="w-full rounded-md border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </Field>

            <Field label="Email Address" error={errors.email}>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="w-full rounded-md border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </Field>

            <Field label="Password" error={errors.password}>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                minLength={6}
                className="w-full rounded-md border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </Field>

            <Field label="Trading Platform" error={errors.platform}>
              <select
                name="platform"
                value={form.platform}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-secondary px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="">Select platform...</option>
                {platforms.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>

            <Field label="Account Balance (USD)" error={errors.account_balance}>
              <input
                name="account_balance"
                type="number"
                min="15"
                step="0.01"
                value={form.account_balance}
                onChange={handleChange}
                placeholder="20.00"
                className="w-full rounded-md border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </Field>

            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreed_terms"
                  checked={form.agreed_terms}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 rounded border-border accent-gold"
                />
                <span className="text-sm text-muted-foreground">
                  I agree to the{" "}
                  <Link to="/" className="text-gold underline">terms and conditions</Link>,
                  understand the risks involved in Forex trading, and accept the 50/50 profit split arrangement.
                </span>
              </label>
              {errors.agreed_terms && <p className="mt-1 text-xs text-destructive">{errors.agreed_terms}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-gold-gradient py-4 text-base font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50 glow-gold"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
  </div>
);

export default Onboarding;
