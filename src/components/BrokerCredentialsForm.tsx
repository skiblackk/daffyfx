import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Save, Trash2, Eye, EyeOff, Plus } from "lucide-react";

interface BrokerCredential {
  id: string;
  broker_name: string;
  server_name: string;
  login_number: string;
  password: string;
  platform: string;
  created_at: string;
}

const platformOptions = ["MT4", "MT5", "cTrader", "TradingView"];

const BrokerCredentialsForm = () => {
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<BrokerCredential[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    broker_name: "",
    server_name: "",
    login_number: "",
    password: "",
    platform: "MT4",
  });

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("broker_credentials")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (data) setCredentials(data as BrokerCredential[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("broker_credentials").insert({
      user_id: session.user.id,
      ...form,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Broker credentials saved securely." });
      setForm({ broker_name: "", server_name: "", login_number: "", password: "", platform: "MT4" });
      setShowForm(false);
      fetchCredentials();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove these broker credentials?")) return;
    const { error } = await supabase.from("broker_credentials").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Removed", description: "Broker credentials deleted." });
      fetchCredentials();
    }
  };

  const togglePassword = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-gold" />
          Broker Logins
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-md border border-gold/30 px-4 py-2 text-xs font-medium text-gold transition-all hover:bg-gold/10"
          >
            <Plus className="h-3 w-3" /> Add Login
          </button>
        )}
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Submit your broker account details so we can trade on your behalf.
      </p>

      {/* Existing credentials */}
      {credentials.length > 0 && (
        <div className="space-y-3 mb-6">
          {credentials.map((cred) => (
            <div key={cred.id} className="glass-card rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-sm font-bold text-gold shrink-0">
                {cred.platform}
              </div>
              <div className="flex-1 grid gap-1 text-sm">
                <p className="font-medium">{cred.broker_name}</p>
                <p className="text-muted-foreground text-xs">
                  Server: {cred.server_name} · Login: {cred.login_number} · Password:{" "}
                  <span className="font-mono">
                    {showPasswords[cred.id] ? cred.password : "••••••••"}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => togglePassword(cred.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                  {showPasswords[cred.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button onClick={() => handleDelete(cred.id)} className="text-destructive/60 hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card rounded-lg p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Broker Name</label>
              <input
                type="text"
                required
                value={form.broker_name}
                onChange={(e) => setForm((f) => ({ ...f, broker_name: e.target.value }))}
                placeholder="e.g. Exness, XM, IC Markets"
                className="w-full rounded-md border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Platform</label>
              <select
                value={form.platform}
                onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                className="w-full rounded-md border border-border bg-secondary px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              >
                {platformOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Server Name</label>
              <input
                type="text"
                required
                value={form.server_name}
                onChange={(e) => setForm((f) => ({ ...f, server_name: e.target.value }))}
                placeholder="e.g. Exness-Real9"
                className="w-full rounded-md border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Login Number</label>
              <input
                type="text"
                required
                value={form.login_number}
                onChange={(e) => setForm((f) => ({ ...f, login_number: e.target.value }))}
                placeholder="e.g. 12345678"
                className="w-full rounded-md border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Your broker account password"
              className="w-full rounded-md border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-md bg-gold-gradient px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Credentials"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-border px-6 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default BrokerCredentialsForm;
