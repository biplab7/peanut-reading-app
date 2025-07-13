# 🚀 Deployment Guide: Render + Vercel

## ✅ **All Configuration Ready!**

Your Peanut Reading app is now configured for deployment to both platforms:

- **Backend**: Render (Node.js API)
- **Frontend**: Vercel (Next.js Web App)

## 🎯 **What's Been Set Up**

### ✅ **Web Frontend Created**
- Complete Next.js web application
- Beautiful landing page with Tailwind CSS
- Responsive design optimized for web
- Environment configuration for production

### ✅ **Backend Configured for Render**
- Production environment variables
- Google Cloud credentials handling
- CORS configuration for Vercel
- Render deployment file (`render.yaml`)

### ✅ **Frontend Configured for Vercel**
- Vercel deployment configuration
- Environment variables setup
- API proxy configuration
- Security headers

## 📋 **Step-by-Step Deployment**

### 1. Deploy Backend to Render

1. **Push code to GitHub** (if not already done)
2. **Go to Render Dashboard**: https://render.com
3. **Create New Web Service**
   - Connect your GitHub repository
   - Select `apps/backend` as root directory
   - Use these settings:
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Environment**: Node.js

4. **Set Environment Variables** in Render:
   ```
   NODE_ENV=production
   PORT=10000
   SUPABASE_URL=https://dxlrhjiwzaungjppdjij.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4bHJoaml3emF1bmdqcHBkamlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NDczOTUsImV4cCI6MjA2NzMyMzM5NX0.iLI7CqVgVsCDLzGjD3jZpdzAujVO1WC2Hbb3PNopHNA
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4bHJoaml3emF1bmdqcHBkamlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc0NzM5NSwiZXhwIjoyMDY3MzIzMzk1fQ.RdU9YCPBRGTbPj7qGhQLYK6p-FHGl8CkRMVyT_w_fJE
   GOOGLE_AI_API_KEY=AIzaSyCV24gBMbvcCCze5QGdZPjuEaMtQTikCLQ
   GOOGLE_CLOUD_PROJECT_ID=ai-reading-companion-465021
   OPENAI_API_KEY=your_openai_api_key_here
   JWT_SECRET=43ec1d6383b5191dc22fceec32894da9f3a873358fb10ef59542d58eb98211e0
   ENCRYPTION_KEY=d87b8faa3a3d5e53850a3bb248758969ffc4ed9a50f0c42d1556021327ede152
   ```

5. **Add Google Cloud Credentials** as JSON:
   ```
   GOOGLE_APPLICATION_CREDENTIALS_JSON=your_google_service_account_json_here
   ```
   Note: Copy the entire JSON content from your Google Cloud service account file

6. **Deploy** and note your Render URL (e.g., `https://your-app.onrender.com`)

### 2. Deploy Frontend to Vercel

1. **Go to Vercel Dashboard**: https://vercel.com
2. **Import Project** from GitHub
3. **Configure Project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

4. **Set Environment Variables** in Vercel:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://dxlrhjiwzaungjppdjij.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4bHJoaml3emF1bmdqcHBkamlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NDczOTUsImV4cCI6MjA2NzMyMzM5NX0.iLI7CqVgVsCDLzGjD3jZpdzAujVO1WC2Hbb3PNopHNA
   NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com/api
   ```

5. **Update Backend CORS**: After deployment, update the CORS configuration in your backend with your actual Vercel URL

### 3. Update URLs

After both deployments:

1. **Update backend CORS** in `apps/backend/src/index.ts`:
   ```javascript
   'https://your-actual-vercel-app.vercel.app'
   ```

2. **Update Vercel API proxy** in `apps/web/vercel.json`:
   ```json
   "destination": "https://your-actual-render-app.onrender.com/api/:path*"
   ```

3. **Update production environment** in `apps/web/.env.production`:
   ```
   NEXT_PUBLIC_API_URL=https://your-actual-render-app.onrender.com/api
   ```

## 🧪 **Testing Deployment**

### Test Backend
```bash
curl https://your-render-app.onrender.com/health
```

### Test Frontend
Visit your Vercel URL and check:
- Page loads correctly
- API calls work (check browser console)
- All features function properly

### Test Integration
```bash
# Test story generation through frontend
curl -X POST https://your-vercel-app.vercel.app/api/stories/generate \
  -H "Content-Type: application/json" \
  -d '{"childId":"test","readingLevel":"beginner","interests":["animals"]}'
```

## ⚠️ **Important Notes**

1. **Free Tier Limitations**:
   - Render: 512MB RAM, sleeps after 15 min inactivity
   - Vercel: 100GB bandwidth, 1000 deployments/month

2. **Environment Variables**: Never commit real API keys to GitHub

3. **Domain Updates**: Update all hardcoded URLs after deployment

4. **Database**: Ensure Supabase schema is deployed before testing

## 🎉 **Ready to Deploy!**

Your Peanut Reading app is now fully configured for production deployment on both Render and Vercel!