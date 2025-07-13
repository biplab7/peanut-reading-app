import OpenAI from 'openai';
import { createError } from '../middleware/errorHandler';

export class WhisperService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    this.openai = new OpenAI({
      apiKey,
    });
  }

  async transcribeAudio(audioBuffer: Buffer, options: {
    language?: string;
    prompt?: string;
    temperature?: number;
    response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  } = {}) {
    try {
      const {
        language = 'en',
        prompt = 'This is a child reading a story aloud. Please transcribe accurately with proper punctuation.',
        temperature = 0.2, // Lower temperature for more consistent results
        response_format = 'verbose_json',
      } = options;

      // Create a temporary file-like object for the API
      const audioFile = new File([audioBuffer], 'audio.webm', {
        type: 'audio/webm',
      });

      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language,
        prompt,
        temperature,
        response_format,
      });

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
      console.error('Whisper transcription error:', error);
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

  private generateChildFeedback(analysis: any, childAge: number) {
    const { accuracy, wordsPerMinute, fluencyScore, mistakes } = analysis;
    
    const feedback = {
      overallScore: Math.round((accuracy + fluencyScore) / 2),
      strengths: [],
      improvements: [],
      encouragement: '',
      suggestions: [],
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