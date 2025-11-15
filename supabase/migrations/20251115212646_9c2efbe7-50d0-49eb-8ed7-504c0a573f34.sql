-- Create peer_requests table for 1:1 support requests
CREATE TABLE public.peer_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'rejected'))
);

-- Create private_messages table for 1:1 chats
CREATE TABLE public.private_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create anonymous_matches table
CREATE TABLE public.anonymous_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_match_status CHECK (status IN ('active', 'ended'))
);

-- Create match_messages table
CREATE TABLE public.match_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.anonymous_matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketplace_items table
CREATE TABLE public.marketplace_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  external_link TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_category CHECK (category IN ('book', 'merch', 'event', 'workshop'))
);

-- Create user_safety_logs table for pattern detection
CREATE TABLE public.user_safety_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_event_type CHECK (event_type IN ('pii_blocked', 'crisis_detected', 'image_blocked', 'escalated')),
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high'))
);

-- Enable RLS on all tables
ALTER TABLE public.peer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_safety_logs ENABLE ROW LEVEL SECURITY;

-- Peer requests policies
CREATE POLICY "Users can send peer requests"
  ON public.peer_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can view their own peer requests"
  ON public.peer_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Recipients can update peer requests"
  ON public.peer_requests FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Private messages policies
CREATE POLICY "Users can send private messages"
  ON public.private_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view their own private messages"
  ON public.private_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Anonymous matches policies
CREATE POLICY "Users can view their own matches"
  ON public.anonymous_matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can create matches"
  ON public.anonymous_matches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can end their matches"
  ON public.anonymous_matches FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Match messages policies
CREATE POLICY "Users can send messages in their matches"
  ON public.match_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.anonymous_matches
      WHERE id = match_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
      AND status = 'active'
    )
  );

CREATE POLICY "Users can view messages in their matches"
  ON public.match_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.anonymous_matches
      WHERE id = match_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- Marketplace policies
CREATE POLICY "Anyone can view active marketplace items"
  ON public.marketplace_items FOR SELECT
  USING (is_active = true);

-- Safety logs policies (users can only view their own)
CREATE POLICY "Users can view their own safety logs"
  ON public.user_safety_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert safety logs"
  ON public.user_safety_logs FOR INSERT
  WITH CHECK (true);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.peer_requests;

-- Insert demo marketplace items
INSERT INTO public.marketplace_items (title, description, category, price, external_link) VALUES
  ('The Gifts of Imperfection', 'A guide to letting go of who you think you should be and embracing who you are by Brené Brown', 'book', 14.99, 'https://brenebrown.com'),
  ('You Are Enough Hoodie', 'Comfortable hoodie with empowering message', 'merch', 39.99, 'https://example.com'),
  ('Mindfulness Workshop', 'Learn practical mindfulness techniques for daily life', 'workshop', 49.99, 'https://example.com'),
  ('Mental Health Awareness Event', 'Join us for a day of connection and healing', 'event', 25.00, 'https://example.com');