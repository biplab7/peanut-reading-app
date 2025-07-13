-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child', 'educator')),
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create child profiles table
CREATE TABLE public.child_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 3 AND age <= 18),
  reading_level TEXT NOT NULL CHECK (reading_level IN ('beginner', 'elementary', 'intermediate', 'advanced')),
  interests TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stories table
CREATE TABLE public.stories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  reading_level TEXT NOT NULL CHECK (reading_level IN ('beginner', 'elementary', 'intermediate', 'advanced')),
  word_count INTEGER NOT NULL,
  estimated_reading_time INTEGER NOT NULL, -- in minutes
  themes TEXT[] DEFAULT '{}',
  is_generated BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reading sessions table
CREATE TABLE public.reading_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in seconds
  progress JSONB NOT NULL DEFAULT '{}', -- reading progress metrics
  feedback JSONB NOT NULL DEFAULT '{}', -- AI feedback
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  criteria JSONB NOT NULL,
  rewards INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user achievements table
CREATE TABLE public.user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  UNIQUE(child_id, achievement_id)
);

-- Create favorites table
CREATE TABLE public.story_favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, story_id)
);

-- Create parent settings table
CREATE TABLE public.parent_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_filtering TEXT DEFAULT 'moderate' CHECK (content_filtering IN ('strict', 'moderate', 'lenient')),
  session_limits JSONB DEFAULT '{}',
  notifications JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_id)
);

-- Create indexes for better performance
CREATE INDEX idx_child_profiles_parent_id ON public.child_profiles(parent_id);
CREATE INDEX idx_reading_sessions_child_id ON public.reading_sessions(child_id);
CREATE INDEX idx_reading_sessions_story_id ON public.reading_sessions(story_id);
CREATE INDEX idx_reading_sessions_start_time ON public.reading_sessions(start_time);
CREATE INDEX idx_stories_reading_level ON public.stories(reading_level);
CREATE INDEX idx_stories_themes ON public.stories USING GIN(themes);
CREATE INDEX idx_user_achievements_child_id ON public.user_achievements(child_id);
CREATE INDEX idx_story_favorites_child_id ON public.story_favorites(child_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Child profiles: Parents can manage their children's profiles
CREATE POLICY "Parents can view their children" ON public.child_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.id = child_profiles.parent_id
    )
  );

CREATE POLICY "Parents can manage their children" ON public.child_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.id = child_profiles.parent_id
    )
  );

-- Stories: All authenticated users can read stories
CREATE POLICY "Authenticated users can view stories" ON public.stories
  FOR SELECT USING (auth.role() = 'authenticated');

-- Reading sessions: Children and their parents can view sessions
CREATE POLICY "Users can view related reading sessions" ON public.reading_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = reading_sessions.child_id
      AND (cp.parent_id = auth.uid() OR cp.id = auth.uid())
    )
  );

CREATE POLICY "Users can create reading sessions" ON public.reading_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = reading_sessions.child_id
      AND (cp.parent_id = auth.uid() OR cp.id = auth.uid())
    )
  );

-- User achievements: Children and their parents can view achievements
CREATE POLICY "Users can view related achievements" ON public.user_achievements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = user_achievements.child_id
      AND (cp.parent_id = auth.uid() OR cp.id = auth.uid())
    )
  );

-- Story favorites: Children and their parents can manage favorites
CREATE POLICY "Users can manage related favorites" ON public.story_favorites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = story_favorites.child_id
      AND (cp.parent_id = auth.uid() OR cp.id = auth.uid())
    )
  );

-- Parent settings: Parents can manage their own settings
CREATE POLICY "Parents can manage their settings" ON public.parent_settings
  FOR ALL USING (auth.uid() = parent_id);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_child_profiles_updated_at BEFORE UPDATE ON public.child_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parent_settings_updated_at BEFORE UPDATE ON public.parent_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, criteria, rewards) VALUES
('First Story', 'Complete your first story!', '📚', '{"type": "stories_completed", "target": 1}', 10),
('Reading Streak', 'Read for 3 days in a row', '🔥', '{"type": "reading_streak", "target": 3}', 25),
('Speed Reader', 'Read 100 words per minute', '⚡', '{"type": "reading_speed", "target": 100}', 50),
('Accuracy Master', 'Achieve 95% reading accuracy', '🎯', '{"type": "reading_accuracy", "target": 95}', 30),
('Story Explorer', 'Complete 10 different stories', '🗺️', '{"type": "stories_completed", "target": 10}', 100),
('Reading Marathon', 'Read for 60 minutes total', '🏃', '{"type": "reading_time", "target": 3600}', 75);

-- Insert sample stories
INSERT INTO public.stories (title, content, reading_level, word_count, estimated_reading_time, themes, is_generated) VALUES
('The Magic Garden', 'Luna found a special garden behind her house. The flowers could talk! "Hello, Luna!" said a bright red rose. "We have been waiting for you." Luna was amazed. She spent the afternoon learning about each flower and their magical powers. The sunflowers could make people happy, and the daisies could grant small wishes. Luna made a wish to visit the garden every day.', 'beginner', 67, 3, ARRAY['fantasy', 'friendship', 'nature'], false),

('Space Adventure', 'Captain Zoe received an urgent message from Mars. "Help! Our water supply is running low!" She quickly prepared her spaceship and blasted off into space. The journey took three days, but Zoe was determined to help. When she arrived on Mars, she met the friendly Martians who showed her their beautiful red cities. Together, they found a new source of water underground and saved the planet.', 'intermediate', 89, 4, ARRAY['adventure', 'space', 'helping others'], false),

('The Friendly Dragon', 'In a peaceful valley lived Spark, a young dragon who was different from others. While other dragons breathed fire, Spark breathed colorful bubbles that made everyone smile. At first, Spark felt sad about being different. But when the village children saw his beautiful bubbles, they cheered with joy. Spark realized that being different made him special, and he became the most beloved dragon in the valley.', 'beginner', 78, 4, ARRAY['friendship', 'self-acceptance', 'fantasy'], false);