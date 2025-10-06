-- Fix RLS policies for issue_reads to allow proper mark as read functionality
-- Drop existing policies and recreate them with proper permissions

DROP POLICY IF EXISTS "Teachers can insert reads" ON public.issue_reads;
DROP POLICY IF EXISTS "Teachers can view reads" ON public.issue_reads;

-- Create new policies that allow teachers to mark issues as read
CREATE POLICY "Teachers can insert their own reads" 
ON public.issue_reads 
FOR INSERT 
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Anyone can view reads for dashboard functionality" 
ON public.issue_reads 
FOR SELECT 
USING (true);

-- Also update the issues table policies to ensure proper read/write access
DROP POLICY IF EXISTS "Teachers can update issues" ON public.issues;

CREATE POLICY "Teachers can update issue status and read fields" 
ON public.issues 
FOR UPDATE 
USING (true)
WITH CHECK (true);