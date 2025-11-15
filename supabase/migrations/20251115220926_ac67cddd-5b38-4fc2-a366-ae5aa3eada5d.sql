-- Add matching preferences to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS seeking_support boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS support_preferences jsonb DEFAULT '{"styles": [], "topics": []}'::jsonb;

-- Temporarily drop foreign key constraint to insert test profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Insert 6 fake profiles with matching preferences for testing
INSERT INTO profiles (id, display_name, is_anonymous, seeking_support, support_preferences)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Anonymous Seeker 1', true, true, 
   '{"styles": ["listener", "empathy"], "topics": ["Relationship Issues", "Anxiety"]}'::jsonb),
  
  ('22222222-2222-2222-2222-222222222222', 'Anonymous Supporter 1', true, false,
   '{"styles": ["listener", "empathy", "encouragement"], "topics": ["Relationship Issues", "Anxiety"]}'::jsonb),
  
  ('33333333-3333-3333-3333-333333333333', 'Anonymous Seeker 2', true, true,
   '{"styles": ["advice", "shared-experience"], "topics": ["Depression", "Life Transitions"]}'::jsonb),
  
  ('44444444-4444-4444-4444-444444444444', 'Anonymous Seeker 3', true, true,
   '{"styles": ["shared-experience", "encouragement"], "topics": ["Career Stress", "Anxiety"]}'::jsonb),
  
  ('55555555-5555-5555-5555-555555555555', 'Anonymous Supporter 2', true, false,
   '{"styles": ["advice", "shared-experience"], "topics": ["Career Stress", "Depression"]}'::jsonb),
  
  ('66666666-6666-6666-6666-666666666666', 'Anonymous Seeker 4', true, true,
   '{"styles": ["listener", "acceptance", "shared-experience"], "topics": ["Coming Out", "Anxiety"]}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Re-add foreign key constraint but make it NOT VALID so existing test data isn't checked
ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE 
NOT VALID;