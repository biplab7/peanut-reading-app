import OpenAI from 'openai';
import { createError } from '../middleware/errorHandler';

export class WhisperService {
  private openai?: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    console.log('🔍 WhisperService initialization debug:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPrefix: apiKey ? `${apiKey.substring(0, 7)}...` : 'none',
      nodeEnv: process.env.NODE_ENV
    });
    
    if (!apiKey) {
      console.warn('❌ OpenAI API key not configured - WhisperService will be disabled');
      return;
    }

    try {
      this.openai = new OpenAI({
        apiKey,
        timeout: 30000, // 30 second timeout
        maxRetries: 2,
      });
      console.log('✅ WhisperService OpenAI client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI client:', error);
      throw error;
    }
  }

  async transcribeAudio(audioBuffer: Buffer, options: {
    language?: string;
    prompt?: string;
    temperature?: number;
    response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  } = {}) {
    console.log('🎤 WhisperService.transcribeAudio started');
    console.log('🔍 Transcription request details:', {
      hasOpenAI: !!this.openai,
      audioBufferSize: audioBuffer.length,
      audioSizeKB: Math.round(audioBuffer.length / 1024),
      options
    });
    
    if (!this.openai) {
      console.error('❌ WhisperService not initialized - missing OpenAI API key');
      throw createError('WhisperService not initialized - missing OpenAI API key', 503);
    }
    
    try {
      const {
        language = 'en',
        prompt = 'This is a child reading a story aloud. Please transcribe accurately with proper punctuation.',
        temperature = 0.2, // Lower temperature for more consistent results
        response_format = 'verbose_json',
      } = options;

      console.log('📁 Creating audio file object...');
      
      // Detect audio format and use appropriate filename/type
      let audioFileName = 'audio.webm';
      let audioMimeType = 'audio/webm';
      
      // Check file header to determine actual format
      const headerBytes = Array.from(audioBuffer.slice(0, 12)).map(b => b.toString(16).padStart(2, '0')).join(' ');
      console.log('🔍 Audio header analysis:', { 
        firstBytes: headerBytes,
        bufferSize: audioBuffer.length 
      });
      
      if (audioBuffer.slice(0, 4).toString() === 'RIFF') {
        audioFileName = 'audio.wav';
        audioMimeType = 'audio/wav';
        console.log('🎵 Detected WAV format');
      } else if (audioBuffer.slice(4, 8).toString() === 'ftyp') {
        audioFileName = 'audio.m4a';
        audioMimeType = 'audio/mp4';
        console.log('🎵 Detected MP4/M4A format');
      } else if (audioBuffer.slice(0, 4).toString('hex') === '1a45dfa3') {
        audioFileName = 'audio.webm';
        audioMimeType = 'audio/webm';
        console.log('🎵 Detected WebM format - may cause connection issues');
        
        // For WebM, try using generic audio type which OpenAI handles better
        audioMimeType = 'audio/ogg';
        audioFileName = 'audio.ogg';
        console.log('🔄 Converting WebM to OGG mime type for better compatibility');
      } else {
        console.log('🎵 Unknown format, defaulting to WebM');
      }
      
      // Create a temporary file-like object for the API
      const audioFile = new File([audioBuffer], audioFileName, {
        type: audioMimeType,
      });
      console.log('✅ Audio file object created:', { 
        name: audioFile.name, 
        type: audioFile.type, 
        size: audioFile.size,
        detectedFormat: audioMimeType
      });

      console.log('🌐 Making OpenAI Whisper API call...');
      const requestStart = Date.now();
      
      // Retry mechanism for connection issues
      let transcription;
      let lastError;
      const maxRetries = 2;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 Whisper API attempt ${attempt}/${maxRetries}`);
          
          transcription = await this.openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            language,
            prompt,
            temperature,
            response_format,
          });
          
          const requestEnd = Date.now();
          console.log(`✅ Whisper API call completed in ${requestEnd - requestStart}ms on attempt ${attempt}`);
          console.log('📝 Transcription response type:', typeof transcription);
          console.log('📝 Transcription response keys:', Object.keys(transcription || {}));
          break; // Success, exit retry loop
          
        } catch (retryError) {
          lastError = retryError;
          console.warn(`⚠️ Whisper API attempt ${attempt} failed:`, (retryError as any)?.message);
          
          if (attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s
            console.log(`⏳ Waiting ${waitTime}ms before retry ${attempt + 1}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      // If all retries failed, throw the last error
      if (!transcription) {
        console.error(`❌ All ${maxRetries} Whisper API attempts failed`);
        throw lastError;
      }

      // Handle different response formats
      if (response_format === 'verbose_json' && typeof transcription === 'object') {
        const verboseResult = transcription as any;
        return {
          transcript: verboseResult.text || '',
          confidence: this.calculateAverageConfidence(verboseResult.segments || []),
          segments: verboseResult.segments?.map((segment: any) => ({
            id: segment.id,
            start: segment.start,
            end: segment.end,
            text: segment.text,
            confidence: this.calculateAverageConfidence(segment.words || []),
            words: segment.words?.map((word: any) => ({
              word: word.word,
              start: word.start,
              end: word.end,
              confidence: word.probability || 0,
            })) || [],
          })) || [],
          language: verboseResult.language || language,
        };
      } else {
        // Simple text response
        return {
          transcript: typeof transcription === 'string' ? transcription : transcription.text || '',
          confidence: 0.8, // Default confidence for simple responses
          segments: [],
          language,
        };
      }
    } catch (error) {
      console.error('❌ Whisper transcription error:');
      console.error('🔍 Error details:', {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorCode: (error as any)?.code,
        errorStatus: (error as any)?.status,
        errorCause: (error as any)?.cause,
        errorStack: error instanceof Error ? error.stack : undefined
      });
      
      // Check for specific connection issues
      if (error instanceof Error) {
        if (error.message.includes('ECONNRESET')) {
          console.error('🌐 Connection reset by OpenAI server - likely audio format compatibility issue');
          console.error('💡 Suggestion: WebM format may not be fully supported by OpenAI Whisper');
        } else if (error.message.includes('ENOTFOUND')) {
          console.error('🌐 DNS resolution failed - possible network connectivity issue');
        } else if (error.message.includes('timeout')) {
          console.error('⏰ Request timeout - OpenAI API took too long to respond');
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          console.error('🔑 Authentication failed - check OpenAI API key');
        } else if (error.message.includes('429')) {
          console.error('🚫 Rate limit exceeded - too many requests to OpenAI API');
        } else if (error.message.includes('413') || error.message.includes('too large')) {
          console.error('📦 File too large - audio file exceeds OpenAI size limits');
        } else if (error.message.includes('unsupported') || error.message.includes('format')) {
          console.error('🎵 Unsupported audio format - try WAV or MP3 instead');
        }
      }
      
      throw createError('Whisper transcription failed', 500);
    }
  }

  async analyzeChildSpeech(audioBuffer: Buffer, expectedText: string, options: {
    language?: string;
    childAge?: number;
  } = {}) {
    try {
      const { language = 'en', childAge = 8 } = options;

      // Create a child-specific prompt
      const prompt = `This is a ${childAge}-year-old child reading the following text: "${expectedText}". Please transcribe accurately, considering typical child speech patterns and mispronunciations.`;

      const result = await this.transcribeAudio(audioBuffer, {
        language,
        prompt,
        response_format: 'verbose_json',
        temperature: 0.1, // Very low temperature for consistent child speech recognition
      });

      // Analyze the transcription against expected text
      const analysis = this.analyzeReadingAccuracy(expectedText, result.transcript, result.segments);

      return {
        transcription: result,
        analysis,
        feedback: this.generateChildFeedback(analysis, childAge),
      };
    } catch (error) {
      console.error('Child speech analysis error:', error);
      throw createError('Child speech analysis failed', 500);
    }
  }

  private calculateAverageConfidence(items: any[]): number {
    if (!items || items.length === 0) return 0.8; // Default confidence
    
    const total = items.reduce((sum, item) => {
      return sum + (item.probability || item.confidence || 0.8);
    }, 0);
    
    return total / items.length;
  }

  private analyzeReadingAccuracy(expectedText: string, actualText: string, segments: any[] = []) {
    // Normalize texts for comparison
    const normalizeText = (text: string) => 
      text.toLowerCase()
          .replace(/[^\w\s]/g, '') // Remove punctuation
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();

    const expectedWords = normalizeText(expectedText).split(' ');
    const actualWords = normalizeText(actualText).split(' ');

    // Calculate word-level accuracy
    const wordResults = [];
    let correctWords = 0;
    const mistakes = [];

    const maxLength = Math.max(expectedWords.length, actualWords.length);
    
    for (let i = 0; i < maxLength; i++) {
      const expectedWord = expectedWords[i] || '';
      const actualWord = actualWords[i] || '';
      
      const isCorrect = expectedWord === actualWord;
      if (isCorrect && expectedWord) {
        correctWords++;
      } else if (expectedWord || actualWord) {
        mistakes.push({
          position: i,
          expected: expectedWord,
          actual: actualWord,
          type: !expectedWord ? 'extra' : !actualWord ? 'missing' : 'substitution',
        });
      }

      if (expectedWord) {
        wordResults.push({
          expected: expectedWord,
          actual: actualWord,
          correct: isCorrect,
          position: i,
        });
      }
    }

    // Calculate reading metrics
    const accuracy = expectedWords.length > 0 ? (correctWords / expectedWords.length) * 100 : 0;
    const totalTime = segments.length > 0 ? 
      Math.max(...segments.map(s => s.end)) - Math.min(...segments.map(s => s.start)) : 0;
    const wordsPerMinute = totalTime > 0 ? (actualWords.length / totalTime) * 60 : 0;

    return {
      accuracy,
      wordsPerMinute,
      totalWords: expectedWords.length,
      correctWords,
      mistakes,
      wordResults,
      readingTime: totalTime,
      fluencyScore: this.calculateFluencyScore(segments, mistakes.length),
    };
  }

  private calculateFluencyScore(segments: any[], mistakeCount: number): number {
    if (!segments || segments.length === 0) return 70; // Default score

    // Calculate average pause duration between words
    let totalPauses = 0;
    let pauseCount = 0;

    for (let i = 1; i < segments.length; i++) {
      const pause = segments[i].start - segments[i - 1].end;
      if (pause > 0.1) { // Only count pauses longer than 100ms
        totalPauses += pause;
        pauseCount++;
      }
    }

    const averagePause = pauseCount > 0 ? totalPauses / pauseCount : 0.3;
    
    // Score based on reading smoothness (fewer long pauses = higher score)
    let fluencyScore = 100 - (averagePause * 50); // Penalize long pauses
    fluencyScore -= mistakeCount * 5; // Penalize mistakes
    
    return Math.max(0, Math.min(100, fluencyScore));
  }

  public generateChildFeedback(analysis: any, childAge: number) {
    const { accuracy, wordsPerMinute, fluencyScore, mistakes } = analysis;
    
    const feedback = {
      overallScore: Math.round((accuracy + fluencyScore) / 2),
      strengths: [] as string[],
      improvements: [] as string[],
      encouragement: '',
      suggestions: [] as string[],
    };

    // Age-appropriate feedback
    if (accuracy >= 95) {
      feedback.strengths.push('Excellent word recognition!');
      feedback.encouragement = 'You are an amazing reader! 🌟';
    } else if (accuracy >= 85) {
      feedback.strengths.push('Great job reading most words correctly!');
      feedback.encouragement = 'You\'re doing really well! Keep it up! 📚';
    } else if (accuracy >= 70) {
      feedback.strengths.push('Good effort on your reading!');
      feedback.encouragement = 'You\'re getting better! Practice makes perfect! 💪';
      feedback.improvements.push('Try to read a little more slowly and carefully');
    } else {
      feedback.encouragement = 'Great job trying! Reading takes practice! 🎯';
      feedback.improvements.push('Let\'s practice these words together');
      feedback.improvements.push('Try reading word by word first');
    }

    // Fluency feedback
    if (fluencyScore >= 80) {
      feedback.strengths.push('Smooth and steady reading!');
    } else if (fluencyScore >= 60) {
      feedback.improvements.push('Try to read with fewer pauses');
    } else {
      feedback.improvements.push('Practice reading phrases together');
    }

    // Speed feedback (age-appropriate)
    const expectedWPM = childAge >= 10 ? 90 : childAge >= 8 ? 70 : 50;
    if (wordsPerMinute >= expectedWPM * 1.2) {
      feedback.strengths.push('Great reading speed!');
    } else if (wordsPerMinute < expectedWPM * 0.7) {
      feedback.suggestions.push('Try reading a little faster as you get comfortable');
    }

    // Specific mistake patterns
    if (mistakes.length > 0) {
      const mistakeTypes = mistakes.reduce((acc: any, mistake: any) => {
        acc[mistake.type] = (acc[mistake.type] || 0) + 1;
        return acc;
      }, {});

      if (mistakeTypes.substitution > 0) {
        feedback.suggestions.push('Sound out words carefully');
      }
      if (mistakeTypes.missing > 0) {
        feedback.suggestions.push('Make sure to read every word');
      }
      if (mistakeTypes.extra > 0) {
        feedback.suggestions.push('Follow along with your finger');
      }
    }

    return feedback;
  }
}