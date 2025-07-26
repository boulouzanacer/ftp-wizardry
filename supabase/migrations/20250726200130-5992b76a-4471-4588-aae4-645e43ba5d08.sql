-- Fix security warnings by setting search_path for functions

-- Update the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update the is_ftp_user_active function  
CREATE OR REPLACE FUNCTION public.is_ftp_user_active(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_active AND CURRENT_DATE BETWEEN start_date AND end_date
  FROM public.ftp_users 
  WHERE id = user_id;
$$;

-- Update the update_user_quota function
CREATE OR REPLACE FUNCTION public.update_user_quota()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;