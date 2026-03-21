
-- Drop all existing policies on clients
DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can update all clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone can submit application" ON public.clients;
DROP POLICY IF EXISTS "Clients can link their own user_id" ON public.clients;
DROP POLICY IF EXISTS "Clients can view own data" ON public.clients;

-- Recreate as PERMISSIVE (default) policies
CREATE POLICY "Admins can view all clients"
ON public.clients FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view own data"
ON public.clients FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all clients"
ON public.clients FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can link their own user_id"
ON public.clients FOR UPDATE TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid())::text)
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid())::text);

CREATE POLICY "Anyone can submit application"
ON public.clients FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can delete clients"
ON public.clients FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
