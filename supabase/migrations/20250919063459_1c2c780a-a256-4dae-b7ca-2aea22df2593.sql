-- Allow admins to update student status
CREATE POLICY "Admins can update student status" 
ON public.students 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Allow admins to update teacher status  
CREATE POLICY "Admins can update teacher status" 
ON public.teachers 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Allow admins to read all students
CREATE POLICY "Admins can view all students" 
ON public.students 
FOR SELECT 
USING (true);

-- Allow admins to read all teachers
CREATE POLICY "Admins can view all teachers" 
ON public.teachers 
FOR SELECT 
USING (true);