-- Add columns to admins table
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS username TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT 'admin123';

-- Add unique constraint on username
ALTER TABLE public.admins DROP CONSTRAINT IF EXISTS admins_username_key;
ALTER TABLE public.admins ADD CONSTRAINT admins_username_key UNIQUE (username);

-- Add columns to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS university_registration_number TEXT NOT NULL DEFAULT '';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT '';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- Add unique constraint on registration number
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_university_registration_number_key;
ALTER TABLE public.students ADD CONSTRAINT students_university_registration_number_key UNIQUE (university_registration_number);

-- Add check constraint for student status
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_status_check;
ALTER TABLE public.students ADD CONSTRAINT students_status_check CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add columns to teachers table
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT '';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- Add unique constraint on email
ALTER TABLE public.teachers DROP CONSTRAINT IF EXISTS teachers_email_key;
ALTER TABLE public.teachers ADD CONSTRAINT teachers_email_key UNIQUE (email);

-- Add check constraint for teacher status
ALTER TABLE public.teachers DROP CONSTRAINT IF EXISTS teachers_status_check;
ALTER TABLE public.teachers ADD CONSTRAINT teachers_status_check CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add columns to issues table
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open';
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS read_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS student_id BIGINT REFERENCES public.students(id) ON DELETE CASCADE;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS teacher_id BIGINT REFERENCES public.teachers(id) ON DELETE SET NULL;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Add check constraint for issue status
ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_status_check;
ALTER TABLE public.issues ADD CONSTRAINT issues_status_check CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'));

-- Add columns to issue_reads table
ALTER TABLE public.issue_reads ADD COLUMN IF NOT EXISTS issue_id BIGINT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE;
ALTER TABLE public.issue_reads ADD COLUMN IF NOT EXISTS student_id BIGINT REFERENCES public.students(id) ON DELETE CASCADE;
ALTER TABLE public.issue_reads ADD COLUMN IF NOT EXISTS teacher_id BIGINT REFERENCES public.teachers(id) ON DELETE CASCADE;

-- Add constraint to ensure either student_id or teacher_id is set
ALTER TABLE public.issue_reads DROP CONSTRAINT IF EXISTS issue_reads_reader_check;
ALTER TABLE public.issue_reads ADD CONSTRAINT issue_reads_reader_check CHECK (
  (student_id IS NOT NULL AND teacher_id IS NULL) OR 
  (student_id IS NULL AND teacher_id IS NOT NULL)
);

-- Add columns to issue_replies table
ALTER TABLE public.issue_replies ADD COLUMN IF NOT EXISTS issue_id BIGINT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE;
ALTER TABLE public.issue_replies ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';
ALTER TABLE public.issue_replies ADD COLUMN IF NOT EXISTS author_id BIGINT NOT NULL;
ALTER TABLE public.issue_replies ADD COLUMN IF NOT EXISTS author_type TEXT NOT NULL;

-- Add check constraint for author type
ALTER TABLE public.issue_replies DROP CONSTRAINT IF EXISTS issue_replies_author_type_check;
ALTER TABLE public.issue_replies ADD CONSTRAINT issue_replies_author_type_check CHECK (author_type IN ('student', 'teacher'));

-- Add columns to issues_reactions table
ALTER TABLE public.issues_reactions ADD COLUMN IF NOT EXISTS issue_id BIGINT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE;
ALTER TABLE public.issues_reactions ADD COLUMN IF NOT EXISTS user_id BIGINT NOT NULL;
ALTER TABLE public.issues_reactions ADD COLUMN IF NOT EXISTS user_type TEXT NOT NULL;
ALTER TABLE public.issues_reactions ADD COLUMN IF NOT EXISTS reaction_type TEXT NOT NULL;

-- Add check constraint for user type
ALTER TABLE public.issues_reactions DROP CONSTRAINT IF EXISTS issues_reactions_user_type_check;
ALTER TABLE public.issues_reactions ADD CONSTRAINT issues_reactions_user_type_check CHECK (user_type IN ('student', 'teacher'));

