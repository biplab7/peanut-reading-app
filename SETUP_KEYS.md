# API Keys Configuration Guide

## Required API Keys and Services

To fully configure Peanut Reading, you'll need to set up the following services and obtain API keys:

### 1. Supabase Setup
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings > API
4. Copy the following values:
   - `SUPABASE_URL`: Your project URL (e.g., https://xyz.supabase.co)
   - `SUPABASE_ANON_KEY`: Your anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service_role key (keep this secret!)

### 2. Google Cloud Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Speech-to-Text API
   - Text-to-Speech API
   - AI Platform API
4. Create a service account:
   - Go to IAM & Admin > Service Accounts
   - Create service account with Speech and AI Platform permissions
   - Download the JSON key file
5. Get Gemini AI API key:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create API key for Gemini

### 3. OpenAI Setup (for Whisper)
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create account and add payment method
3. Go to API Keys section
4. Create new secret key

## Environment Configuration

### Backend Environment (.env)
```env
# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=YOUR_SUPABASE_URL_HERE
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE

# Google Cloud Configuration
GOOGLE_APPLICATION_CREDENTIALS=./path/to/your/google-credentials.json
GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project-id

# Google AI (Gemini) Configuration
GOOGLE_AI_API_KEY=YOUR_GOOGLE_AI_API_KEY_HERE

# OpenAI Configuration (for Whisper)
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE

# Security
JWT_SECRET=your-random-jwt-secret-here
ENCRYPTION_KEY=your-32-char-encryption-key-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_AUDIO_FORMATS=audio/wav,audio/mp3,audio/m4a,audio/webm
```

### Mobile Environment (.env)
```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL_HERE
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE

# Backend API
EXPO_PUBLIC_API_URL=http://localhost:3001/api

# Google Services
EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY=YOUR_GOOGLE_CLOUD_API_KEY_HERE

# Development
EXPO_PUBLIC_ENV=development
```

## Database Setup

1. Go to your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the SQL to create all tables and initial data

## Security Notes

- Never commit actual API keys to version control
- Use different keys for development and production
- Regularly rotate your API keys
- Monitor API usage to detect unusual activity
- Keep service account JSON files secure and never share them

## Testing Configuration

After setting up all keys:

1. Start the backend server:
   ```bash
   cd apps/backend
   npm run dev
   ```

2. Test the health endpoint:
   ```bash
   curl http://localhost:3001/health
   ```

3. Start the mobile app:
   ```bash
   cd apps/mobile
   npm run dev
   ```

4. Test speech recognition and story generation features

## Troubleshooting

- **Google Cloud errors**: Ensure all APIs are enabled and service account has proper permissions
- **Supabase connection errors**: Check URL format and key validity
- **OpenAI errors**: Verify API key and account has sufficient credits
- **CORS errors**: Ensure FRONTEND_URL matches your development server URL

## Cost Optimization

- Google Speech-to-Text: ~$0.006 per 15 seconds
- Google Text-to-Speech: ~$4 per 1M characters
- OpenAI Whisper: ~$0.006 per minute
- Gemini AI: Free tier available, then pay-per-use

Consider implementing caching and rate limiting to manage costs.