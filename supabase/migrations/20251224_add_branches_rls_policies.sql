-- Add missing RLS policies for branches table
-- This allows admins to insert, update, and delete branches

-- Policy: Admins can insert branches
CREATE POLICY "admins_insert_branches"
  ON public.branches
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'Admin'
    )
  );

-- Policy: Admins can update branches
CREATE POLICY "admins_update_branches"
  ON public.branches
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'Admin'
    )
  );

-- Policy: Admins can delete branches
CREATE POLICY "admins_delete_branches"
  ON public.branches
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'Admin'
    )
  );
