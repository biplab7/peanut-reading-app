import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class UserController {
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers.authorization?.replace('Bearer ', '');
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers.authorization?.replace('Bearer ', '');
      const updateData = req.body;

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
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

  async createChild(req: Request, res: Response): Promise<void> {
    try {
      const parentId = req.headers.authorization?.replace('Bearer ', '');
      const { name, age, readingLevel, interests, avatarUrl, preferences } = req.body;

      const { data, error } = await supabase
        .from('child_profiles')
        .insert({
          parent_id: parentId,
          name,
          age,
          reading_level: readingLevel,
          interests: interests || [],
          avatar_url: avatarUrl,
          preferences: preferences || {},
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

  async getChildren(req: Request, res: Response): Promise<void> {
    try {
      const parentId = req.headers.authorization?.replace('Bearer ', '');

      const { data, error } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('parent_id', parentId);

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getChildById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const parentId = req.headers.authorization?.replace('Bearer ', '');

      const { data, error } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('id', id)
        .eq('parent_id', parentId)
        .single();

      if (error) {
        res.status(404).json({ error: 'Child not found' });
        return;
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateChild(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const parentId = req.headers.authorization?.replace('Bearer ', '');
      const updateData = req.body;

      const { data, error } = await supabase
        .from('child_profiles')
        .update(updateData)
        .eq('id', id)
        .eq('parent_id', parentId)
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

  async deleteChild(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const parentId = req.headers.authorization?.replace('Bearer ', '');

      const { error } = await supabase
        .from('child_profiles')
        .delete()
        .eq('id', id)
        .eq('parent_id', parentId);

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.json({ message: 'Child profile deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const parentId = req.headers.authorization?.replace('Bearer ', '');

      const { data, error } = await supabase
        .from('parent_settings')
        .select('*')
        .eq('parent_id', parentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        res.status(400).json({ error: error.message });
        return;
      }

      // Return default settings if none exist
      const defaultSettings = {
        parent_id: parentId,
        content_filtering: 'moderate',
        session_limits: {},
        notifications: {},
        privacy_settings: {},
      };

      res.json(data || defaultSettings);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const parentId = req.headers.authorization?.replace('Bearer ', '');
      const updateData = { ...req.body, parent_id: parentId };

      const { data, error } = await supabase
        .from('parent_settings')
        .upsert(updateData)
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
}