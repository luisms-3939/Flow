-- Prevent authenticated users from inserting their own roles
-- Roles are only assigned by the handle_new_user() SECURITY DEFINER function
CREATE POLICY "Prevent role insertion"
  ON public.user_roles FOR INSERT
  WITH CHECK (false);