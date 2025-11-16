-- Add category column to issues table
ALTER TABLE issues ADD COLUMN category text NOT NULL DEFAULT 'Other';

-- Add check constraint for valid categories
ALTER TABLE issues ADD CONSTRAINT valid_category CHECK (
  category IN (
    'Academic issue',
    'Behavioural issue',
    'Sexual harassment/And other private issues',
    'Administration issue',
    'Financial/fees issue',
    'Other'
  )
);

-- Drop existing RLS policies for issues
DROP POLICY IF EXISTS "Students can view all issues" ON issues;
DROP POLICY IF EXISTS "Teachers can view all issues" ON issues;
DROP POLICY IF EXISTS "Teachers can update issues" ON issues;

-- Students can view their own issues
CREATE POLICY "Students can view their own issues"
ON issues
FOR SELECT
USING (student_id = (SELECT id FROM students WHERE id = student_id));

-- Staff can view non-sensitive issues
CREATE POLICY "Staff can view non-sensitive issues"
ON issues
FOR SELECT
USING (
  category != 'Sexual harassment/And other private issues' AND
  teacher_id = (SELECT id FROM teachers WHERE id = teacher_id)
);

-- Admins can view all issues including sensitive ones
CREATE POLICY "Admins can view all issues"
ON issues
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM admins WHERE id IS NOT NULL)
);

-- Staff can update non-sensitive issues
CREATE POLICY "Staff can update non-sensitive issues"
ON issues
FOR UPDATE
USING (
  category != 'Sexual harassment/And other private issues' AND
  teacher_id = (SELECT id FROM teachers WHERE id = teacher_id)
);

-- Admins can update all issues
CREATE POLICY "Admins can update all issues"
ON issues
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM admins WHERE id IS NOT NULL)
);

-- Drop existing RLS policies for issue_replies
DROP POLICY IF EXISTS "Anyone can view replies" ON issue_replies;

-- Students can view replies to their own issues
CREATE POLICY "Students can view their issue replies"
ON issue_replies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM issues 
    WHERE issues.id = issue_replies.issue_id 
    AND issues.student_id = (SELECT id FROM students WHERE id = issues.student_id)
  )
);

-- Staff can view replies to non-sensitive issues
CREATE POLICY "Staff can view non-sensitive issue replies"
ON issue_replies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM issues 
    WHERE issues.id = issue_replies.issue_id 
    AND issues.category != 'Sexual harassment/And other private issues'
  )
);

-- Admins can view all replies
CREATE POLICY "Admins can view all replies"
ON issue_replies
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM admins WHERE id IS NOT NULL)
);

-- Allow admins and staff to create replies
CREATE POLICY "Admins and staff can create replies"
ON issue_replies
FOR INSERT
WITH CHECK (
  author_type IN ('admin', 'teacher') AND
  (
    -- Admins can reply to any issue
    (author_type = 'admin' AND EXISTS (SELECT 1 FROM admins WHERE id = author_id))
    OR
    -- Staff can reply to non-sensitive issues
    (author_type = 'teacher' AND EXISTS (
      SELECT 1 FROM issues 
      WHERE issues.id = issue_replies.issue_id 
      AND issues.category != 'Sexual harassment/And other private issues'
    ))
  )
);