import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Save, Users, Trash2, Activity, KeyRound, Eye, EyeOff, Calendar, DollarSign, CheckCircle, Settings, Image, Target } from "lucide-react";
import { getTarget, formatTarget } from "@/lib/targets";

interface Client {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  platform: string;
  account_balance: number;
  total_profit: number;
  status: string;
  last_updated: string;
  created_at: string;
  user_id: string | null;
  starting_balance: number;
  activation_status: string;
}

interface BrokerCredential {
  id: string;
  user_id: string;
  broker_name: string;
  server_name: string;
  login_number: string;
  password: string;
  platform: string;
}

interface PaymentProof {
  id: string;
  client_id: string;
  user_id: string;
  screenshot_url: string;
  amount: number;
  status: string;
  created_at: string;
  confirmed_at: string | null;
}

const statusOptions = ["new_applicant", "approved", "active", "paused", "rejected"];
const activationOptions = ["pending_sunday_activation", "active", "pending_settlement", "settled"];

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Client>>({});
  const [brokerCreds, setBrokerCreds] = useState<BrokerCredential[]>([]);
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>([]);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [showBrokerSection, setShowBrokerSection] = useState(false);
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [showSettingsSection, setShowSettingsSection] = useState(false);
  const [tab, setTab] = useState<string>("all");

  // Admin settings
  const [adminSettings, setAdminSettings] = useState<Record<string, string>>({});
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
      if (!roleData) { navigate("/dashboard"); return; }
      fetchAll();
    };
    init();

    const channel = supabase
      .channel('admin-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => fetchClients())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'broker_credentials' }, () => fetchBrokerCreds())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_proofs' }, () => fetchPaymentProofs())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [navigate]);

  const fetchAll = () => { fetchClients(); fetchBrokerCreds(); fetchPaymentProofs(); fetchSettings(); };

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    if (data) setClients(data as Client[]);
    setLoading(false);
  };

  const fetchBrokerCreds = async () => {
    const { data } = await supabase.from("broker_credentials").select("*").order("created_at", { ascending: false });
    if (data) setBrokerCreds(data as BrokerCredential[]);
  };

  const fetchPaymentProofs = async () => {
    const { data } = await supabase.from("payment_proofs").select("*").order("created_at", { ascending: false });
    if (data) setPaymentProofs(data as PaymentProof[]);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from("admin_settings").select("*");
    if (data) {
      const map: Record<string, string> = {};
      (data as any[]).forEach((s) => { map[s.setting_key] = s.setting_value; });
      setAdminSettings(map);
      setSettingsForm(map);
    }
  };

  const togglePassword = (id: string) => setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));

  const startEdit = (c: Client) => {
    setEditingId(c.id);
    setEditValues({ account_balance: c.account_balance, total_profit: c.total_profit, status: c.status, starting_balance: c.starting_balance, activation_status: c.activation_status });
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from("clients").update({ ...editValues, last_updated: new Date().toISOString() } as any).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Updated", description: "Client data saved." }); setEditingId(null); fetchClients(); }
  };

  const deleteClient = async (id: string, name: string) => {
    if (!confirm(`Delete client "${name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Deleted", description: `${name} removed.` }); fetchClients(); }
  };

  const activateSundayBatch = async () => {
    if (!confirm("Activate all pending Sunday accounts?")) return;
    const { error } = await supabase.from("clients").update({ activation_status: "active", last_updated: new Date().toISOString() } as any).eq("activation_status", "pending_sunday_activation");
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Activated", description: "All pending accounts are now active." }); fetchClients(); }
  };

  const confirmPayment = async (proofId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("payment_proofs").update({ status: "confirmed", confirmed_at: new Date().toISOString(), confirmed_by: session?.user.id } as any).eq("id", proofId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Confirmed", description: "Payment marked as confirmed." }); fetchPaymentProofs(); }
  };

  const saveSettings = async () => {
    for (const [key, value] of Object.entries(settingsForm)) {
      if (value !== adminSettings[key]) {
        await supabase.from("admin_settings").update({ setting_value: value, updated_at: new Date().toISOString() } as any).eq("setting_key", key);
      }
    }
    toast({ title: "Saved", description: "Payment settings updated." });
    setEditingSettings(false);
    fetchSettings();
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate("/"); };

  const activeCount = clients.filter((c) => c.activation_status === "active").length;
  const pendingCount = clients.filter((c) => c.activation_status === "pending_sunday_activation").length;
  const totalNetProfit = clients.reduce((sum, c) => sum + (c.account_balance - c.starting_balance), 0);
  const totalExpectedProfit = clients.reduce((sum, c) => {
    const t = getTarget(c.starting_balance);
    const avgTarget = (t.min + t.max) / 2;
    return sum + ((avgTarget - c.starting_balance) * 0.5);
  }, 0);
  const totalSharePending = paymentProofs.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const totalShareConfirmed = paymentProofs.filter((p) => p.status === "confirmed").reduce((s, p) => s + p.amount, 0);

  const filteredClients = tab === "all" ? clients : clients.filter((c) => c.activation_status === tab);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="h-8 w-8 rounded-full border-2 border-gold border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="DAFFY XAU Logo" className="h-8 w-8 object-contain transition-transform group-hover:scale-110" />
            <span className="font-display text-2xl font-bold text-gold-gradient">
              DAFFY XAU <span className="text-xs font-sans text-muted-foreground ml-2">Admin</span>
            </span>
          </Link>
          <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Overview Stats */}
         <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-8">
          <MiniStat icon={Users} label="Total Clients" value={clients.length} />
          <MiniStat icon={Activity} label="Active" value={activeCount} color="text-green-400" />
          <MiniStat icon={Calendar} label="Pending Sunday" value={pendingCount} color="text-gold" />
          <MiniStat icon={DollarSign} label="Net Profit (All)" value={`$${totalNetProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} color="text-green-400" />
          <MiniStat icon={Target} label="Expected Profit" value={`$${totalExpectedProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} color="text-gold" />
          <MiniStat icon={DollarSign} label="Share Pending" value={`$${totalSharePending.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} color="text-orange-400" />
        </div>

        {/* Sunday Activation Button */}
        {pendingCount > 0 && (
          <button onClick={activateSundayBatch} className="mb-6 flex items-center gap-2 rounded-md bg-gold-gradient px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90">
            <Calendar className="h-4 w-4" /> Activate Sunday Batch ({pendingCount})
          </button>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "pending_sunday_activation", "active", "pending_settlement", "settled"].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${tab === t ? "bg-gold/10 text-gold border border-gold/30" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {t === "all" ? "All" : t.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>

        <h1 className="font-display text-2xl font-bold mb-6">Client Management</h1>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
               <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-muted-foreground font-medium">Name</th>
                <th className="px-4 py-3 text-muted-foreground font-medium">Starting</th>
                <th className="px-4 py-3 text-muted-foreground font-medium">Target</th>
                <th className="px-4 py-3 text-muted-foreground font-medium">Current</th>
                <th className="px-4 py-3 text-muted-foreground font-medium">Net Profit</th>
                <th className="px-4 py-3 text-muted-foreground font-medium">Daffy Share</th>
                <th className="px-4 py-3 text-muted-foreground font-medium">Expected Profit</th>
                <th className="px-4 py-3 text-muted-foreground font-medium">Status</th>
                <th className="px-4 py-3 text-muted-foreground font-medium">Activation</th>
                <th className="px-4 py-3 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((c) => {
                const np = c.account_balance - c.starting_balance;
                const ds = np > 0 ? np * 0.5 : 0;
                const target = getTarget(c.starting_balance);
                const avgTarget = (target.min + target.max) / 2;
                const expectedProfit = (avgTarget - c.starting_balance) * 0.5;
                return (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.full_name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === c.id ? (
                        <input type="number" step="0.01" value={editValues.starting_balance ?? ""} onChange={(e) => setEditValues((p) => ({ ...p, starting_balance: parseFloat(e.target.value) || 0 }))} className="w-24 rounded border border-border bg-secondary px-2 py-1 text-sm text-foreground focus:border-gold focus:outline-none" />
                      ) : `$${c.starting_balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                    </td>
                    <td className="px-4 py-3 text-gold">{formatTarget(target)}</td>
                    <td className="px-4 py-3">
                      {editingId === c.id ? (
                        <input type="number" step="0.01" value={editValues.account_balance ?? ""} onChange={(e) => setEditValues((p) => ({ ...p, account_balance: parseFloat(e.target.value) || 0 }))} className="w-24 rounded border border-border bg-secondary px-2 py-1 text-sm text-foreground focus:border-gold focus:outline-none" />
                      ) : `$${c.account_balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={np >= 0 ? "text-green-400" : "text-destructive"}>${np.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-4 py-3 text-gold">${ds.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-gold">${expectedProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                      {editingId === c.id ? (
                        <select value={editValues.status || ""} onChange={(e) => setEditValues((p) => ({ ...p, status: e.target.value }))} className="rounded border border-border bg-secondary px-2 py-1 text-sm text-foreground focus:border-gold focus:outline-none">
                          {statusOptions.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                        </select>
                      ) : (
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${c.status === "active" ? "bg-green-400/10 text-green-400" : c.status === "approved" ? "bg-gold/10 text-gold" : c.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{c.status?.replace("_", " ")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === c.id ? (
                        <select value={editValues.activation_status || ""} onChange={(e) => setEditValues((p) => ({ ...p, activation_status: e.target.value }))} className="rounded border border-border bg-secondary px-2 py-1 text-sm text-foreground focus:border-gold focus:outline-none">
                          {activationOptions.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                        </select>
                      ) : (
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${c.activation_status === "active" ? "bg-green-400/10 text-green-400" : c.activation_status === "settled" ? "bg-blue-400/10 text-blue-400" : c.activation_status === "pending_settlement" ? "bg-orange-400/10 text-orange-400" : "bg-gold/10 text-gold"}`}>
                          {c.activation_status?.replace(/_/g, " ")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {editingId === c.id ? (
                          <button onClick={() => saveEdit(c.id)} className="flex items-center gap-1 text-gold hover:text-gold-light transition-colors"><Save className="h-4 w-4" /> Save</button>
                        ) : (
                          <button onClick={() => startEdit(c)} className="text-muted-foreground hover:text-foreground transition-colors text-xs underline">Edit</button>
                        )}
                        <button onClick={() => deleteClient(c.id, c.full_name)} className="text-destructive/60 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Payment Proofs Section */}
        <div className="mt-10">
          <button onClick={() => setShowPaymentSection(!showPaymentSection)} className="flex items-center gap-2 font-display text-2xl font-bold mb-6 hover:text-gold transition-colors">
            <Image className="h-6 w-6 text-gold" />
            Payment Proofs
            <span className="text-sm font-normal text-muted-foreground ml-2">({paymentProofs.filter((p) => p.status === "pending").length} pending)</span>
          </button>
          {showPaymentSection && (
            <div className="space-y-3">
              {paymentProofs.length === 0 ? (
                <div className="glass-card rounded-lg p-8 text-center text-muted-foreground">No payment proofs submitted yet.</div>
              ) : paymentProofs.map((proof) => {
                const cl = clients.find((c) => c.id === proof.client_id);
                return (
                  <div key={proof.id} className="glass-card rounded-lg p-4 flex items-center gap-4">
                    <a href={proof.screenshot_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      <img src={proof.screenshot_url} alt="Payment proof" className="h-16 w-16 rounded-lg object-cover border border-border" />
                    </a>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{cl?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">Amount: ${proof.amount?.toLocaleString("en-US", { minimumFractionDigits: 2 })} · {new Date(proof.created_at).toLocaleDateString()}</p>
                      <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${proof.status === "confirmed" ? "bg-green-400/10 text-green-400" : "bg-gold/10 text-gold"}`}>
                        {proof.status === "confirmed" ? "Confirmed" : "Pending"}
                      </span>
                    </div>
                    {proof.status === "pending" && (
                      <button onClick={() => confirmPayment(proof.id)} className="flex items-center gap-1 rounded-md bg-green-400/10 px-3 py-2 text-xs font-medium text-green-400 hover:bg-green-400/20 transition-all">
                        <CheckCircle className="h-3 w-3" /> Confirm
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Broker Credentials Section */}
        <div className="mt-10">
          <button onClick={() => setShowBrokerSection(!showBrokerSection)} className="flex items-center gap-2 font-display text-2xl font-bold mb-6 hover:text-gold transition-colors">
            <KeyRound className="h-6 w-6 text-gold" />
            Client Broker Logins
            <span className="text-sm font-normal text-muted-foreground ml-2">({brokerCreds.length} submitted)</span>
          </button>
          {showBrokerSection && (
            <div className="overflow-x-auto">
              {brokerCreds.length === 0 ? (
                <div className="glass-card rounded-lg p-8 text-center text-muted-foreground">No broker credentials submitted yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-4 py-3 text-muted-foreground font-medium">Client</th>
                      <th className="px-4 py-3 text-muted-foreground font-medium">Platform</th>
                      <th className="px-4 py-3 text-muted-foreground font-medium">Broker</th>
                      <th className="px-4 py-3 text-muted-foreground font-medium">Server</th>
                      <th className="px-4 py-3 text-muted-foreground font-medium">Login</th>
                      <th className="px-4 py-3 text-muted-foreground font-medium">Password</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brokerCreds.map((cred) => {
                      const cl = clients.find((c) => c.user_id === cred.user_id);
                      return (
                        <tr key={cred.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{cl?.full_name || "Unknown"}</td>
                          <td className="px-4 py-3"><span className="inline-block rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-medium text-gold">{cred.platform}</span></td>
                          <td className="px-4 py-3 text-muted-foreground">{cred.broker_name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{cred.server_name}</td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">{cred.login_number}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-muted-foreground">{showPasswords[cred.id] ? cred.password : "••••••••"}</span>
                              <button onClick={() => togglePassword(cred.id)} className="text-muted-foreground hover:text-foreground transition-colors">{showPasswords[cred.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Payment Settings */}
        <div className="mt-10">
          <button onClick={() => setShowSettingsSection(!showSettingsSection)} className="flex items-center gap-2 font-display text-2xl font-bold mb-6 hover:text-gold transition-colors">
            <Settings className="h-6 w-6 text-gold" />
            Payment Settings
          </button>
          {showSettingsSection && (
            <div className="glass-card rounded-lg p-6 space-y-4 max-w-lg">
              {[
                { key: "mpesa_name", label: "Mpesa Name" },
                { key: "mpesa_number", label: "Mpesa Number" },
                { key: "paybill_number", label: "Paybill Number" },
                { key: "paybill_account", label: "Paybill Account No" },
                { key: "paybill_account_name", label: "Paybill Account Name" },
                { key: "binance_id", label: "Binance ID" },
                { key: "trc20_address", label: "TRC20 Address (USDT)" },
                { key: "crypto_network", label: "Crypto Network" },
                { key: "crypto_wallet_address", label: "Crypto Wallet Address" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
                  {editingSettings ? (
                    <input value={settingsForm[key] || ""} onChange={(e) => setSettingsForm((f) => ({ ...f, [key]: e.target.value }))} className="w-full rounded-md border border-border bg-secondary px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold" />
                  ) : (
                    <p className="text-sm text-muted-foreground font-mono">{adminSettings[key] || "—"}</p>
                  )}
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                {editingSettings ? (
                  <>
                    <button onClick={saveSettings} className="flex items-center gap-2 rounded-md bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"><Save className="h-4 w-4" /> Save</button>
                    <button onClick={() => { setEditingSettings(false); setSettingsForm(adminSettings); }} className="rounded-md border border-border px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setEditingSettings(true)} className="text-sm text-gold underline hover:text-gold-light">Edit Settings</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MiniStat = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color?: string }) => (
  <div className="glass-card rounded-lg p-4 flex items-center gap-3">
    <Icon className={`h-5 w-5 ${color || "text-gold"}`} />
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${color || ""}`}>{value}</p>
    </div>
  </div>
);

export default Admin;
