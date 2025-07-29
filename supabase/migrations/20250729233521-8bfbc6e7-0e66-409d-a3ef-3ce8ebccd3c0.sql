-- Update the hash_password function to use MD5 crypt format (compatible with PAM)
CREATE OR REPLACE FUNCTION public.hash_password(plain_password text)
RETURNS text
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN crypt(plain_password, gen_salt('md5'));
END;
$function$;

-- Update existing user password to MD5 format
UPDATE public.ftp_users 
SET password_hash = crypt('123456', gen_salt('md5'))
WHERE username = 'nasser';