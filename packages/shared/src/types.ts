// User Types
export interface User {
  id: string;
  email: string;
  role: 'parent' | 'child' | 'educator';
  createdAt: string;
  updatedAt: string;
}

export interface ChildProfile {
  id: string;
  parentId: string;
  name: string;
  age: number;
  readingLevel: ReadingLevel;
  interests: string[];
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParentProfile {
  id: string;
  userId: string;
  children: ChildProfile[];
  preferences: ParentPreferences;
}

// Reading Types
export type ReadingLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced';

export interface Story {
  id: string;
  title: string;
  content: string;
  readingLevel: ReadingLevel;
  wordCount: number;
  estimatedReadingTime: number;
  themes: string[];
  createdAt: string;
  isGenerated: boolean;
  metadata?: StoryMetadata;
}

export interface StoryMetadata {
  difficulty: number;
  vocabulary: string[];
  educationalObjectives: string[];
  illustrations?: string[];
}

// Reading Session Types
export interface ReadingSession {
  id: string;
  childId: string;
  storyId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  progress: ReadingProgress;
  feedback: ReadingFeedback;
}

export interface ReadingProgress {
  wordsRead: number;
  accuracy: number;
  wpm: number;
  comprehensionScore?: number;
  mistakeCount: number;
  completionPercentage: number;
}

export interface ReadingFeedback {
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
  suggestions: string[];
  encouragement: string;
}

// Speech Recognition Types
export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  alternatives?: SpeechAlternative[];
  wordTimings?: WordTiming[];
}

export interface SpeechAlternative {
  transcript: string;
  confidence: number;
}

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface SpeechAnalysis {
  accuracy: number;
  fluency: number;
  pronunciation: number;
  mistakeWords: string[];
  suggestions: string[];
}

// Achievement Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: AchievementCriteria;
  rewards: number;
}

export interface AchievementCriteria {
  type: 'reading_streak' | 'stories_completed' | 'accuracy_improvement' | 'reading_time';
  target: number;
  timeframe?: string;
}

export interface UserAchievement {
  id: string;
  childId: string;
  achievementId: string;
  earnedAt: string;
  progress: number;
}

// Settings Types
export interface ParentPreferences {
  contentFiltering: ContentFilterLevel;
  sessionLimits: SessionLimits;
  notifications: NotificationSettings;
  privacySettings: PrivacySettings;
}

export type ContentFilterLevel = 'strict' | 'moderate' | 'lenient';

export interface SessionLimits {
  dailyMaxDuration: number;
  maxSessionDuration: number;
  breakReminders: boolean;
}

export interface NotificationSettings {
  progressReports: boolean;
  achievements: boolean;
  reminders: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
}

export interface PrivacySettings {
  dataCollection: boolean;
  audioRetention: boolean;
  analytics: boolean;
  shareProgress: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// AI Service Types
export interface StoryGenerationRequest {
  childId: string;
  readingLevel: ReadingLevel;
  interests: string[];
  wordCount?: number;
  theme?: string;
  educationalObjectives?: string[];
}

export interface SpeechRecognitionRequest {
  audioData: string;
  childId: string;
  expectedText?: string;
  language?: string;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}