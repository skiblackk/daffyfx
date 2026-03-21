import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, Shield, Users, DollarSign, BarChart3, Clock } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import ChatWidget from "@/components/ChatWidget";

const features = [
  {
    icon: TrendingUp,
    title: "Gold (XAUUSD) Specialist",
    description: "We focus exclusively on Gold trading for maximum expertise and consistent results.",
  },
  {
    icon: Shield,
    title: "Any Platform, Any Broker",
    description: "We manage your account on MT4, MT5, cTrader, or any platform you prefer.",
  },
  {
    icon: DollarSign,
    title: "$15 Minimum Capital",
    description: "Start with as little as $15. No large deposits required to get started.",
  },
  {
    icon: Users,
    title: "50/50 Profit Split",
    description: "Fair and transparent. We only profit when you profit — aligned interests.",
  },
  {
    icon: BarChart3,
    title: "Weekly Reports",
    description: "Receive detailed PDF performance reports every week automatically.",
  },
  {
    icon: Clock,
    title: "24/5 Monitoring",
    description: "Your account is actively managed during all market hours.",
  },
];

const rules = [
  "Minimum account balance: $15 USD",
  "Profit split: 50% trader / 50% manager (DAFFY XAU)",
  "Profits are calculated and split on a weekly basis",
  "Client retains full ownership of their trading account",
  "No withdrawals during active trading periods without notice",
  "DAFFY XAU reserves the right to decline any account",
];

const Index = () => {
  const navigate = useNavigate();

  const handleLogoDoubleClick = () => {
    navigate("/login?role=admin");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div
            onDoubleClick={handleLogoDoubleClick}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <img src="/logo.png" alt="DAFFY XAU Logo" className="h-8 w-8 object-contain" />
            <span className="font-display text-2xl font-bold text-gold-gradient">
              DAFFY XAU
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Client Login
            </Link>
            <Link
              to="/onboarding"
              className="rounded-md bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-background/60" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gold animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Professional Account Management
            </p>
            <h1 className="mb-6 font-display text-5xl font-bold leading-tight md:text-7xl animate-fade-in opacity-0" style={{ animationDelay: "0.2s" }}>
              Let Your <span className="text-gold-gradient">Gold</span> Work for You
            </h1>
            <p className="mb-10 text-lg text-muted-foreground md:text-xl animate-fade-in opacity-0" style={{ animationDelay: "0.4s" }}>
              Expert XAUUSD trading management. Start with just $15. 
              We trade, you earn — simple 50/50 profit split.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-fade-in opacity-0" style={{ animationDelay: "0.6s" }}>
              <Link
                to="/onboarding"
                className="rounded-md bg-gold-gradient px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:opacity-90 glow-gold"
              >
                Start Your Journey
              </Link>
              <a
                href="#how-it-works"
                className="rounded-md border border-gold/30 px-8 py-4 text-base font-medium text-foreground transition-all hover:border-gold/60 hover:bg-gold/5"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">
              Why <span className="text-gold-gradient">DAFFY XAU</span>?
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Professional account management built on trust, transparency, and results.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="glass-card rounded-lg p-6 transition-all hover:border-gold/30 hover:glow-gold"
              >
                <feature.icon className="mb-4 h-8 w-8 text-gold" />
                <h3 className="mb-2 font-display text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rules & Terms */}
      <section className="border-y border-border bg-secondary/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-8 text-center font-display text-3xl font-bold">
              Rules & <span className="text-gold-gradient">Terms</span>
            </h2>
            <div className="space-y-4">
              {rules.map((rule, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-card/50 p-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/10 text-xs font-bold text-gold">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground/90">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Risk Disclaimer */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl glass-card rounded-lg border-destructive/30 p-8">
            <h2 className="mb-4 font-display text-2xl font-bold text-destructive">
              ⚠️ Risk Disclaimer
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Trading foreign exchange (Forex) and Gold (XAUUSD) carries a high level of risk and may not be suitable for all investors. 
              Past performance is not indicative of future results. You should be aware of all risks associated with foreign exchange trading 
              and seek advice from an independent financial advisor if you have any doubts. DAFFY XAU does not guarantee profits and will not 
              be held liable for any losses incurred. By joining our account management service, you acknowledge that you understand 
              and accept these risks.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">
            Ready to <span className="text-gold-gradient">Grow</span>?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Join DAFFY XAU today. It takes less than 2 minutes to get started.
          </p>
          <Link
            to="/onboarding"
            className="inline-block rounded-md bg-gold-gradient px-10 py-4 text-base font-semibold text-primary-foreground transition-all hover:opacity-90 glow-gold"
          >
            Apply Now — It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <img src="/logo.png" alt="DAFFY XAU Logo" className="h-10 w-10 object-contain mx-auto" />
            <p className="font-display text-lg font-bold text-gold-gradient">DAFFY XAU</p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            © {new Date().getFullYear()} DAFFY XAU. All rights reserved. Trading involves risk.
          </p>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
};

export default Index;
