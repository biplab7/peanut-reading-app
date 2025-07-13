# Peanut Reading Setup Guide

## Prerequisites

- Node.js 18+ and npm 9+
- Expo CLI: `npm install -g @expo/cli`
- Git

## Initial Setup

1. **Clone and Install Dependencies**
```bash
cd /Users/biplabmazumder/Documents/Peanut-Reading
npm install
```

2. **Environment Configuration**

### Backend Environment (.env)
```bash
cd apps/backend
cp .env.example .env
# Edit .env with your actual values
```

### Mobile Environment (.env)
```bash
cd apps/mobile
cp .env.example .env
# Edit .env with your actual values
```

## Required Services Setup

### 1. Supabase Setup
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy URL and anon key to environment files
4. Run database migrations (see Database Setup below)

### 2. Google Cloud Setup
1. Create project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Speech-to-Text API and Text-to-Speech API
3. Create service account and download JSON key
4. Enable Gemini AI API and get API key

### 3. OpenAI Setup (for Whisper)
1. Create account at [openai.com](https://openai.com)
2. Generate API key
3. Add to environment variables

## Database Setup

Create the following tables in Supabase:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child', 'educator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Child profiles
CREATE TABLE public.child_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  reading_level TEXT NOT NULL CHECK (reading_level IN ('beginner', 'elementary', 'intermediate', 'advanced')),
  interests TEXT[] DEFAULT '{}',
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stories
CREATE TABLE public.stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  reading_level TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  estimated_reading_time INTEGER NOT NULL,
  themes TEXT[] DEFAULT '{}',
  is_generated BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading sessions
CREATE TABLE public.reading_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  progress JSONB NOT NULL DEFAULT '{}',
  feedback JSONB NOT NULL DEFAULT '{}'
);
```

## Running the Application

### Development Mode
```bash
# Start all services
npm run dev

# Or start individually
npm run dev:backend
npm run dev:mobile
```

### Mobile App
```bash
cd apps/mobile
npm run ios     # iOS simulator
npm run android # Android emulator
npm run web     # Web browser
```

## Testing

```bash
# Run all tests
npm run test

# Test specific app
npm run test --workspace=apps/backend
```

## Deployment

### Backend (Render)
1. Connect GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy automatically on push to main

### Mobile (Expo)
```bash
cd apps/mobile
eas build --platform all
```

### Web (Vercel)
1. Connect GitHub repository to Vercel
2. Set environment variables
3. Deploy automatically on push

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Run `npm install` in root directory
   - Check workspaces configuration

2. **Environment variable errors**
   - Verify all required env vars are set
   - Check .env file syntax

3. **Database connection errors**
   - Verify Supabase URL and keys
   - Check database table structure

4. **Audio recording issues**
   - Ensure microphone permissions
   - Check device audio settings
   - Verify audio format support

### Support

For additional help:
1. Check logs in development console
2. Review Expo diagnostics
3. Check Supabase dashboard for errors
4. Verify API service status