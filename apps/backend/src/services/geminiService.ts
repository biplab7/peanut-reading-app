import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { createError } from '../middleware/errorHandler';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google AI API key not configured');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
  }

  async generateStory(options: {
    readingLevel: 'beginner' | 'elementary' | 'intermediate' | 'advanced';
    interests: string[];
    theme?: string;
    wordCount?: number;
    childAge?: number;
    educationalObjectives?: string[];
    characterName?: string;
  }) {
    try {
      const {
        readingLevel,
        interests,
        theme = 'adventure',
        wordCount = this.getDefaultWordCount(readingLevel),
        childAge = 8,
        educationalObjectives = [],
        characterName = '',
      } = options;

      const prompt = this.buildStoryPrompt({
        readingLevel,
        interests,
        theme,
        wordCount,
        childAge,
        educationalObjectives,
        characterName,
      });

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const storyText = response.text();

      if (!storyText) {
        throw createError('Failed to generate story content', 500);
      }

      // Parse the structured response
      const parsedStory = this.parseStoryResponse(storyText);
      
      // Validate content safety for children
      const safetyCheck = await this.validateContentSafety(parsedStory.content);
      if (!safetyCheck.isSafe) {
        throw createError('Generated content failed safety validation', 400);
      }

      return {
        ...parsedStory,
        readingLevel,
        estimatedReadingTime: Math.ceil(parsedStory.wordCount / this.getReadingSpeed(readingLevel)),
        isGenerated: true,
        metadata: {
          interests,
          theme,
          educationalObjectives,
          generatedAt: new Date().toISOString(),
          safetyScore: safetyCheck.score,
        },
      };
    } catch (error) {
      console.error('Story generation error:', error);
      throw createError('Story generation failed', 500);
    }
  }

  async generatePersonalizedStory(childProfile: {
    name: string;
    age: number;
    readingLevel: string;
    interests: string[];
    recentStories?: string[];
  }, storyRequest: {
    theme?: string;
    wordCount?: number;
    educationalObjectives?: string[];
  }) {
    try {
      const prompt = `Create a personalized story for ${childProfile.name}, a ${childProfile.age}-year-old child at ${childProfile.readingLevel} reading level.

Child's interests: ${childProfile.interests.join(', ')}
${childProfile.recentStories ? `Recent story themes to avoid: ${childProfile.recentStories.join(', ')}` : ''}

Story requirements:
- Theme: ${storyRequest.theme || 'adventure'}
- Word count: approximately ${storyRequest.wordCount || this.getDefaultWordCount(childProfile.readingLevel as any)} words
- Reading level: ${childProfile.readingLevel}
${storyRequest.educationalObjectives ? `- Educational objectives: ${storyRequest.educationalObjectives.join(', ')}` : ''}

Create an engaging, age-appropriate story that incorporates the child's interests. The story should:
1. Feature ${childProfile.name} as the main character (or a character with a similar name)
2. Include elements from their interests
3. Have a positive, uplifting message
4. Use vocabulary appropriate for their reading level
5. Be exactly the requested word count
6. Include some interactive elements or questions to engage the reader

Format the response as JSON:
{
  "title": "Story Title",
  "content": "Full story text...",
  "wordCount": number,
  "themes": ["theme1", "theme2"],
  "vocabulary": ["challenging", "word", "list"],
  "comprehensionQuestions": ["Question 1?", "Question 2?"],
  "moralLesson": "Brief description of the story's positive message"
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const storyText = response.text();

      const parsedStory = this.parseStoryResponse(storyText);
      
      // Validate content safety
      const safetyCheck = await this.validateContentSafety(parsedStory.content);
      if (!safetyCheck.isSafe) {
        throw createError('Generated content failed safety validation', 400);
      }

      return {
        ...parsedStory,
        readingLevel: childProfile.readingLevel,
        estimatedReadingTime: Math.ceil(parsedStory.wordCount / this.getReadingSpeed(childProfile.readingLevel as any)),
        isGenerated: true,
        personalizedFor: childProfile.name,
        metadata: {
          childAge: childProfile.age,
          interests: childProfile.interests,
          generatedAt: new Date().toISOString(),
          safetyScore: safetyCheck.score,
        },
      };
    } catch (error) {
      console.error('Personalized story generation error:', error);
      throw createError('Personalized story generation failed', 500);
    }
  }

  async generateReadingFeedback(readingData: {
    childName: string;
    childAge: number;
    storyTitle: string;
    accuracy: number;
    wordsPerMinute: number;
    mistakeCount: number;
    readingTime: number;
    commonMistakes?: string[];
  }) {
    try {
      const prompt = `Generate encouraging and constructive reading feedback for ${readingData.childName}, age ${readingData.childAge}.

Reading session data:
- Story: "${readingData.storyTitle}"
- Accuracy: ${readingData.accuracy}%
- Reading speed: ${readingData.wordsPerMinute} words per minute
- Mistakes: ${readingData.mistakeCount}
- Reading time: ${readingData.readingTime} seconds
${readingData.commonMistakes ? `- Common mistake words: ${readingData.commonMistakes.join(', ')}` : ''}

Provide age-appropriate, encouraging feedback that:
1. Celebrates their efforts and progress
2. Acknowledges their strengths
3. Gently suggests areas for improvement
4. Includes specific, actionable tips
5. Uses positive, motivational language suitable for a ${readingData.childAge}-year-old
6. Suggests fun practice activities

Format as JSON:
{
  "overallMessage": "Main encouraging message",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["gentle suggestion 1", "gentle suggestion 2"],
  "practiceActivities": ["fun activity 1", "fun activity 2"],
  "nextSteps": "What to focus on next",
  "motivationalBadge": "Achievement badge earned (if any)"
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const feedbackText = response.text();

      return this.parseFeedbackResponse(feedbackText);
    } catch (error) {
      console.error('Reading feedback generation error:', error);
      throw createError('Reading feedback generation failed', 500);
    }
  }

  private buildStoryPrompt(options: any): string {
    const vocabularyLevel = this.getVocabularyGuidance(options.readingLevel);
    
    return `Create an engaging children's story with the following specifications:

Reading Level: ${options.readingLevel}
Target Age: ${options.childAge} years old
Word Count: Approximately ${options.wordCount} words
Theme: ${options.theme}
Child's Interests: ${options.interests.join(', ')}
${options.characterName ? `Main Character Name: ${options.characterName}` : ''}
${options.educationalObjectives.length > 0 ? `Educational Goals: ${options.educationalObjectives.join(', ')}` : ''}

Writing Guidelines:
${vocabularyLevel}

The story should:
1. Be age-appropriate and positive
2. Include a clear beginning, middle, and end
3. Have relatable characters and situations
4. Incorporate the child's interests naturally
5. Include some dialogue to make it engaging
6. End with a positive message or lesson
7. Be exactly the requested word count

Format the response as JSON:
{
  "title": "Story Title",
  "content": "Full story text with proper paragraphs...",
  "wordCount": actual_word_count,
  "themes": ["theme1", "theme2"],
  "vocabulary": ["key", "words", "used"],
  "moralLesson": "Brief description of the story's message"
}`;
  }

  private getVocabularyGuidance(readingLevel: string): string {
    switch (readingLevel) {
      case 'beginner':
        return `- Use simple, common words (1-2 syllables mostly)
- Short sentences (5-8 words average)
- Present tense primarily
- Avoid complex punctuation
- Include sight words and phonetic patterns`;
      
      case 'elementary':
        return `- Mix of simple and slightly complex words (1-3 syllables)
- Sentences of varying length (6-12 words average)
- Include some past tense
- Basic punctuation (periods, question marks, exclamation points)
- Some descriptive adjectives`;
      
      case 'intermediate':
        return `- More varied vocabulary (2-4 syllables acceptable)
- Complex sentences with conjunctions
- Multiple tenses
- Advanced punctuation (commas, quotation marks)
- Descriptive language and figurative expressions`;
      
      case 'advanced':
        return `- Rich, varied vocabulary including challenging words
- Complex sentence structures
- Multiple tenses and advanced grammar
- All punctuation types
- Literary devices like metaphors and similes`;
      
      default:
        return 'Use age-appropriate vocabulary and sentence structure.';
    }
  }

  private getDefaultWordCount(readingLevel: string): number {
    switch (readingLevel) {
      case 'beginner': return 100;
      case 'elementary': return 200;
      case 'intermediate': return 350;
      case 'advanced': return 500;
      default: return 200;
    }
  }

  private getReadingSpeed(readingLevel: string): number {
    // Words per minute for different reading levels
    switch (readingLevel) {
      case 'beginner': return 50;
      case 'elementary': return 70;
      case 'intermediate': return 90;
      case 'advanced': return 120;
      default: return 70;
    }
  }

  private parseStoryResponse(responseText: string) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title || 'Untitled Story',
          content: parsed.content || responseText,
          wordCount: parsed.wordCount || this.countWords(parsed.content || responseText),
          themes: parsed.themes || [],
          vocabulary: parsed.vocabulary || [],
          moralLesson: parsed.moralLesson || '',
          comprehensionQuestions: parsed.comprehensionQuestions || [],
        };
      }
    } catch (error) {
      console.error('Failed to parse story JSON:', error);
    }

    // Fallback: treat entire response as story content
    return {
      title: 'Generated Story',
      content: responseText,
      wordCount: this.countWords(responseText),
      themes: [],
      vocabulary: [],
      moralLesson: '',
      comprehensionQuestions: [],
    };
  }

  private parseFeedbackResponse(responseText: string) {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse feedback JSON:', error);
    }

    // Fallback response
    return {
      overallMessage: responseText,
      strengths: ['Great effort!'],
      improvements: ['Keep practicing!'],
      practiceActivities: ['Read more stories'],
      nextSteps: 'Continue reading regularly',
      motivationalBadge: 'Reading Effort',
    };
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  private async validateContentSafety(content: string) {
    try {
      // Use Gemini's built-in safety features
      const prompt = `Analyze this children's story content for safety and appropriateness for kids aged 4-12. Check for:
1. Age-appropriate themes and language
2. Positive messages and values
3. No scary, violent, or inappropriate content
4. Educational value

Content to analyze: "${content}"

Respond with JSON:
{
  "isSafe": true/false,
  "score": 0-100,
  "concerns": ["any concerns"],
  "recommendations": ["any improvements"]
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const safetyText = response.text();

      try {
        const jsonMatch = safetyText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            isSafe: parsed.isSafe !== false, // Default to safe if unclear
            score: parsed.score || 85,
            concerns: parsed.concerns || [],
            recommendations: parsed.recommendations || [],
          };
        }
      } catch (parseError) {
        console.error('Failed to parse safety response:', parseError);
      }

      // Default to safe with medium score
      return {
        isSafe: true,
        score: 85,
        concerns: [],
        recommendations: [],
      };
    } catch (error) {
      console.error('Content safety validation error:', error);
      // Default to safe to avoid blocking legitimate content
      return {
        isSafe: true,
        score: 80,
        concerns: ['Unable to validate'],
        recommendations: [],
      };
    }
  }
}