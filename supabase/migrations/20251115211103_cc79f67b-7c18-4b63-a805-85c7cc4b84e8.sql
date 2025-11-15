-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_anonymous BOOLEAN DEFAULT true
);

-- Create channels table
CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  topic TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  member_count INTEGER DEFAULT 0
);

-- Create subchannels table
CREATE TABLE public.subchannels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  subchannel_id UUID REFERENCES public.subchannels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create channel members table
CREATE TABLE public.channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- Create positive feed table
CREATE TABLE public.positive_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  likes_count INTEGER DEFAULT 0
);

-- Create crisis resources table
CREATE TABLE public.crisis_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  description TEXT,
  country TEXT DEFAULT 'US',
  is_24_7 BOOLEAN DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subchannels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positive_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for channels
CREATE POLICY "Anyone can view channels" ON public.channels FOR SELECT USING (true);

-- RLS Policies for subchannels
CREATE POLICY "Anyone can view subchannels" ON public.subchannels FOR SELECT USING (true);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in channels they're members of" ON public.messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.channel_members 
      WHERE channel_members.channel_id = messages.channel_id 
      AND channel_members.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert messages in channels they're members of" ON public.messages FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.channel_members 
      WHERE channel_members.channel_id = messages.channel_id 
      AND channel_members.user_id = auth.uid()
    )
  );

-- RLS Policies for channel members
CREATE POLICY "Users can view channel members" ON public.channel_members FOR SELECT USING (true);
CREATE POLICY "Users can join channels" ON public.channel_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave channels" ON public.channel_members FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for positive feed
CREATE POLICY "Anyone can view positive feed" ON public.positive_feed FOR SELECT USING (true);

-- RLS Policies for crisis resources
CREATE POLICY "Anyone can view crisis resources" ON public.crisis_resources FOR SELECT USING (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;

-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, is_anonymous)
  VALUES (NEW.id, 'Anonymous User', true);
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert demo channels
INSERT INTO public.channels (name, description, topic, icon) VALUES
  ('Career Stress', 'Support for work-related challenges', 'career', '💼'),
  ('Grief & Loss', 'A safe space for processing loss', 'grief', '🕊️'),
  ('Coming Out', 'Support for LGBTQ+ journeys', 'identity', '🌈'),
  ('Addiction Recovery', 'Support for recovery journeys', 'recovery', '💪'),
  ('New Parents', 'Support for parenthood challenges', 'parenting', '👶');

-- Insert demo crisis resources
INSERT INTO public.crisis_resources (name, phone, website, description, country) VALUES
  ('National Suicide Prevention Lifeline', '988', 'https://988lifeline.org', '24/7 crisis support', 'US'),
  ('Crisis Text Line', 'Text HOME to 741741', 'https://crisistextline.org', 'Free 24/7 text support', 'US'),
  ('SAMHSA National Helpline', '1-800-662-4357', 'https://samhsa.gov', 'Substance abuse and mental health', 'US'),
  ('The Trevor Project', '1-866-488-7386', 'https://thetrevorproject.org', 'LGBTQ+ youth crisis support', 'US');

-- Insert demo positive feed content
INSERT INTO public.positive_feed (title, content, author) VALUES
  ('Small Steps Lead to Big Changes', 'Remember, every journey starts with a single step. Be patient with yourself.', 'Community Team'),
  ('You Are Not Alone', 'Millions of people face similar challenges. Reaching out is a sign of strength.', 'Community Team'),
  ('Today''s Reminder', 'It''s okay to not be okay. What matters is that you''re here, and you''re trying.', 'Community Team');