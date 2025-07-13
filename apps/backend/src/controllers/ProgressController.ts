import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class ProgressController {
  async createSession(req: Request, res: Response): Promise<void> {
    try {
      const { childId, storyId, progress, feedback } = req.body;

      const { data, error } = await supabase
        .from('reading_sessions')
        .insert({
          child_id: childId,
          story_id: storyId,
          progress: progress || {},
          feedback: feedback || {},
        })
        .select()
        .single();

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getSessions(req: Request, res: Response): Promise<void> {
    try {
      const { childId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const { data, error } = await supabase
        .from('reading_sessions')
        .select(`
          *,
          stories:story_id (
            id,
            title,
            reading_level,
            word_count,
            estimated_reading_time
          )
        `)
        .eq('child_id', childId)
        .order('start_time', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1);

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateSession(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Calculate duration if end_time is provided
      if (updateData.end_time) {
        const { data: session } = await supabase
          .from('reading_sessions')
          .select('start_time')
          .eq('id', id)
          .single();

        if (session) {
          const startTime = new Date(session.start_time);
          const endTime = new Date(updateData.end_time);
          updateData.duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        }
      }

      const { data, error } = await supabase
        .from('reading_sessions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getSessionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('reading_sessions')
        .select(`
          *,
          stories:story_id (
            id,
            title,
            content,
            reading_level,
            word_count,
            estimated_reading_time,
            themes
          ),
          child_profiles:child_id (
            id,
            name,
            age,
            reading_level
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { childId } = req.params;
      const { period = '30' } = req.query; // days

      const periodDays = Number(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Get reading sessions for analytics
      const { data: sessions, error } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('child_id', childId)
        .gte('start_time', startDate.toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      // Calculate analytics
      const totalSessions = sessions.length;
      const totalDuration = sessions.reduce((sum: number, session: any) => sum + (session.duration || 0), 0);
      const averageSessionLength = totalSessions > 0 ? totalDuration / totalSessions : 0;

      // Group sessions by date for daily activity
      const dailyActivity = sessions.reduce((acc: Record<string, number>, session: any) => {
        const date = new Date(session.start_time).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      // Calculate reading streak
      let currentStreak = 0;
      let longestStreak = 0;
      let streak = 0;
      
      const today = new Date();
      for (let i = 0; i < periodDays; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        if (dailyActivity[dateStr]) {
          streak++;
          if (i === 0) currentStreak = streak;
        } else {
          longestStreak = Math.max(longestStreak, streak);
          streak = 0;
        }
      }
      longestStreak = Math.max(longestStreak, streak);

      const analytics = {
        totalSessions,
        totalDuration,
        averageSessionLength: Math.round(averageSessionLength),
        dailyActivity,
        currentStreak,
        longestStreak,
        period: periodDays,
      };

      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getProgressReport(req: Request, res: Response): Promise<void> {
    try {
      const { childId } = req.params;

      // Get child profile
      const { data: child, error: childError } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('id', childId)
        .single();

      if (childError) {
        res.status(404).json({ error: 'Child not found' });
        return;
      }

      // Get recent sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('reading_sessions')
        .select(`
          *,
          stories:story_id (
            title,
            reading_level,
            word_count
          )
        `)
        .eq('child_id', childId)
        .order('start_time', { ascending: false })
        .limit(20);

      if (sessionsError) {
        res.status(400).json({ error: sessionsError.message });
        return;
      }

      // Get achievements
      const { data: achievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements:achievement_id (
            name,
            description,
            icon,
            rewards
          )
        `)
        .eq('child_id', childId)
        .order('earned_at', { ascending: false });

      if (achievementsError) {
        res.status(400).json({ error: achievementsError.message });
        return;
      }

      // Calculate progress metrics
      const totalSessions = sessions.length;
      const totalReadingTime = sessions.reduce((sum: number, session: any) => sum + (session.duration || 0), 0);
      const averageAccuracy = sessions.length > 0 
        ? sessions.reduce((sum: number, session: any) => {
            const accuracy = session.progress?.accuracy || 0;
            return sum + accuracy;
          }, 0) / sessions.length
        : 0;

      const report = {
        child,
        totalSessions,
        totalReadingTime,
        averageAccuracy: Math.round(averageAccuracy),
        recentSessions: sessions.slice(0, 10),
        achievements: achievements || [],
        totalAchievements: achievements?.length || 0,
      };

      res.json(report);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAchievements(req: Request, res: Response): Promise<void> {
    try {
      const { childId } = req.params;

      // Get earned achievements
      const { data: earnedAchievements, error: earnedError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements:achievement_id (
            id,
            name,
            description,
            icon,
            criteria,
            rewards
          )
        `)
        .eq('child_id', childId);

      if (earnedError) {
        res.status(400).json({ error: earnedError.message });
        return;
      }

      // Get all available achievements
      const { data: allAchievements, error: allError } = await supabase
        .from('achievements')
        .select('*');

      if (allError) {
        res.status(400).json({ error: allError.message });
        return;
      }

      const earnedIds = new Set(earnedAchievements.map((ea: any) => ea.achievement_id));
      const availableAchievements = allAchievements.filter((a: any) => !earnedIds.has(a.id));

      res.json({
        earned: earnedAchievements,
        available: availableAchievements,
        totalEarned: earnedAchievements.length,
        totalAvailable: allAchievements.length,
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async unlockAchievement(req: Request, res: Response): Promise<void> {
    try {
      const { childId } = req.params;
      const { achievementId, progress = 100 } = req.body;

      // Check if already earned
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('child_id', childId)
        .eq('achievement_id', achievementId)
        .single();

      if (existing) {
        res.status(400).json({ error: 'Achievement already earned' });
        return;
      }

      // Award achievement
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          child_id: childId,
          achievement_id: achievementId,
          progress,
        })
        .select(`
          *,
          achievements:achievement_id (
            name,
            description,
            icon,
            rewards
          )
        `)
        .single();

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}