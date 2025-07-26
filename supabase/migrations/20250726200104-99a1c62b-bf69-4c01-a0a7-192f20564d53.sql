-- Create enum for user status
CREATE TYPE public.user_status AS ENUM ('active', 'inactive', 'suspended');

-- Create enum for log actions
CREATE TYPE public.log_action AS ENUM ('login', 'logout', 'upload', 'download', 'delete', 'mkdir', 'rmdir');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create FTP users table
CREATE TABLE public.ftp_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  home_directory TEXT NOT NULL,
  status user_status DEFAULT 'active',
  quota_mb INTEGER DEFAULT 1000,
  used_space_mb INTEGER DEFAULT 0,
  max_connections INTEGER DEFAULT 5,
  allowed_ips TEXT[], -- Array of allowed IP addresses
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '365 days'),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user files table to track uploaded files
CREATE TABLE public.user_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ftp_user_id UUID REFERENCES public.ftp_users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_mb DECIMAL(10,2) NOT NULL,
  file_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE
);

-- Create access logs table
CREATE TABLE public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ftp_user_id UUID REFERENCES public.ftp_users(id) ON DELETE CASCADE,
  action log_action NOT NULL,
  file_path TEXT,
  client_ip INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create server status table
CREATE TABLE public.server_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_name TEXT NOT NULL DEFAULT 'FTP Server',
  is_running BOOLEAN DEFAULT false,
  port INTEGER DEFAULT 21,
  max_connections INTEGER DEFAULT 100,
  current_connections INTEGER DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE,
  last_restart TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ftp_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create RLS policies for ftp_users (authenticated users can manage FTP users)
CREATE POLICY "Authenticated users can view all FTP users"
  ON public.ftp_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create FTP users"
  ON public.ftp_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update FTP users"
  ON public.ftp_users FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete FTP users"
  ON public.ftp_users FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for user_files
CREATE POLICY "Authenticated users can view all user files"
  ON public.user_files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage user files"
  ON public.user_files FOR ALL
  TO authenticated
  USING (true);

-- Create RLS policies for access_logs
CREATE POLICY "Authenticated users can view all access logs"
  ON public.access_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert access logs"
  ON public.access_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create RLS policies for server_status
CREATE POLICY "Authenticated users can view server status"
  ON public.server_status FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update server status"
  ON public.server_status FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert server status"
  ON public.server_status FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_ftp_users_username ON public.ftp_users(username);
CREATE INDEX idx_ftp_users_status ON public.ftp_users(status);
CREATE INDEX idx_ftp_users_created_by ON public.ftp_users(created_by);
CREATE INDEX idx_user_files_ftp_user_id ON public.user_files(ftp_user_id);
CREATE INDEX idx_user_files_uploaded_at ON public.user_files(uploaded_at);
CREATE INDEX idx_access_logs_ftp_user_id ON public.access_logs(ftp_user_id);
CREATE INDEX idx_access_logs_timestamp ON public.access_logs(timestamp);
CREATE INDEX idx_access_logs_action ON public.access_logs(action);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ftp_users_updated_at
  BEFORE UPDATE ON public.ftp_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_server_status_updated_at
  BEFORE UPDATE ON public.server_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if FTP user is active
CREATE OR REPLACE FUNCTION public.is_ftp_user_active(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT is_active AND CURRENT_DATE BETWEEN start_date AND end_date
  FROM public.ftp_users 
  WHERE id = user_id;
$$;

-- Create trigger to update used space when files are added/removed
CREATE OR REPLACE FUNCTION public.update_user_quota()
RETURNS TRIGGER AS $$
BEGIN
  -- Update used space when file is added
  IF TG_OP = 'INSERT' THEN
    UPDATE public.ftp_users 
    SET used_space_mb = used_space_mb + NEW.file_size_mb,
        updated_at = now()
    WHERE id = NEW.ftp_user_id;
    RETURN NEW;
  END IF;
  
  -- Update used space when file is deleted
  IF TG_OP = 'DELETE' THEN
    UPDATE public.ftp_users 
    SET used_space_mb = used_space_mb - OLD.file_size_mb,
        updated_at = now()
    WHERE id = OLD.ftp_user_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_quota_trigger
  AFTER INSERT OR DELETE ON public.user_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_quota();

-- Insert default server status record
INSERT INTO public.server_status (server_name, is_running, port, max_connections)
VALUES ('Main FTP Server', false, 21, 100);