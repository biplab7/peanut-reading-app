# Google Cloud Service Account Setup

## 🔧 Required for Google Speech Services

The Google Speech-to-Text and Text-to-Speech APIs require a service account with proper authentication. Here's how to set it up:

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Create a new project** or select existing one
3. **Note your Project ID** (you'll need this)

## Step 2: Enable Required APIs

1. Go to **APIs & Services > Library**
2. Enable these APIs:
   - **Cloud Speech-to-Text API**
   - **Cloud Text-to-Speech API**
   - **Cloud Translation API** (optional)

## Step 3: Create Service Account

1. Go to **IAM & Admin > Service Accounts**
2. Click **"Create Service Account"**
3. Fill in details:
   - **Name**: `peanut-reading-service`
   - **Description**: `Service account for Peanut Reading app`
4. Click **"Create and Continue"**

## Step 4: Grant Permissions

Add these roles to your service account:
- **Cloud Speech Service Agent**
- **Cloud Text-to-Speech Service Agent**
- **AI Platform Developer** (for enhanced features)

## Step 5: Generate Key

1. Click on your newly created service account
2. Go to **"Keys"** tab
3. Click **"Add Key" > "Create new key"**
4. Choose **JSON** format
5. Download the JSON file

## Step 6: Configure the App

1. **Rename the downloaded file** to `google-credentials.json`
2. **Move it to**: `/Users/biplabmazumder/Documents/Peanut-Reading/apps/backend/google-credentials.json`
3. **Update the project ID** in your `.env` file

## Alternative: Use API Key Only (Simpler Setup)

If you prefer a simpler setup without service account, you can modify the services to use API keys only:

### Option A: API Key Authentication

1. Go to **APIs & Services > Credentials**
2. Click **"Create Credentials" > "API Key"**
3. Copy the API key
4. Restrict the key to Speech APIs only (recommended)

### Option B: I can modify the code

I can update the Google Speech services to use your existing API key instead of service account authentication. This would be simpler but slightly less secure.

## Current Status

- ✅ Google AI (Gemini) API: Working with API key
- ⚠️ Google Speech APIs: Need service account OR code modification
- ✅ OpenAI Whisper: Working with API key
- ✅ Supabase: Working

## Quick Test After Setup

After setting up the service account, test with:

```bash
cd apps/backend
node -e "
const speech = require('@google-cloud/speech');
const client = new speech.SpeechClient();
console.log('Google Speech client initialized successfully!');
"
```

## Would you prefer:

1. **Set up the full service account** (more secure, follows Google best practices)
2. **Modify the code to use API key only** (simpler, but less secure)
3. **Skip Google Speech for now** and use only OpenAI Whisper

Let me know which approach you'd like to take!