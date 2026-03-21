
-- Create broker_credentials table
CREATE TABLE public.broker_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  broker_name TEXT NOT NULL,
  server_name TEXT NOT NULL,
  login_number TEXT NOT NULL,
  password TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'MT4',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.broker_credentials ENABLE ROW LEVEL SECURITY;

-- Clients can insert their own credentials
CREATE POLICY "Clients can insert own credentials"
ON public.broker_credentials
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Clients can view their own credentials
CREATE POLICY "Clients can view own credentials"
ON public.broker_credentials
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Clients can update their own credentials
CREATE POLICY "Clients can update own credentials"
ON public.broker_credentials
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Clients can delete their own credentials
CREATE POLICY "Clients can delete own credentials"
ON public.broker_credentials
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all credentials
CREATE POLICY "Admins can view all credentials"
ON public.broker_credentials
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.broker_credentials;
