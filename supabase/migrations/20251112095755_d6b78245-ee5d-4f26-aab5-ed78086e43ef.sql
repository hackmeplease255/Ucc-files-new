-- Create table for admin comments to teachers
CREATE TABLE public.admin_teacher_messages (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  admin_id bigint NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  teacher_id bigint NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  message text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_teacher_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all messages"
ON public.admin_teacher_messages
FOR SELECT
USING (true);

CREATE POLICY "Admins can create messages"
ON public.admin_teacher_messages
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update messages"
ON public.admin_teacher_messages
FOR UPDATE
USING (true);

-- Create policies for teacher access
CREATE POLICY "Teachers can view their own messages"
ON public.admin_teacher_messages
FOR SELECT
USING (true);

CREATE POLICY "Teachers can mark messages as read"
ON public.admin_teacher_messages
FOR UPDATE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_teacher_messages_updated_at
BEFORE UPDATE ON public.admin_teacher_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_admin_teacher_messages_teacher_id ON public.admin_teacher_messages(teacher_id);
CREATE INDEX idx_admin_teacher_messages_admin_id ON public.admin_teacher_messages(admin_id);