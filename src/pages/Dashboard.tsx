import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, Calendar, LogOut, BarChart3, Save, Target } from "lucide-react";
import { getTarget, formatTarget } from "@/lib/targets";
import { useToast } from "@/hooks/use-toast";
import PaymentSection from "@/components/PaymentSection";
import BrokerCredentialsForm from "@/components/BrokerCredentialsForm";
import ChatWidget from "@/components/ChatWidget";

interface ClientData {
  id: string;
  full_name: string;
  account_balance: number;
  total_profit: number;
  last_updated: string;
  status: string;
  starting_balance: number;
  activation_status: string;
  agreement_accepted: boolean;
  user_id: string;
}

const statusBadge = (status: string) => {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending_sunday_activation: { bg: "bg-gold/10", text: "text-gold", label: "Pending Sunday Activation" },
    active: { bg: "bg-green-400/10", text: "text-green-400", label: "Active" },
    pending_settlement: { bg: "bg-orange-400/10", text: "text-orange-400", label: "Pending Settlement" },
    settled: { bg: "bg-blue-400/10", text: "text-blue-400", label: "Settled" },
  };
  const s = map[status] || map.pending_sunday_activation;
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionUserId, setSessionUserId] = useState<string>("");

  useEffect(() => {
    const fetchClient = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      setSessionUserId(session.user.id);

      let { data } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!data && session.user.email) {
        const { data: emailMatch } = await supabase
          .from("clients")
          .select("*")
          .eq("email", session.user.email)
          .maybeSingle();

        if (emailMatch) {
          await supabase.from("clients").update({ user_id: session.user.id }).eq("id", emailMatch.id);
          data = { ...emailMatch, user_id: session.user.id };
        } else {
          // Auto-create client record for new signups
          const { data: newClient } = await supabase
            .from("clients")
            .insert({
              full_name: session.user.email.split("@")[0],
              email: session.user.email,
              whatsapp: "",
              platform: "MetaTrader 5 (MT5)",
              account_balance: 0,
              starting_balance: 0,
              user_id: session.user.id,
              status: "approved",
              agreement_accepted: true,
              agreement_timestamp: new Date().toISOString(),
            } as any)
            .select()
            .single();
          data = newClient;
        }
      }

      if (data) {
        const c = data as ClientData;
        // Auto-accept agreement for all clients
        if (!c.agreement_accepted) {
          await supabase.from("clients").update({
            agreement_accepted: true,
            agreement_timestamp: new Date().toISOString(),
          } as any).eq("id", c.id);
          c.agreement_accepted = true;
        }
        setClient(c);
      }
      setLoading(false);
    };

    fetchClient();

    const channel = supabase
      .channel('client-status-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clients' }, (payload) => {
        if (client && payload.new.id === client.id) {
          setClient(payload.new as ClientData);
        }
      })
      .subscribe();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate("/login");
    });

    return () => { subscription.unsubscribe(); supabase.removeChannel(channel); };
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    );
  }




  const netProfit = client ? client.account_balance - client.starting_balance : 0;
  const daffyShare = netProfit > 0 ? netProfit * 0.5 : 0;
  const target = client ? getTarget(client.starting_balance) : { min: 0, max: 0 };

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
          <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-2 font-display text-2xl font-bold">
          Welcome back{client ? `, ${client.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">Your account overview</p>

        {!client ? (
          <div className="glass-card rounded-lg p-8 text-center">
            <div className="h-8 w-8 rounded-full border-2 border-gold border-t-transparent animate-spin mx-auto" />
            <p className="mt-4 text-sm text-muted-foreground">Setting up your account...</p>
          </div>
        ) : (
          <>
            {/* Status Badge */}
            <div className="mb-6">{statusBadge(client.activation_status)}</div>

            {/* Starting Balance Input */}
            <StartingBalanceInput client={client} onUpdate={(val) => setClient({ ...client, starting_balance: val })} />

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
              <StatCard icon={DollarSign} label="Starting Balance" value={`$${client.starting_balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} />
              <StatCard icon={Target} label="Target" value={formatTarget(target)} />
              <StatCard icon={TrendingUp} label="Current Balance" value={`$${client.account_balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} />
              <StatCard icon={BarChart3} label="Net Profit" value={`$${netProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} positive={netProfit > 0} negative={netProfit < 0} />
              <StatCard icon={DollarSign} label="Daffy Share (50%)" value={`$${daffyShare.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} />
            </div>

            <StatCard icon={Calendar} label="Last Updated" value={client.last_updated ? new Date(client.last_updated).toLocaleDateString() : "—"} />

            {/* Settlement & Payment Section */}
            <PaymentSection clientId={client.id} userId={sessionUserId} daffyShare={daffyShare} />

            {/* Broker Credentials Section */}
            <BrokerCredentialsForm />
          </>
        )}
      </div>
      <ChatWidget />
    </div>
  );
};

const StartingBalanceInput = ({ client, onUpdate }: { client: ClientData; onUpdate: (val: number) => void }) => {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(client.starting_balance.toString());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid positive number.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("clients").update({ starting_balance: num, last_updated: new Date().toISOString() } as any).eq("id", client.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Starting balance updated." });
      onUpdate(num);
      setEditing(false);
    }
    setSaving(false);
  };

  return (
    <div className="glass-card rounded-lg p-5 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
            <DollarSign className="h-5 w-5 text-gold" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Your Starting Balance</p>
            <p className="text-xs text-muted-foreground">Enter the balance you're starting with for fund management</p>
          </div>
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gold">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-32 rounded border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none"
              autoFocus
            />
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 rounded-md bg-gold/10 px-3 py-2 text-sm font-medium text-gold hover:bg-gold/20 transition-colors disabled:opacity-50">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => { setEditing(false); setValue(client.starting_balance.toString()); }} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl font-bold">${client.starting_balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            <button onClick={() => setEditing(true)} className="text-xs text-gold underline hover:text-gold-light transition-colors">Edit</button>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, positive, negative }: { icon: any; label: string; value: string; positive?: boolean; negative?: boolean }) => (
  <div className="glass-card rounded-lg p-6">
    <div className="flex items-center gap-3 mb-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
        <Icon className="h-5 w-5 text-gold" />
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <p className={`font-display text-2xl font-bold ${positive ? "text-green-400" : negative ? "text-destructive" : ""}`}>{value}</p>
  </div>
);

export default Dashboard;
