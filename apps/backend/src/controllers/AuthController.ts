import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, fullName, role = 'parent' } = req.body;

      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        res.status(400).json({ error: authError.message });
        return;
      }

      if (!authData.user) {
        res.status(400).json({ error: 'Failed to create user' });
        return;
      }

      // Create profile in our profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          role,
          full_name: fullName,
        })
        .select()
        .single();

      if (profileError) {
        res.status(400).json({ error: profileError.message });
        return;
      }

      res.status(201).json({
        user: authData.user,
        profile,
        session: authData.session,
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        res.status(401).json({ error: error.message });
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      res.json({
        user: data.user,
        profile,
        session: data.session,
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refresh_token } = req.body;

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token,
      });

      if (error) {
        res.status(401).json({ error: error.message });
        return;
      }

      res.json({
        session: data.session,
        user: data.user,
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

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

  async createChildProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parentId = req.user?.id;
      
      if (!parentId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
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

  async getChildProfiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parentId = req.user?.id;
      
      if (!parentId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

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

  async updateChildProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const parentId = req.user?.id;
      
      if (!parentId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
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

  async deleteChildProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const parentId = req.user?.id;
      
      if (!parentId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

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
}