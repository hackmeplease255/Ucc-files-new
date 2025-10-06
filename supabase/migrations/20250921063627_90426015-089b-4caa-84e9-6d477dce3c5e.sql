-- Fix the get_issue_status_display function search path
CREATE OR REPLACE FUNCTION public.get_issue_status_display(issue_read_count INTEGER, has_replies BOOLEAN)
RETURNS TEXT AS $$
BEGIN
  IF has_replies THEN
    RETURN 'replied';
  ELSIF issue_read_count = 0 THEN
    RETURN 'pending';
  ELSIF issue_read_count = 1 THEN
    RETURN 'read_1';
  ELSIF issue_read_count = 2 THEN
    RETURN 'read_2';
  ELSE
    RETURN 'read_' || issue_read_count::text;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;