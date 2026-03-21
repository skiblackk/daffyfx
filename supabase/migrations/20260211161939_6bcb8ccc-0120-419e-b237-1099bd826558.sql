
-- Create a security definer function to get the current user's email
CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Clients can link their own user_id" ON public.clients;

-- Recreate it using the security definer function
CREATE POLICY "Clients can link their own user_id"
ON public.clients
FOR UPDATE
USING (email = public.get_auth_email())
WITH CHECK (email = public.get_auth_email());
