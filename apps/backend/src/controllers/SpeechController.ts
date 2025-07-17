import { Request, Response } from 'express';
import { GoogleSpeechService } from '../services/googleSpeech';
import { WhisperService } from '../services/whisperService';
import { createError } from '../middleware/errorHandler';

export class SpeechController {
  private googleSpeech: GoogleSpeechService;
  private whisperService: WhisperService;

  constructor() {
    try {
      this.googleSpeech = new GoogleSpeechService();
    } catch (error) {
      console.warn('GoogleSpeechService initialization failed:', error);
      this.googleSpeech = null as any;
    }
    
    try {
      this.whisperService = new WhisperService();
    } catch (error) {
      console.warn('WhisperService initialization failed:', error);
      this.whisperService = null as any;
    }
    
    // Bind methods to ensure 'this' context
    this.recognizeSpeech = this.recognizeSpeech.bind(this);
    this.analyzeSpeech = this.analyzeSpeech.bind(this);
    this.generateFeedback = this.generateFeedback.bind(this);
    this.synthesizeText = this.synthesizeText.bind(this);
  }

  async recognizeSpeech(req: Request, res: Response) {
    try {
      if (!req.file) {
        throw createError('No audio file provided', 400);
      }

      const { childId, expectedText, service = 'google' } = req.body;
      const audioBuffer = req.file.buffer;

      let result;

      if (service === 'whisper') {
        if (expectedText) {
          // Use Whisper with child-specific analysis
          const childAge = parseInt(req.body.childAge) || 8;
          result = await this.whisperService.analyzeChildSpeech(audioBuffer, expectedText, {
            childAge,
            language: req.body.language || 'en',
          });
        } else {
          // Simple transcription
          result = await this.whisperService.transcribeAudio(audioBuffer, {
            language: req.body.language || 'en',
          });
        }
      } else {
        // Use Google Speech-to-Text
        console.log('🔍 Using Google Speech service for:', service);
        console.log('📋 Request details:', {
          hasAudioBuffer: !!audioBuffer,
          audioSize: audioBuffer?.length,
          expectedText: expectedText,
          languageCode: req.body.language || 'en-US',
          hasGoogleSpeechService: !!this.googleSpeech
        });
        
        if (!this.googleSpeech) {
          throw createError('Google Speech service not initialized. Check Google Cloud credentials configuration.', 503);
        }
        
        if (expectedText) {
          console.log('🎯 Running pronunciation analysis...');
          result = await this.googleSpeech.analyzePronunciation(audioBuffer, expectedText, {
            languageCode: req.body.language || 'en-US',
          });
        } else {
          console.log('🎯 Running speech recognition...');
          result = await this.googleSpeech.recognizeSpeech(audioBuffer, {
            languageCode: req.body.language || 'en-US',
            sampleRateHertz: parseInt(req.body.sampleRate) || 16000,
          });
        }
        console.log('✅ Google Speech processing completed:', { 
          hasResult: !!result,
          resultType: expectedText ? 'pronunciation_analysis' : 'speech_recognition'
        });
      }

      res.json({
        success: true,
        data: result,
        service: service,
      });
    } catch (error) {
      console.error('❌ Speech recognition error:', error);
      console.error('🔍 Error details:', {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        service: req.body.service || 'google',
        hasGoogleSpeech: !!this.googleSpeech,
        hasWhisperService: !!this.whisperService
      });
      
      const statusCode = (error as any).statusCode || 500;
      const errorMessage = error instanceof Error ? error.message : 'Speech recognition failed';
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        debug: {
          service: req.body.service || 'google',
          timestamp: new Date().toISOString(),
          hasRequiredService: req.body.service === 'whisper' ? !!this.whisperService : !!this.googleSpeech
        }
      });
    }
  }

  async analyzeSpeech(req: Request, res: Response) {
    try {
      const { transcript, expectedText, childAge = 8 } = req.body;

      if (!transcript || !expectedText) {
        throw createError('Transcript and expected text are required', 400);
      }

      // Analyze reading accuracy
      const analysis = this.analyzeReadingAccuracy(transcript, expectedText);
      
      // Generate child-friendly feedback using WhisperService
      const feedback = this.whisperService.generateChildFeedback(analysis, childAge);

      res.json({
        success: true,
        data: {
          analysis,
          feedback,
        },
      });
    } catch (error) {
      console.error('Speech analysis error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Speech analysis failed',
      });
    }
  }

  async generateFeedback(req: Request, res: Response) {
    try {
      const {
        childName,
        accuracy,
        wordsPerMinute,
        mistakes,
        readingTime,
        storyTitle,
      } = req.body;

      const feedback = {
        overallScore: Math.round((accuracy + Math.min(100, wordsPerMinute)) / 2),
        accuracy,
        speed: wordsPerMinute,
        message: this.generateEncouragingMessage(accuracy, mistakes?.length || 0),
        suggestions: this.generateSuggestions(accuracy, wordsPerMinute, mistakes),
        achievements: this.checkAchievements(accuracy, wordsPerMinute, readingTime),
      };

      res.json({
        success: true,
        data: feedback,
      });
    } catch (error) {
      console.error('Feedback generation error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Feedback generation failed',
      });
    }
  }

  async synthesizeText(req: Request, res: Response) {
    try {
      const { text, voice = 'child-friendly', language = 'en-US' } = req.body;

      if (!text) {
        throw createError('Text is required for synthesis', 400);
      }

      const voiceOptions = this.getVoiceOptions(voice);
      
      const result = await this.googleSpeech.synthesizeText(text, {
        languageCode: language,
        ...voiceOptions,
      });

      res.set({
        'Content-Type': `audio/${result.audioEncoding.toLowerCase()}`,
        'Content-Length': result.audioContent.length.toString(),
      });

      res.send(result.audioContent);
    } catch (error) {
      console.error('Text synthesis error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Text synthesis failed',
      });
    }
  }

  private analyzeReadingAccuracy(transcript: string, expectedText: string) {
    const normalizeText = (text: string) => 
      text.toLowerCase().replace(/[^\w\s]/g, '').trim();

    const expectedWords = normalizeText(expectedText).split(/\s+/);
    const actualWords = normalizeText(transcript).split(/\s+/);

    let correctWords = 0;
    const mistakes = [];

    for (let i = 0; i < expectedWords.length; i++) {
      const expected = expectedWords[i];
      const actual = actualWords[i] || '';
      
      if (expected === actual) {
        correctWords++;
      } else {
        mistakes.push({
          position: i,
          expected,
          actual,
        });
      }
    }

    const accuracy = expectedWords.length > 0 ? (correctWords / expectedWords.length) * 100 : 0;

    return {
      accuracy,
      totalWords: expectedWords.length,
      correctWords,
      mistakes,
      wordsRecognized: actualWords.length,
    };
  }

  private generateEncouragingMessage(accuracy: number, mistakeCount: number): string {
    if (accuracy >= 95) {
      return "Fantastic reading! You're doing amazing! 🌟";
    } else if (accuracy >= 85) {
      return "Great job! You're reading really well! 📚";
    } else if (accuracy >= 70) {
      return "Good work! Keep practicing and you'll get even better! 💪";
    } else {
      return "Nice try! Reading takes practice. You're getting better! 🎯";
    }
  }

  private generateSuggestions(accuracy: number, wpm: number, mistakes: any[] = []) {
    const suggestions = [];

    if (accuracy < 85) {
      suggestions.push("Try reading more slowly and carefully");
      suggestions.push("Sound out each word");
    }

    if (wpm < 50) {
      suggestions.push("Practice reading common words quickly");
    } else if (wpm > 150) {
      suggestions.push("Try reading a bit slower for better accuracy");
    }

    if (mistakes && mistakes.length > 0) {
      const commonMistakes = mistakes.slice(0, 3).map(m => m.expected);
      suggestions.push(`Practice these words: ${commonMistakes.join(', ')}`);
    }

    if (suggestions.length === 0) {
      suggestions.push("Keep up the excellent reading!");
    }

    return suggestions;
  }

  private checkAchievements(accuracy: number, wpm: number, readingTime: number) {
    const achievements = [];

    if (accuracy >= 95) {
      achievements.push({
        name: "Accuracy Master",
        description: "Read with 95% accuracy!",
        icon: "🎯",
      });
    }

    if (wpm >= 100) {
      achievements.push({
        name: "Speed Reader",
        description: "Read 100+ words per minute!",
        icon: "⚡",
      });
    }

    if (readingTime >= 300) { // 5 minutes
      achievements.push({
        name: "Reading Endurance",
        description: "Read for 5+ minutes!",
        icon: "🏃‍♂️",
      });
    }

    return achievements;
  }

  private getVoiceOptions(voiceType: string) {
    switch (voiceType) {
      case 'child-friendly':
        return {
          voiceName: 'en-US-Journey-F',
          gender: 'FEMALE' as const,
          speakingRate: 0.9,
          pitch: 2.0,
        };
      case 'storyteller':
        return {
          voiceName: 'en-US-Studio-O',
          gender: 'NEUTRAL' as const,
          speakingRate: 0.8,
          pitch: 1.0,
        };
      default:
        return {
          voiceName: 'en-US-Journey-F',
          gender: 'FEMALE' as const,
          speakingRate: 0.9,
          pitch: 1.5,
        };
    }
  }
}