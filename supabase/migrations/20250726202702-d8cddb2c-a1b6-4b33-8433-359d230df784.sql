-- Update RLS policies for server_status to allow unauthenticated access for testing
DROP POLICY IF EXISTS "Authenticated users can insert server status" ON public.server_status;
DROP POLICY IF EXISTS "Authenticated users can update server status" ON public.server_status;
DROP POLICY IF EXISTS "Authenticated users can view server status" ON public.server_status;

-- Create more permissive policies for testing
CREATE POLICY "Allow all operations on server_status for testing"
  ON public.server_status
  FOR ALL
  USING (true)
  WITH CHECK (true);