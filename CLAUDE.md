# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Peanut Reading is an AI-powered reading companion for children that helps improve reading skills through personalized story generation, speech recognition, and interactive learning. The application is a monorepo containing mobile, backend, and web applications.

## Development Commands

### Root Level Commands
- `npm install` - Install all dependencies for all workspaces
- `npm run dev` - Start all development servers (backend + mobile)
- `npm run dev:backend` - Start backend API server only
- `npm run dev:mobile` - Start mobile app with Expo only
- `npm run dev:web` - Start web app with Next.js only
- `npm run build` - Build all applications
- `npm run test` - Run tests across all workspaces
- `npm run lint` - Run linting across all workspaces
- `npm run clean` - Clean all node_modules and build artifacts

### Backend Commands (apps/backend)
- `npm run dev` - Start development server with nodemon
- `npm run build` - Compile TypeScript to dist/
- `npm run start` - Run production server from dist/
- `npm run test` - Run Jest tests
- `npm run lint` - Run ESLint on TypeScript files

### Mobile Commands (apps/mobile)
- `npm run start` / `npm run dev` - Start Expo development server
- `npm run ios` - Start iOS simulator
- `npm run android` - Start Android emulator
- `npm run web` - Start web version
- `npm run test` - Run Jest tests with --watchAll
- `npm run lint` - Run Expo linting

### Web Commands (apps/web)
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run Next.js linting

## Architecture Overview

### Monorepo Structure
```
apps/
├── backend/     - Node.js Express API server
├── mobile/      - React Native Expo app
└── web/         - Next.js web application
packages/        - Shared packages (currently empty)
supabase/        - Database schema and migrations
```

### Backend Architecture (apps/backend)
- **Framework**: Express.js with TypeScript
- **Structure**: Controllers → Services → Database pattern
- **Key Services**:
  - `GeminiService` - AI story generation using Google Gemini
  - `GoogleSpeech` - Speech-to-text conversion
  - `WhisperService` - Alternative speech processing with OpenAI
  - `supabaseService` - Database operations
- **Routes**: `/api/auth`, `/api/speech`, `/api/stories`, `/api/users`, `/api/progress`
- **Middleware**: Error handling, CORS, security (helmet), compression
- **Entry Point**: `src/index.ts`

### Frontend Architecture
- **Mobile**: React Native with Expo Router for navigation
- **Web**: Next.js 14 with App Router
- **Shared Dependencies**: Supabase client, TypeScript, React 18.3.1

### Database (Supabase)
- **Authentication**: Supabase Auth with Google OAuth
- **Main Tables**: 
  - `profiles` - User accounts
  - `child_profiles` - Child reading profiles  
  - `stories` - Story content and metadata
  - `reading_sessions` - Reading activity tracking
  - `achievements` - Gamification system
  - `story_favorites` - User story preferences
- **Security**: Row Level Security (RLS) policies implemented
- **Schema Location**: `supabase/schema.sql`

## Environment Setup

### Required Environment Variables

#### Backend (.env)
```
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_APPLICATION_CREDENTIALS=path/to/google-credentials.json
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_AI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_jwt_secret
```

#### Mobile (.env)
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

### Service Dependencies
1. **Supabase** - Database, authentication, real-time subscriptions
2. **Google Cloud** - Speech-to-Text, Text-to-Speech APIs
3. **Google AI (Gemini)** - Story generation and content safety validation
4. **OpenAI** - Whisper API for speech recognition fallback

## Key Technical Patterns

### Story Generation Flow
1. User provides reading level, interests, themes
2. `GeminiService.generateStory()` creates age-appropriate content
3. Content safety validation using Gemini's built-in safety features
4. Stories stored in database with metadata for personalization

### Authentication Flow
- Supabase Auth handles user registration/login
- RLS policies secure data access based on user roles (parent/child)
- JWT tokens manage session state

### Reading Session Tracking
- Real-time speech recognition during reading
- Progress metrics stored as JSONB in database
- AI-generated feedback using child's performance data

## Testing and Quality

### Test Commands
- Backend: `npm run test --workspace=apps/backend`
- Mobile: `npm run test --workspace=apps/mobile` 
- Web: `npm run test --workspace=apps/web`

### Linting
- ESLint configured for TypeScript across all apps
- Prettier for code formatting
- Expo-specific linting rules for mobile app

## Deployment

### Backend
- **Platform**: Render
- **Config**: `apps/backend/render.yaml`
- **Build**: `npm run build` → serves from `dist/`

### Mobile  
- **Platform**: Expo Application Services (EAS)
- **Command**: `eas build --platform all`

### Web
- **Platform**: Vercel  
- **Config**: `apps/web/vercel.json`
- **Auto-deploy**: Connected to GitHub main branch

## Development Notes

### CORS Configuration
Backend allows requests from:
- `http://localhost:3000` (web dev)
- `http://localhost:3001` (backend dev)
- `https://peanut-reading.vercel.app` (production web)
- Mobile apps (no origin header)

### Database Schema
The complete database schema is in `supabase/schema.sql` with sample data included. RLS policies ensure data isolation between families.

### AI Safety
Content generated by Gemini includes multiple safety checks:
- Built-in Gemini safety settings for child-appropriate content
- Additional content validation step before storage
- Configurable content filtering levels for parents