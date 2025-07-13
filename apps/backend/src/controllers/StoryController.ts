import { Request, Response } from 'express';
import { GeminiService } from '../services/geminiService';
import { supabase } from '../services/supabase';
import { createError } from '../middleware/errorHandler';

export class StoryController {
  private geminiService: GeminiService;

  constructor() {
    this.geminiService = new GeminiService();
  }

  async generateStory(req: Request, res: Response) {
    try {
      const {
        childId,
        readingLevel,
        interests = [],
        theme,
        wordCount,
        educationalObjectives = [],
        characterName,
        wordFamily,
        examples = [],
        difficulty = 'beginner'
      } = req.body;

      // If word family is provided, generate a simpler story focused on that word family
      if (wordFamily && examples.length > 0) {
        return this.generateWordFamilyStory(req, res);
      }

      if (!childId || !readingLevel) {
        throw createError('Child ID and reading level are required', 400);
      }

      // Get child profile for personalization
      const { data: childProfile } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('id', childId)
        .single();

      if (!childProfile) {
        throw createError('Child profile not found', 404);
      }

      // Get recent stories to avoid repetition
      const { data: recentStories } = await supabase
        .from('reading_sessions')
        .select('stories(themes)')
        .eq('child_id', childId)
        .order('created_at', { ascending: false })
        .limit(5);

      const recentThemes = recentStories?.flatMap((session: any) => 
        session.stories?.themes || []
      ) || [];

      // Generate story using Gemini
      const story = await this.geminiService.generatePersonalizedStory(
        {
          name: childProfile.name,
          age: childProfile.age,
          readingLevel: childProfile.reading_level,
          interests: interests.length > 0 ? interests : childProfile.interests,
          recentStories: recentThemes,
        },
        {
          theme,
          wordCount,
          educationalObjectives,
        }
      );

      // Save story to database
      const { data: savedStory, error } = await supabase
        .from('stories')
        .insert({
          title: story.title,
          content: story.content,
          reading_level: readingLevel,
          word_count: story.wordCount,
          estimated_reading_time: story.estimatedReadingTime,
          themes: story.themes,
          is_generated: true,
          metadata: story.metadata,
        })
        .select()
        .single();

      if (error) {
        throw createError('Failed to save story', 500);
      }

      res.json({
        success: true,
        data: savedStory,
      });
    } catch (error) {
      console.error('Story generation error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Story generation failed',
      });
    }
  }

  async getStories(req: Request, res: Response) {
    try {
      const {
        readingLevel,
        theme,
        limit = 20,
        offset = 0,
        isGenerated,
      } = req.query;

      let query = supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (readingLevel) {
        query = query.eq('reading_level', readingLevel);
      }

      if (theme) {
        query = query.contains('themes', [theme]);
      }

      if (isGenerated !== undefined) {
        query = query.eq('is_generated', isGenerated === 'true');
      }

      query = query.range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      const { data: stories, error, count } = await query;

      if (error) {
        throw createError('Failed to fetch stories', 500);
      }

      res.json({
        success: true,
        data: stories,
        pagination: {
          offset: parseInt(offset as string),
          limit: parseInt(limit as string),
          total: count || 0,
        },
      });
    } catch (error) {
      console.error('Get stories error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stories',
      });
    }
  }

  async getStoryById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { data: story, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !story) {
        throw createError('Story not found', 404);
      }

      res.json({
        success: true,
        data: story,
      });
    } catch (error) {
      console.error('Get story error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch story',
      });
    }
  }

  async favoriteStory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { childId } = req.body;

      if (!childId) {
        throw createError('Child ID is required', 400);
      }

      // Check if story exists
      const { data: story } = await supabase
        .from('stories')
        .select('id')
        .eq('id', id)
        .single();

      if (!story) {
        throw createError('Story not found', 404);
      }

      // Add to favorites
      const { data, error } = await supabase
        .from('story_favorites')
        .insert({
          child_id: childId,
          story_id: id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw createError('Story already in favorites', 400);
        }
        throw createError('Failed to add favorite', 500);
      }

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Favorite story error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to favorite story',
      });
    }
  }

  async unfavoriteStory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { childId } = req.body;

      if (!childId) {
        throw createError('Child ID is required', 400);
      }

      const { error } = await supabase
        .from('story_favorites')
        .delete()
        .eq('child_id', childId)
        .eq('story_id', id);

      if (error) {
        throw createError('Failed to remove favorite', 500);
      }

      res.json({
        success: true,
        message: 'Story removed from favorites',
      });
    } catch (error) {
      console.error('Unfavorite story error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unfavorite story',
      });
    }
  }

  async getFeaturedStories(req: Request, res: Response) {
    try {
      const { limit = 10 } = req.query;

      // Get stories that are popular or highly rated
      const { data: stories, error } = await supabase
        .from('stories')
        .select(`
          *,
          reading_sessions(count)
        `)
        .eq('is_generated', false) // Prefer curated stories for featured
        .order('created_at', { ascending: false })
        .limit(parseInt(limit as string));

      if (error) {
        throw createError('Failed to fetch featured stories', 500);
      }

      res.json({
        success: true,
        data: stories,
      });
    } catch (error) {
      console.error('Get featured stories error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch featured stories',
      });
    }
  }

  async getRecommendedStories(req: Request, res: Response) {
    try {
      const { childId } = req.params;
      const { limit = 10 } = req.query;

      // Get child profile
      const { data: childProfile } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('id', childId)
        .single();

      if (!childProfile) {
        throw createError('Child profile not found', 404);
      }

      // Get child's reading history to understand preferences
      const { data: readingSessions } = await supabase
        .from('reading_sessions')
        .select(`
          stories(themes, reading_level),
          feedback
        `)
        .eq('child_id', childId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Get child's favorite themes
      const readStories = readingSessions || [];
      const themeFrequency: { [key: string]: number } = {};
      
      readStories.forEach((session: any) => {
        if (session.stories?.themes) {
          session.stories.themes.forEach((theme: string) => {
            themeFrequency[theme] = (themeFrequency[theme] || 0) + 1;
          });
        }
      });

      const preferredThemes = Object.keys(themeFrequency)
        .sort((a, b) => themeFrequency[b] - themeFrequency[a])
        .slice(0, 5);

      // Build recommendation query
      let query = supabase
        .from('stories')
        .select('*')
        .eq('reading_level', childProfile.reading_level)
        .order('created_at', { ascending: false });

      // Filter by preferred themes if available
      if (preferredThemes.length > 0) {
        query = query.overlaps('themes', preferredThemes);
      }

      // Exclude recently read stories
      const recentStoryIds = readStories
        .map((session: any) => session.stories?.id)
        .filter(Boolean)
        .slice(0, 10);

      if (recentStoryIds.length > 0) {
        query = query.not('id', 'in', `(${recentStoryIds.join(',')})`);
      }

      query = query.limit(parseInt(limit as string));

      const { data: stories, error } = await query;

      if (error) {
        throw createError('Failed to fetch recommended stories', 500);
      }

      res.json({
        success: true,
        data: stories,
        metadata: {
          childReadingLevel: childProfile.reading_level,
          preferredThemes,
          basedOnSessions: readStories.length,
        },
      });
    } catch (error) {
      console.error('Get recommended stories error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch recommended stories',
      });
    }
  }

  async generateWordFamilyStory(req: Request, res: Response) {
    try {
      const {
        wordFamily,
        examples = [],
        difficulty = 'beginner',
        theme = 'adventure'
      } = req.body;

      if (!wordFamily || examples.length === 0) {
        throw createError('Word family and examples are required', 400);
      }

      // Generate a simple story focused on the word family
      const story = await this.geminiService.generateWordFamilyStory({
        wordFamily,
        examples,
        difficulty,
        theme
      });

      // Create a simplified story object for immediate use
      const wordFamilyStory = {
        id: `wf-${wordFamily}-${Date.now()}`,
        title: story.title || `The ${wordFamily.toUpperCase()} Family Adventure`,
        content: story.content,
        wordFamily,
        targetWords: examples,
        reading_level: difficulty,
        word_count: story.content.split(' ').length,
        estimated_reading_time: Math.ceil(story.content.split(' ').length / 50), // 50 words per minute
        themes: [theme, 'word-family'],
        is_generated: true,
        metadata: {
          wordFamily,
          targetWords: examples,
          generatedAt: new Date().toISOString()
        }
      };

      // Save to database for tracking
      const { data: savedStory, error } = await supabase
        .from('stories')
        .insert({
          title: wordFamilyStory.title,
          content: wordFamilyStory.content,
          reading_level: difficulty,
          word_count: wordFamilyStory.word_count,
          estimated_reading_time: wordFamilyStory.estimated_reading_time,
          themes: wordFamilyStory.themes,
          is_generated: true,
          metadata: wordFamilyStory.metadata,
        })
        .select()
        .single();

      if (error) {
        console.warn('Failed to save word family story to database:', error);
        // Return the story anyway for immediate use
      }

      res.json({
        success: true,
        data: savedStory || wordFamilyStory,
      });
    } catch (error) {
      console.error('Word family story generation error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Word family story generation failed',
      });
    }
  }
}