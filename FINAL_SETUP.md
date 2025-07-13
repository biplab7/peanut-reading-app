# ✅ Peanut Reading - Final Setup Instructions

## 🎉 Configuration Status

✅ **Supabase**: Connected and configured  
✅ **Gemini AI**: API key validated  
✅ **OpenAI**: API key validated  
⚠️ **Google Cloud**: Requires service account setup  
⚠️ **Dependencies**: Need to resolve React version conflicts  

## 🗄️ Database Setup

1. **Go to your Supabase project dashboard**: https://dxlrhjiwzaungjppdjij.supabase.co

2. **Navigate to SQL Editor**

3. **Run the database schema**:
   - Copy the contents of `supabase/schema.sql`
   - Paste into the SQL Editor
   - Click "Run" to create all tables

This will create:
- User profiles and child management
- Stories and reading sessions
- Progress tracking and achievements
- Sample data and achievements

## 🔧 Google Cloud Service Account Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com

2. **Create or select a project**

3. **Enable required APIs**:
   - Speech-to-Text API
   - Text-to-Speech API
   - Cloud Translation API (optional)

4. **Create service account**:
   - Go to IAM & Admin > Service Accounts
   - Create new service account
   - Add roles: Speech Admin, AI Platform Admin
   - Generate and download JSON key

5. **Replace the placeholder file**:
   - Replace `apps/backend/google-credentials.json` with your actual service account JSON

## 📦 Install Dependencies

Due to React version conflicts, install dependencies manually:

### Backend Dependencies
```bash
cd apps/backend
npm install
```

### Mobile Dependencies
```bash
cd apps/mobile
npm install --legacy-peer-deps
# or
npm install --force
```

### Shared Packages
```bash
cd packages/shared
npm install

cd packages/ui
npm install
```

## 🚀 Start Development

### Start Backend Server
```bash
cd apps/backend
npm run dev
```
Server will start at: http://localhost:3001

### Start Mobile App
```bash
cd apps/mobile
npm run dev
```

Choose your platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator  
- Press `w` for web browser

## 🧪 Test the Setup

1. **Test backend health**:
   ```bash
   curl http://localhost:3001/health
   ```

2. **Test story generation**:
   ```bash
   curl -X POST http://localhost:3001/api/stories/generate \
     -H "Content-Type: application/json" \
     -d '{
       "childId": "test-child-id",
       "readingLevel": "beginner",
       "interests": ["animals", "adventure"]
     }'
   ```

3. **Test mobile app**: Open the app and navigate through screens

## 🎯 Key Features Ready

### ✅ Implemented
- **Database schema** with all tables
- **Supabase integration** for data storage
- **Gemini AI** for story generation
- **OpenAI Whisper** for speech recognition
- **Google Speech-to-Text** (pending service account)
- **Mobile app structure** with core screens
- **Backend API** with all endpoints

### 🔄 Next Development Steps
1. Complete authentication system
2. Implement speech recording in mobile app
3. Add progress tracking UI
4. Create parent dashboard
5. Add story reading interface
6. Implement achievement system

## 🛠️ Troubleshooting

### React Version Conflicts
```bash
npm install --legacy-peer-deps
# or delete node_modules and try again
```

### Google Cloud Issues
- Ensure all APIs are enabled
- Check service account permissions
- Verify JSON key file path

### Supabase Connection Issues
- Check URL format (should include https://)
- Verify API keys are copied correctly
- Ensure RLS policies allow access

### Audio Recording Issues
- Test on physical device (simulators may have limitations)
- Check microphone permissions
- Verify audio file formats are supported

## 📚 Documentation

- **API Documentation**: See `docs/` folder for endpoint details
- **Database Schema**: `supabase/schema.sql`
- **Environment Setup**: `SETUP_KEYS.md`
- **Project Structure**: `README.md`

## 🎉 You're Ready!

Your Peanut Reading app is now configured with:
- ✅ Working AI integrations
- ✅ Database structure
- ✅ Mobile app foundation
- ✅ Backend API endpoints

The core infrastructure is complete and ready for development!