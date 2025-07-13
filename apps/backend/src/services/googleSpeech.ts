import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { createError } from '../middleware/errorHandler';

export class GoogleSpeechService {
  private speechClient: SpeechClient | null = null;
  private ttsClient: TextToSpeechClient | null = null;
  private isConfigured: boolean = false;

  constructor() {
    try {
      this.initializeClients();
    } catch (error) {
      console.warn('Google Cloud Speech service not configured:', error);
      console.warn('Speech recognition will be disabled');
    }
  }

  private initializeClients() {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    
    if (!projectId) {
      throw new Error('Google Cloud project ID not configured');
    }

    // Handle credentials for different environments
    let clientConfig: any = { projectId };

    if (process.env.NODE_ENV === 'production') {
      // In production (Render), use JSON from environment variable
      const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
      if (credentialsJson) {
        try {
          const credentials = JSON.parse(credentialsJson);
          clientConfig.credentials = credentials;
        } catch (error) {
          console.error('Failed to parse Google credentials JSON:', error);
          throw new Error('Invalid Google Cloud credentials JSON');
        }
      } else {
        throw new Error('Google Cloud credentials JSON not configured for production');
      }
    } else {
      // In development, use file path
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (credentialsPath) {
        clientConfig.keyFilename = credentialsPath;
      } else {
        throw new Error('Google Cloud credentials file not configured for development');
      }
    }

    this.speechClient = new SpeechClient(clientConfig);
    this.ttsClient = new TextToSpeechClient(clientConfig);
    this.isConfigured = true;
  }

  async recognizeSpeech(audioBuffer: Buffer, options: {
    sampleRateHertz?: number;
    languageCode?: string;
    enableWordTimeOffsets?: boolean;
    enableAutomaticPunctuation?: boolean;
  } = {}) {
    if (!this.isConfigured || !this.speechClient) {
      throw createError('Google Cloud Speech service not configured', 503);
    }

    try {
      const {
        sampleRateHertz = 16000,
        languageCode = 'en-US',
        enableWordTimeOffsets = true,
        enableAutomaticPunctuation = true,
      } = options;

      const request = {
        audio: {
          content: audioBuffer.toString('base64'),
        },
        config: {
          encoding: 'WEBM_OPUS' as const,
          sampleRateHertz,
          languageCode,
          enableWordTimeOffsets,
          enableAutomaticPunctuation,
          model: 'latest_long', // Better for children's speech
          useEnhanced: true,
          // Child-friendly speech recognition settings
          speechContexts: [{
            phrases: [
              'the', 'and', 'a', 'to', 'of', 'in', 'I', 'you', 'it', 'for', 'not', 'on', 'with', 'as', 'was', 'his', 'that', 'at', 'he', 'have', 'from', 'or', 'one', 'had', 'by', 'word', 'but', 'what', 'some', 'we', 'can', 'out', 'other', 'were', 'all', 'there', 'when', 'up', 'use', 'your', 'how', 'said', 'an', 'each', 'which', 'she', 'do', 'their', 'time', 'if', 'will', 'way', 'about', 'many', 'then', 'them', 'write', 'would', 'like', 'so', 'these', 'her', 'long', 'make', 'thing', 'see', 'him', 'two', 'more', 'go', 'no', 'man', 'first', 'been', 'call', 'who', 'its', 'now', 'find', 'may', 'down', 'side', 'my', 'very', 'me', 'get', 'here', 'could', 'came', 'made', 'only', 'over', 'new', 'sound', 'take', 'little', 'work', 'know', 'place', 'year', 'live', 'back', 'give', 'most', 'good', 'where', 'much', 'before', 'move', 'right', 'too', 'any', 'same', 'tell', 'boy', 'follow', 'want', 'show', 'around', 'great', 'think', 'help', 'line', 'turn', 'cause', 'come', 'every', 'should', 'thought', 'does', 'part', 'hear', 'because', 'play', 'still', 'try', 'ask', 'put', 'end', 'why', 'let', 'big', 'mean', 'say', 'set', 'keep', 'must', 'over', 'under', 'last', 'never', 'us', 'left', 'away', 'something', 'without', 'head', 'right', 'might', 'close', 'seem', 'hard', 'open', 'example', 'begin', 'life', 'always', 'those', 'both', 'paper', 'together', 'got', 'group', 'often', 'run'
            ],
            boost: 10.0,
          }],
        },
      };

      const [response] = await this.speechClient.recognize(request);
      
      if (!response.results || response.results.length === 0) {
        throw createError('No speech recognized in audio', 400);
      }

      const result = response.results[0];
      const alternative = result.alternatives?.[0];

      if (!alternative) {
        throw createError('No transcription alternatives found', 400);
      }

      // Extract word timings if available
      const wordTimings = alternative.words?.map(word => ({
        word: word.word || '',
        startTime: word.startTime?.seconds ? 
          parseInt(word.startTime.seconds.toString()) + (word.startTime.nanos || 0) / 1e9 : 0,
        endTime: word.endTime?.seconds ? 
          parseInt(word.endTime.seconds.toString()) + (word.endTime.nanos || 0) / 1e9 : 0,
        confidence: word.confidence || 0,
      })) || [];

      return {
        transcript: alternative.transcript || '',
        confidence: alternative.confidence || 0,
        alternatives: result.alternatives?.slice(1).map(alt => ({
          transcript: alt.transcript || '',
          confidence: alt.confidence || 0,
        })) || [],
        wordTimings,
      };
    } catch (error) {
      console.error('Google Speech recognition error:', error);
      throw createError('Speech recognition failed', 500);
    }
  }

