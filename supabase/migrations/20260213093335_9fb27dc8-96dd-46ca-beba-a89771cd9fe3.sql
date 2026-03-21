
-- Add new columns to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS starting_balance numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS activation_status text NOT NULL DEFAULT 'pending_sunday_activation',
ADD COLUMN IF NOT EXISTS submission_date timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS agreement_accepted boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS agreement_timestamp timestamptz;

-- Create admin_settings table for configurable payment details
CREATE TABLE public.admin_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.admin_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default payment settings
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
  ('mpesa_name', 'MasterDaffy'),
  ('mpesa_number', ''),
  ('crypto_wallet_address', ''),
  ('crypto_network', 'USDT (TRC20)');

-- Create payment_proofs table
CREATE TABLE public.payment_proofs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  screenshot_url text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  confirmed_by uuid
);

ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own payment proofs" ON public.payment_proofs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Clients can insert own payment proofs" ON public.payment_proofs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all payment proofs" ON public.payment_proofs FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update payment proofs" ON public.payment_proofs FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for payment_proofs
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_proofs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_settings;

-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', true);

CREATE POLICY "Users can upload payment screenshots" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone can view payment screenshots" ON storage.objects FOR SELECT USING (bucket_id = 'payment-screenshots');
CREATE POLICY "Admins can delete payment screenshots" ON storage.objects FOR DELETE USING (bucket_id = 'payment-screenshots' AND has_role(auth.uid(), 'admin'::app_role));
