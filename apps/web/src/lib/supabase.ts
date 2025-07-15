import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface Profile {
  id: string
  email: string
  role: 'parent' | 'child' | 'educator'
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface ChildProfile {
  id: string
  parent_id: string
  name: string
  age: number
  reading_level: 'beginner' | 'elementary' | 'intermediate' | 'advanced'
  interests: string[]
  avatar_url?: string
  preferences: {
    pin?: string
    allowDirectAccess?: boolean
  }
  created_at: string
  updated_at: string
}