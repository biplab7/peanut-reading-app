import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

import { authRoutes } from './routes/auth';
import { speechRoutes } from './routes/speech';
import { storyRoutes } from './routes/story';
import { userRoutes } from './routes/user';
import { progressRoutes } from './routes/progress';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
// Configure CORS for both development and production
const corsOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://peanut-reading.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (corsOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Peanut Reading API',
    version: '1.1.0',
    features: ['word-family-stories', 'debug-logging'],
    commit: '0b21ef8'
  });
});

// Deployment verification endpoint
app.get('/api/debug/methods', (req, res) => {
  try {
    const { StoryController } = require('./controllers/StoryController');
    const controller = new StoryController();
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(controller));
    
    res.json({
      success: true,
      availableMethods: methods,
      hasWordFamilyMethod: methods.includes('generateWordFamilyStory'),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// Auth debug endpoint
app.get('/api/debug/auth', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    res.json({
      hasAuthHeader: !!authHeader,
      authHeaderFormat: authHeader ? authHeader.substring(0, 20) + '...' : null,
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      environment: process.env.NODE_ENV,
      supabaseUrl: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'NOT_SET',
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// Gemini debug endpoint
app.get('/api/debug/gemini', async (req, res) => {
  try {
    const { GeminiService } = require('./services/geminiService');
    
    const debugInfo: any = {
      hasGoogleAiApiKey: !!process.env.GOOGLE_AI_API_KEY,
      googleAiApiKeyFormat: process.env.GOOGLE_AI_API_KEY ? 
        process.env.GOOGLE_AI_API_KEY.substring(0, 10) + '...' : 'NOT_SET',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    try {
      const geminiService = new GeminiService();
      debugInfo.geminiServiceInitialized = true;
      
      // Test word family story generation
      const testResult = await geminiService.generateWordFamilyStory({
        wordFamily: 'at',
        examples: ['cat', 'hat', 'bat'],
        difficulty: 'beginner',
        theme: 'adventure'
      });
      
      debugInfo.testGenerationSuccessful = true;
      debugInfo.testStoryTitle = testResult.title;
      debugInfo.testStoryLength = testResult.content.length;
      
    } catch (geminiError) {
      debugInfo.geminiServiceInitialized = false;
      debugInfo.geminiError = geminiError instanceof Error ? geminiError.message : String(geminiError);
    }

    res.json(debugInfo);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/speech', speechRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/progress', progressRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Whisper debug endpoint  
app.get('/api/debug/whisper', async (req, res) => {
  try {
    const { WhisperService } = require('./services/whisperService');
    
    const debugInfo: any = {
      hasOpenAiApiKey: !!process.env.OPENAI_API_KEY,
      openAiApiKeyFormat: process.env.OPENAI_API_KEY ? 
        process.env.OPENAI_API_KEY.substring(0, 8) + '...' : 'NOT_SET',
      openAiApiKeyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    try {
      const whisperService = new WhisperService();
      debugInfo.whisperServiceInitialized = true;
    } catch (whisperError) {
      debugInfo.whisperServiceInitialized = false;
      debugInfo.whisperError = whisperError instanceof Error ? whisperError.message : String(whisperError);
    }

    res.json(debugInfo);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Peanut Reading API server running on port ${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log service configuration status
  console.log('🔍 Service Configuration Check:');
  console.log('  - Supabase URL:', process.env.SUPABASE_URL ? '✅ Configured' : '❌ Missing');
  console.log('  - Supabase Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configured' : '❌ Missing');
  console.log('  - Google AI API Key:', process.env.GOOGLE_AI_API_KEY ? '✅ Configured' : '❌ Missing');
  console.log('  - OpenAI API Key:', process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing');
  console.log('  - Google Cloud Project:', process.env.GOOGLE_CLOUD_PROJECT_ID ? '✅ Configured' : '❌ Missing');
  
  // Initialize services to trigger debug logging
  try {
    const { WhisperService } = require('./services/whisperService');
    new WhisperService();
  } catch (error) {
    console.log('⚠️ WhisperService initialization check failed:', error instanceof Error ? error.message : String(error));
  }
});