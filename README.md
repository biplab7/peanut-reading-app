# Peanut Reading - AI-Powered Reading Companion for Kids

An AI-powered mobile application designed to enhance children's reading experience through personalized story generation, speech recognition, and interactive learning features.

## Project Structure

This is a monorepo containing:

- **apps/mobile** - React Native Expo app for iOS/Android
- **apps/backend** - Node.js Express API server
- **apps/web** - Web version of the app
- **packages/shared** - Shared utilities and types
- **packages/ui** - Shared UI components

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Node.js with Express
- **Database**: Supabase
- **AI Services**: Google Speech-to-Text, Whisper API, Gemini AI
- **Authentication**: Supabase Auth with Google OAuth

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see apps/*/env.example files)

3. Start development servers:
```bash
npm run dev
```

## Development

- `npm run dev` - Start all development servers
- `npm run dev:mobile` - Start mobile app only
- `npm run dev:backend` - Start backend only
- `npm run dev:web` - Start web app only
- `npm run build` - Build all apps
- `npm run test` - Run all tests
- `npm run lint` - Lint all code

## Deployment

- **Frontend**: Vercel
- **Backend**: Render

See individual app README files for detailed setup instructions.