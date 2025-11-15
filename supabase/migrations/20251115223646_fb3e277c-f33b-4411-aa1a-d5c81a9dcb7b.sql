-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'positive-posts',
  'positive-posts',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Storage policies for positive posts
CREATE POLICY "Anyone can view positive post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'positive-posts');

CREATE POLICY "Authenticated users can upload positive post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'positive-posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own positive post images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'positive-posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own positive post images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'positive-posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add user_id and more fields to positive_feed
ALTER TABLE positive_feed
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS is_ai_approved BOOLEAN DEFAULT true;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_positive_feed_user_id ON positive_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_positive_feed_created_at ON positive_feed(created_at DESC);

-- Update RLS policies for positive_feed
DROP POLICY IF EXISTS "Anyone can view positive feed" ON positive_feed;

CREATE POLICY "Anyone can view approved positive feed"
ON positive_feed FOR SELECT
USING (is_ai_approved = true);

CREATE POLICY "Users can insert their own posts"
ON positive_feed FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
ON positive_feed FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
ON positive_feed FOR DELETE
USING (auth.uid() = user_id);