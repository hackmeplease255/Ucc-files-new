-- Fix admin replies failing due to CHECK constraint
ALTER TABLE public.issue_replies DROP CONSTRAINT IF EXISTS issue_replies_author_type_check;
ALTER TABLE public.issue_replies ADD CONSTRAINT issue_replies_author_type_check CHECK (author_type IN ('admin', 'teacher'));
