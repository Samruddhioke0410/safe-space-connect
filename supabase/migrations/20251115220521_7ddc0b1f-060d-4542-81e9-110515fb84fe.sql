
-- Drop the old constraint
ALTER TABLE anonymous_matches DROP CONSTRAINT IF EXISTS valid_match_status;

-- Add new constraint that allows 'waiting', 'active', and 'ended' statuses
ALTER TABLE anonymous_matches ADD CONSTRAINT valid_match_status 
CHECK (status IN ('waiting', 'active', 'ended'));
