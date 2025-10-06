-- Fix the function search path security warning
CREATE OR REPLACE FUNCTION public.update_issue_read_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the read count in the issues table
  UPDATE public.issues 
  SET read_count = (
    SELECT COUNT(*) 
    FROM public.issue_reads 
    WHERE issue_id = NEW.issue_id
  ),
  is_read = true
  WHERE id = NEW.issue_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;