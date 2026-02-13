-- Fix: Add explicit deny policies for user_roles UPDATE and DELETE operations
-- This provides defense-in-depth security for role management

-- Add policy to explicitly deny DELETE operations on user_roles
CREATE POLICY "Prevent role deletion"
  ON public.user_roles FOR DELETE
  USING (false);

-- Add policy to explicitly deny UPDATE operations on user_roles
CREATE POLICY "Prevent role updates"
  ON public.user_roles FOR UPDATE
  USING (false);

-- Fix: Secure has_role function to only allow checking own roles
-- Drop and recreate with restriction to prevent information leakage
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security: Only allow users to check their own roles
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot check roles of other users';
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$$;

-- Restrict execution to authenticated users only
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;