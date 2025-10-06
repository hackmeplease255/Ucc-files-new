-- Remove the incorrectly created student record with email that looks like a teacher signup
DELETE FROM students WHERE name = 'nn' AND university_registration_number = 'ko@gmail.com';

-- If the user meant to register as a teacher, they should re-register using the teacher form
-- The system is working correctly - the issue was likely user error during registration
