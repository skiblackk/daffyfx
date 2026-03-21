import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle, Clock, DollarSign } from "lucide-react";

interface PaymentSectionProps {
  clientId: string;
  userId: string;
  daffyShare: number;
}

interface AdminSetting {
  setting_key: string;
  setting_value: string;
}

const PaymentSection = ({ clientId, userId, daffyShare }: PaymentSectionProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [proofs, setProofs] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const { data: settingsData } = await supabase.from("admin_settings").select("*");
      if (settingsData) {
        const map: Record<string, string> = {};
        (settingsData as AdminSetting[]).forEach((s) => { map[s.setting_key] = s.setting_value; });
        setSettings(map);
      }

      const { data: proofsData } = await supabase
        .from("payment_proofs")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (proofsData) setProofs(proofsData);
    };
    fetchAll();
  }, [clientId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const filePath = `${userId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-screenshots")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Upload Failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("payment-screenshots")
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("payment_proofs").insert({
      client_id: clientId,
      user_id: userId,
      screenshot_url: urlData.publicUrl,
      amount: daffyShare,
    } as any);

    if (insertError) {
      toast({ title: "Error", description: insertError.message, variant: "destructive" });
    } else {
      toast({ title: "Submitted", description: "Payment proof uploaded. Admin will review shortly." });
      // Refresh proofs
      const { data } = await supabase
        .from("payment_proofs")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (data) setProofs(data);
    }
    setUploading(false);
  };

  return (
    <div className="mt-8">
      <h2 className="mb-4 font-display text-xl font-bold flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-gold" />
        Settlement — Send Daffy's Share
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Amount due: <span className="text-gold font-semibold">${daffyShare.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        {/* Mpesa */}
        <div className="glass-card rounded-lg p-5">
          <p className="text-sm font-semibold mb-2">📱 Mpesa</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Name: <span className="text-foreground">{settings.mpesa_name || "—"}</span></p>
            <p>Number: <span className="text-foreground font-mono">{settings.mpesa_number || "Not configured"}</span></p>
          </div>
        </div>

        {/* Paybill */}
        <div className="glass-card rounded-lg p-5">
          <p className="text-sm font-semibold mb-2">🏦 Paybill</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Paybill No: <span className="text-foreground font-mono">{settings.paybill_number || "Not configured"}</span></p>
            <p>Account No: <span className="text-foreground font-mono">{settings.paybill_account || "—"}</span></p>
            <p>Account Name: <span className="text-foreground font-mono">{settings.paybill_account_name || "—"}</span></p>
          </div>
        </div>

        {/* Binance */}
        <div className="glass-card rounded-lg p-5">
          <p className="text-sm font-semibold mb-2">💱 Binance</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Binance ID: <span className="text-foreground font-mono">{settings.binance_id || "Not configured"}</span></p>
          </div>
        </div>

        {/* TRC20 */}
        <div className="glass-card rounded-lg p-5">
          <p className="text-sm font-semibold mb-2">🪙 TRC20 (USDT)</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Address: <span className="text-foreground font-mono text-xs break-all">{settings.trc20_address || "Not configured"}</span></p>
          </div>
        </div>
      </div>

      {/* Upload */}
      <div className="mb-6">
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-gold/30 px-4 py-3 text-sm font-medium text-gold transition-all hover:bg-gold/10 w-fit">
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading..." : "Upload Payment Screenshot"}
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {/* Previous proofs */}
      {proofs.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium mb-2">Payment History</p>
          {proofs.map((proof) => (
            <div key={proof.id} className="glass-card rounded-lg p-3 flex items-center gap-3">
              {proof.status === "confirmed" ? (
                <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
              ) : (
                <Clock className="h-4 w-4 text-gold shrink-0" />
              )}
              <div className="flex-1 text-sm">
                <p className="text-muted-foreground">
                  ${proof.amount?.toLocaleString("en-US", { minimumFractionDigits: 2 })} — {" "}
                  <span className={proof.status === "confirmed" ? "text-green-400" : "text-gold"}>
                    {proof.status === "confirmed" ? "Confirmed" : "Pending Review"}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">{new Date(proof.created_at).toLocaleDateString()}</p>
              </div>
              <a href={proof.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold underline">View</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentSection;
