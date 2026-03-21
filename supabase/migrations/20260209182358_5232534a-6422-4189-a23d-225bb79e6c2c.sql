
-- Auto-approve clients with account_balance >= 20 on insert
CREATE OR REPLACE FUNCTION public.auto_approve_client()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_balance >= 20 THEN
    NEW.status := 'approved';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_approve_client
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_client();
