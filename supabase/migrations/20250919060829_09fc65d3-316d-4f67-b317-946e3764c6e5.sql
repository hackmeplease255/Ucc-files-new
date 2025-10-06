-- Create user types enum
CREATE TYPE public.user_role AS ENUM ('student', 'teacher', 'admin');

-- Create user status enum  
CREATE TYPE public.user_status AS ENUM ('pending', 'approved', 'rejected');

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  university_registration_number TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  status public.user_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teachers table  
CREATE TABLE public.teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  status public.user_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create issues/messages table
CREATE TABLE public.issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_by_teacher_id UUID REFERENCES public.teachers(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Create policies for students
CREATE POLICY "Students can view their own data" 
ON public.students 
FOR SELECT 
USING (true);

CREATE POLICY "Students can insert their own data" 
ON public.students 
FOR INSERT 
WITH CHECK (true);

-- Create policies for teachers
CREATE POLICY "Teachers can view their own data" 
ON public.teachers 
FOR SELECT 
USING (true);

CREATE POLICY "Teachers can insert their own data" 
ON public.teachers 
FOR INSERT 
WITH CHECK (true);

-- Create policies for issues
CREATE POLICY "Students can view their own issues" 
ON public.issues 
FOR SELECT 
USING (true);

CREATE POLICY "Students can create issues" 
ON public.issues 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Teachers can view all issues" 
ON public.issues 
FOR SELECT 
USING (true);

CREATE POLICY "Teachers can update issues" 
ON public.issues 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();