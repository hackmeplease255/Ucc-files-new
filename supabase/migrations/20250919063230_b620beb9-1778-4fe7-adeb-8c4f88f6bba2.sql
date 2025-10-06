-- Insert test student data
INSERT INTO public.students (name, university_registration_number, password, status) VALUES
('John Doe', '653335777', '233455667', 'approved'),
('Jane Smith', '123456789', 'password123', 'pending'),
('Bob Johnson', '987654321', 'mypass456', 'approved');

-- Insert test teacher data  
INSERT INTO public.teachers (name, email, password, status) VALUES
('Dr. Sarah Wilson', 'sarah@university.edu', 'teacherpass', 'approved'),
('Prof. Mike Brown', 'mike@university.edu', 'profpass123', 'pending'),
('Dr. Lisa Davis', 'lisa@university.edu', 'securepass', 'approved');