'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import { ArrowLeft, BookOpen, Clock, Award, TrendingUp, Calendar, Target } from 'lucide-react';

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  reading_level: string;
  interests: string[];
  avatar_url?: string;
}

interface ReadingSession {
  id: string;
  duration: number; // in seconds
  progress: {
    words_read?: number;
    accuracy?: number;
    [key: string]: any;
  };
  start_time: string;
  end_time?: string;
  stories: {
    title: string;
    word_count: number;
    reading_level: string;
  } | null;
}

export default function ProgressPage() {
  return (
    <ProtectedRoute allowedRoles={['parent', 'educator']}>
      <ProgressContent />
    </ProtectedRoute>
  );
}

function ProgressContent() {
  const router = useRouter();
  const params = useParams();
  const childId = params.childId as string;
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (childId) {
      fetchChildProgress();
    }
  }, [childId]);

  const fetchChildProgress = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('auth_session') || '{}');
      
      // Fetch child profile
      const childResponse = await fetch('/api/auth/children', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (childResponse.ok) {
        const children = await childResponse.json();
        const selectedChild = children.find((c: ChildProfile) => c.id === childId);
        setChild(selectedChild || null);
      }

      // Fetch reading sessions from API
      const sessionsResponse = await fetch(`/api/progress/sessions/${childId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData);
      } else {
        console.error('Failed to fetch sessions:', await sessionsResponse.text());
        setSessions([]);
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateStats = () => {
    if (sessions.length === 0) return null;

    const totalWords = sessions.reduce((sum, session) => sum + (session.progress?.words_read || 0), 0);
    const totalTime = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const avgAccuracy = sessions.length > 0 
      ? sessions.reduce((sum, session) => sum + (session.progress?.accuracy || 0), 0) / sessions.length 
      : 0;

    return {
      totalWords,
      totalTime: Math.round(totalTime / 60), // Convert seconds to minutes
      avgAccuracy: Math.round(avgAccuracy),
      sessionsCount: sessions.length,
    };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="card text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Child Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to find the child profile.</p>
          <button onClick={() => router.push('/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>

        {/* Child Info */}
        <div className="card mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {child.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{child.name}'s Progress</h1>
              <p className="text-gray-600">Age {child.age} • {child.reading_level.charAt(0).toUpperCase() + child.reading_level.slice(1)} Reader</p>
            </div>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{stats.sessionsCount}</p>
                <p className="text-sm text-gray-600">Reading Sessions</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{stats.totalWords}</p>
                <p className="text-sm text-gray-600">Words Read</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{stats.totalTime}</p>
                <p className="text-sm text-gray-600">Minutes Reading</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-600">{stats.avgAccuracy}%</p>
                <p className="text-sm text-gray-600">Average Accuracy</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Reading Sessions</h2>
          
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reading Sessions Yet</h3>
              <p className="text-gray-600 mb-4">
                {child.name} hasn't started reading yet. Encourage them to begin their reading journey!
              </p>
              <button
                onClick={() => router.push('/select-child')}
                className="btn-primary"
              >
                Start Reading
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {session.stories?.title || 'Reading Session'}
                        </h3>
                        <p className="text-sm text-gray-600">{formatDate(session.start_time)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {Math.round((session.duration || 0) / 60)} min
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {session.progress?.words_read || 0} words
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {session.progress?.accuracy || 0}% accuracy
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}