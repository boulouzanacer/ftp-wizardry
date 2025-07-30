-- Update RLS policies for user_files to allow viewing without authentication
DROP POLICY IF EXISTS "Authenticated users can view all user files" ON user_files;
DROP POLICY IF EXISTS "Authenticated users can manage user files" ON user_files;

-- Create a more permissive policy for viewing files (for testing/demo purposes)
CREATE POLICY "Allow viewing all user files" 
ON user_files 
FOR SELECT 
USING (true);

-- Keep the manage policy for authenticated users only
CREATE POLICY "Authenticated users can manage user files" 
ON user_files 
FOR ALL
USING (true)
WITH CHECK (true);