  async synthesizeText(text: string, options: {
    languageCode?: string;
    voiceName?: string;
    gender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
    audioFormat?: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
    speakingRate?: number;
    pitch?: number;
  } = {}) {
    if (!this.isConfigured || !this.ttsClient) {
      throw createError('Google Cloud Text-to-Speech service not configured', 503);
    }

    try {
      const {
        languageCode = 'en-US',
        voiceName = 'en-US-Journey-F', // Child-friendly voice
        gender = 'FEMALE',
        audioFormat = 'MP3',
        speakingRate = 0.9, // Slightly slower for children
        pitch = 2.0, // Higher pitch for children
      } = options;

      const request = {
        input: { text },
        voice: {
          languageCode,
          name: voiceName,
          ssmlGender: gender,
        },
        audioConfig: {
          audioEncoding: audioFormat,
          speakingRate,
          pitch,
          volumeGainDb: 0.0,
          sampleRateHertz: 24000,
        },
      };

      const [response] = await this.ttsClient.synthesizeSpeech(request);
      
      if (!response.audioContent) {
        throw createError('Failed to generate audio', 500);
      }

      return {
        audioContent: response.audioContent,
        audioEncoding: audioFormat,
      };
    } catch (error) {
      console.error('Google TTS error:', error);
      throw createError('Text-to-speech synthesis failed', 500);
    }
  }

  async analyzePronunciation(audioBuffer: Buffer, expectedText: string, options: {
    languageCode?: string;
  } = {}) {
    if (!this.isConfigured || !this.speechClient) {
      throw createError('Google Cloud Speech service not configured', 503);
    }

    try {
      const { languageCode = 'en-US' } = options;

      // First, get the speech recognition result
      const recognitionResult = await this.recognizeSpeech(audioBuffer, {
        languageCode,
        enableWordTimeOffsets: true,
      });

      // Analyze pronunciation by comparing expected vs actual text
      const expectedWords = expectedText.toLowerCase().split(/\s+/);
      const actualWords = recognitionResult.transcript.toLowerCase().split(/\s+/);

      const analysis = this.compareTranscripts(expectedWords, actualWords, recognitionResult.wordTimings);

      return {
        overallAccuracy: analysis.accuracy,
        wordAccuracy: analysis.wordResults,
        recognitionResult,
        suggestions: this.generatePronunciationSuggestions(analysis.mistakes),
      };
    } catch (error) {
      console.error('Pronunciation analysis error:', error);
      throw createError('Pronunciation analysis failed', 500);
    }
  }

  private compareTranscripts(expected: string[], actual: string[], wordTimings: any[]) {
    const wordResults = [];
    let correctWords = 0;
    const mistakes = [];

    for (let i = 0; i < expected.length; i++) {
      const expectedWord = expected[i];
      const actualWord = actual[i] || '';
      const timing = wordTimings[i];

      const isCorrect = expectedWord === actualWord;
      if (isCorrect) {
        correctWords++;
      } else {
        mistakes.push({
          expected: expectedWord,
          actual: actualWord,
          position: i,
        });
      }

      wordResults.push({
        expected: expectedWord,
        actual: actualWord,
        correct: isCorrect,
        confidence: timing?.confidence || 0,
        timing: timing ? {
          start: timing.startTime,
          end: timing.endTime,
        } : null,
      });
    }

    return {
      accuracy: expected.length > 0 ? (correctWords / expected.length) * 100 : 0,
      wordResults,
      mistakes,
    };
  }

  private generatePronunciationSuggestions(mistakes: any[]) {
    const suggestions = [];

    for (const mistake of mistakes) {
      if (mistake.expected && mistake.actual) {
        suggestions.push(`Try saying "${mistake.expected}" more clearly.`);
      } else if (mistake.expected && !mistake.actual) {
        suggestions.push(`Don't forget to say "${mistake.expected}".`);
      }
    }

    if (mistakes.length === 0) {
      suggestions.push('Great job! Your pronunciation is excellent!');
    } else if (mistakes.length <= 2) {
      suggestions.push('Good reading! Just practice those few words a bit more.');
    } else {
      suggestions.push('Keep practicing! Try reading more slowly and clearly.');
    }

    return suggestions;
  }
}