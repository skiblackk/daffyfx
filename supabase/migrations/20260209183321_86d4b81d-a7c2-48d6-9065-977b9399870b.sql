-- Enable realtime for clients table
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;

-- Allow clients to update their own user_id (for email-based linking)
CREATE POLICY "Clients can link their own user_id"
ON public.clients
FOR UPDATE
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));