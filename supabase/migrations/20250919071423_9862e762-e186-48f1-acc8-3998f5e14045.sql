-- Add password tracking for security measures
ALTER TABLE public.students 
ADD COLUMN password_created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN force_password_reset BOOLEAN DEFAULT false,
ADD COLUMN last_password_reset TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.teachers 
ADD COLUMN password_created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN force_password_reset BOOLEAN DEFAULT false,
ADD COLUMN last_password_reset TIMESTAMP WITH TIME ZONE;

-- Set password_created_at for existing users (assume they're old and need reset)
UPDATE public.students 
SET password_created_at = created_at,
    force_password_reset = true
WHERE password_created_at IS NULL;

UPDATE public.teachers 
SET password_created_at = created_at,
    force_password_reset = true
WHERE password_created_at IS NULL;

-- Create function to check if password is old (older than 90 days)
CREATE OR REPLACE FUNCTION public.is_password_old(password_date TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN password_date < (now() - interval '90 days');
END;
$$ LANGUAGE plpgsql;