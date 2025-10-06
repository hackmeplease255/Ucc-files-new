-- 1) Fix function volatility and make it work for INSERT and DELETE
CREATE OR REPLACE FUNCTION public.update_issue_read_count()
RETURNS trigger
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_issue_id uuid;
BEGIN
  v_issue_id := COALESCE(NEW.issue_id, OLD.issue_id);

  -- Update the read_count and is_read flags on the issue
  UPDATE public.issues 
  SET 
    read_count = (
      SELECT COUNT(*) 
      FROM public.issue_reads 
      WHERE issue_id = v_issue_id
    ),
    is_read = (
      SELECT COUNT(*) > 0 
      FROM public.issue_reads 
      WHERE issue_id = v_issue_id
    )
  WHERE id = v_issue_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 2) Create triggers on issue_reads for INSERT and DELETE
DROP TRIGGER IF EXISTS trg_issue_reads_after_insert ON public.issue_reads;
DROP TRIGGER IF EXISTS trg_issue_reads_after_delete ON public.issue_reads;

CREATE TRIGGER trg_issue_reads_after_insert
AFTER INSERT ON public.issue_reads
FOR EACH ROW
EXECUTE FUNCTION public.update_issue_read_count();

CREATE TRIGGER trg_issue_reads_after_delete
AFTER DELETE ON public.issue_reads
FOR EACH ROW
EXECUTE FUNCTION public.update_issue_read_count();

-- 3) Adjust RLS policies so app accounts (no Supabase auth) can insert
DROP POLICY IF EXISTS "Teachers can insert their own reads" ON public.issue_reads;
DROP POLICY IF EXISTS "Anyone can view reads for dashboard functionality" ON public.issue_reads;

-- Allow inserting reads if the referenced teacher and issue exist
CREATE POLICY "Allow insert reads when teacher and issue exist"
ON public.issue_reads
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = teacher_id)
  AND EXISTS (SELECT 1 FROM public.issues i WHERE i.id = issue_id)
);

-- Keep reads visible to everyone for dashboard aggregation
CREATE POLICY "Allow select reads"
ON public.issue_reads
FOR SELECT
USING (true);
