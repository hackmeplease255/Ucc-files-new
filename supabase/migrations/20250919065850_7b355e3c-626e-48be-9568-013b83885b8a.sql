-- Allow students to delete their own issues
CREATE POLICY "Students can delete their own issues" 
ON public.issues 
FOR DELETE 
USING (student_id = (
  SELECT id FROM public.students 
  WHERE university_registration_number = current_setting('request.jwt.claims', true)::json->>'sub'
));

-- Ensure description column can handle long text
ALTER TABLE public.issues 
ALTER COLUMN description TYPE TEXT;