-- Add check constraint for reaction type
ALTER TABLE public.issues_reactions DROP CONSTRAINT IF EXISTS issues_reactions_reaction_type_check;
ALTER TABLE public.issues_reactions ADD CONSTRAINT issues_reactions_reaction_type_check CHECK (reaction_type IN ('like', 'helpful', 'resolved'));

-- Create unique constraint to prevent duplicate reactions
ALTER TABLE public.issues_reactions DROP CONSTRAINT IF EXISTS issues_reactions_unique;
ALTER TABLE public.issues_reactions ADD CONSTRAINT issues_reactions_unique UNIQUE (issue_id, user_id, user_type, reaction_type);

-- Enable Row Level Security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students table
DROP POLICY IF EXISTS "Students can view their own data" ON public.students;
CREATE POLICY "Students can view their own data" ON public.students
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Students can update their own data" ON public.students;
CREATE POLICY "Students can update their own data" ON public.students
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow student registration" ON public.students;
CREATE POLICY "Allow student registration" ON public.students
  FOR INSERT WITH CHECK (true);

-- RLS Policies for teachers table
DROP POLICY IF EXISTS "Teachers can view their own data" ON public.teachers;
CREATE POLICY "Teachers can view their own data" ON public.teachers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Teachers can update their own data" ON public.teachers;
CREATE POLICY "Teachers can update their own data" ON public.teachers
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow teacher registration" ON public.teachers;
CREATE POLICY "Allow teacher registration" ON public.teachers
  FOR INSERT WITH CHECK (true);

-- RLS Policies for admins table
DROP POLICY IF EXISTS "Admins can view admin data" ON public.admins;
CREATE POLICY "Admins can view admin data" ON public.admins
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update admin data" ON public.admins;
CREATE POLICY "Admins can update admin data" ON public.admins
  FOR UPDATE USING (true);

-- RLS Policies for issues table
DROP POLICY IF EXISTS "Students can view all issues" ON public.issues;
CREATE POLICY "Students can view all issues" ON public.issues
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Students can create issues" ON public.issues;
CREATE POLICY "Students can create issues" ON public.issues
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Students can update their own issues" ON public.issues;
CREATE POLICY "Students can update their own issues" ON public.issues
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Teachers can view all issues" ON public.issues;
CREATE POLICY "Teachers can view all issues" ON public.issues
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Teachers can update issues" ON public.issues;
CREATE POLICY "Teachers can update issues" ON public.issues
  FOR UPDATE USING (true);

-- RLS Policies for issue_reads table
DROP POLICY IF EXISTS "Anyone can view issue reads" ON public.issue_reads;
CREATE POLICY "Anyone can view issue reads" ON public.issue_reads
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert issue reads" ON public.issue_reads;
CREATE POLICY "Anyone can insert issue reads" ON public.issue_reads
  FOR INSERT WITH CHECK (true);

-- RLS Policies for issue_replies table
DROP POLICY IF EXISTS "Anyone can view replies" ON public.issue_replies;
CREATE POLICY "Anyone can view replies" ON public.issue_replies
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create replies" ON public.issue_replies;
CREATE POLICY "Anyone can create replies" ON public.issue_replies
  FOR INSERT WITH CHECK (true);

-- RLS Policies for issues_reactions table
DROP POLICY IF EXISTS "Anyone can view reactions" ON public.issues_reactions;
CREATE POLICY "Anyone can view reactions" ON public.issues_reactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can add reactions" ON public.issues_reactions;
CREATE POLICY "Anyone can add reactions" ON public.issues_reactions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can remove reactions" ON public.issues_reactions;
CREATE POLICY "Anyone can remove reactions" ON public.issues_reactions
  FOR DELETE USING (true);

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for issues table
DROP TRIGGER IF EXISTS update_issues_updated_at ON public.issues;
CREATE TRIGGER update_issues_updated_at
    BEFORE UPDATE ON public.issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin account if not exists
INSERT INTO public.admins (username, password)
VALUES ('admin', 'admin123')
ON CONFLICT (username) DO NOTHING;