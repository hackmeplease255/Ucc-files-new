-- Create function to update read_count on issues table
CREATE OR REPLACE FUNCTION update_issue_read_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the read_count in issues table
  UPDATE issues
  SET read_count = (
    SELECT COUNT(*)
    FROM issue_reads
    WHERE issue_id = NEW.issue_id
  )
  WHERE id = NEW.issue_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on issue_reads table
DROP TRIGGER IF EXISTS update_read_count_trigger ON issue_reads;
CREATE TRIGGER update_read_count_trigger
AFTER INSERT ON issue_reads
FOR EACH ROW
EXECUTE FUNCTION update_issue_read_count();

-- Enable realtime for issues table
ALTER TABLE issues REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE issues;