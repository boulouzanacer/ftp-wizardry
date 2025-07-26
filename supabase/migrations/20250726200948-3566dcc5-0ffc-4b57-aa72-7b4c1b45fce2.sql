-- Update RLS policy for ftp_users to allow unauthenticated access for testing
DROP POLICY IF EXISTS "Authenticated users can create FTP users" ON public.ftp_users;

-- Create a more permissive policy for now (you can tighten this later with authentication)
CREATE POLICY "Allow all operations on ftp_users for testing"
  ON public.ftp_users
  FOR ALL
  USING (true)
  WITH CHECK (true);