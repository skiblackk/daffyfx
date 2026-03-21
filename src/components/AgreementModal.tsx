import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";

interface AgreementModalProps {
  clientId: string;
  onAccepted: () => void;
}

const AgreementModal = ({ clientId, onAccepted }: AgreementModalProps) => {
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAccept = async () => {
    if (!checked) return;
    setSaving(true);
    await supabase
      .from("clients")
      .update({
        agreement_accepted: true,
        agreement_timestamp: new Date().toISOString(),
      } as any)
      .eq("id", clientId);
    setSaving(false);
    onAccepted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md glass-card rounded-xl p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
          <Shield className="h-7 w-7 text-gold" />
        </div>
        <h2 className="mb-2 text-center font-display text-xl font-bold">Profit-Sharing Agreement</h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Please read and accept before accessing your dashboard.
        </p>

        <div className="mb-6 rounded-lg border border-border bg-secondary/50 p-4 text-sm text-foreground/90 leading-relaxed space-y-3">
          <p>
            I understand that all trading profits remain in my personal broker account. I retain full ownership and control of my trading account at all times.
          </p>
          <p>
            I agree to the <span className="text-gold font-medium">50/50 profit-sharing structure</span> with DAFFY XAU. After withdrawing profits from my broker, I commit to sending the manager's 50% share via Mpesa or Crypto.
          </p>
          <p>
            I acknowledge that trading involves risk and past performance does not guarantee future results.
          </p>
        </div>

        <label className="mb-6 flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border accent-gold"
          />
          <span className="text-sm text-muted-foreground">
            I have read, understood, and agree to the profit-sharing terms above.
          </span>
        </label>

        <button
          onClick={handleAccept}
          disabled={!checked || saving}
          className="w-full rounded-md bg-gold-gradient py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "I Agree — Continue to Dashboard"}
        </button>
      </div>
    </div>
  );
};

export default AgreementModal;
