-- Function to get email by user_id (needed for username-based login)
CREATE OR REPLACE FUNCTION public.get_email_by_user_id(uid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = uid;
  RETURN user_email;
END;
$$;
