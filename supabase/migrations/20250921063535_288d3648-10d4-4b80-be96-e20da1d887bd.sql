-- Add read_count column to track how many teachers have read the issue
ALTER TABLE public.issues 
ADD COLUMN read_count INTEGER DEFAULT 0;

-- Create a new table to track which teachers have read which issues
CREATE TABLE public.issue_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(issue_id, teacher_id)
);

-- Create a table for teacher replies to issues
CREATE TABLE public.issue_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a table for teacher reactions/comments (separate from replies)
CREATE TABLE public.issue_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'important', 'resolved', 'comment')),
  comment TEXT, -- Optional comment text
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on new tables
ALTER TABLE public.issue_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_reactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for issue_reads
CREATE POLICY "Teachers can view reads" 
ON public.issue_reads 
FOR SELECT 
USING (true);

CREATE POLICY "Teachers can insert reads" 
ON public.issue_reads 
FOR INSERT 
WITH CHECK (true);

-- Create RLS policies for issue_replies
CREATE POLICY "Students can view replies to their issues" 
ON public.issue_replies 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.issues 
    WHERE issues.id = issue_replies.issue_id 
    AND issues.student_id = (SELECT id FROM public.students WHERE id = auth.uid())
  )
);

CREATE POLICY "Teachers can view all replies" 
ON public.issue_replies 
FOR SELECT 
USING (true);

CREATE POLICY "Teachers can create replies" 
ON public.issue_replies 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Teachers can update their own replies" 
ON public.issue_replies 
FOR UPDATE 
USING (teacher_id = (SELECT id FROM public.teachers WHERE id = auth.uid()));

-- Create RLS policies for issue_reactions
CREATE POLICY "Teachers can view reactions" 
ON public.issue_reactions 
FOR SELECT 
USING (true);

CREATE POLICY "Teachers can create reactions" 
ON public.issue_reactions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Teachers can update their own reactions" 
ON public.issue_reactions 
FOR UPDATE 
USING (teacher_id = (SELECT id FROM public.teachers WHERE id = auth.uid()));

-- Create function to update read count when a teacher reads an issue
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic read count updates
CREATE TRIGGER update_issue_read_count_trigger
AFTER INSERT ON public.issue_reads
FOR EACH ROW
EXECUTE FUNCTION public.update_issue_read_count();

-- Create trigger for updated_at on issue_replies
CREATE TRIGGER update_issue_replies_updated_at
BEFORE UPDATE ON public.issue_replies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update issues table status to be more descriptive
ALTER TABLE public.issues 
ALTER COLUMN status SET DEFAULT 'pending';

-- Add a function to get issue status with read count
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
$$ LANGUAGE plpgsql IMMUTABLE;