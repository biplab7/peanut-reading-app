'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import CreateChildForm from '../../components/child/CreateChildForm';
import { BookOpen, Users, Plus, Settings, LogOut, User, Award } from 'lucide-react';

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  reading_level: 'beginner' | 'elementary' | 'intermediate' | 'advanced';
  interests: string[];
  avatar_url?: string;
  created_at: string;
}

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['parent', 'educator']}>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [childProfiles, setChildProfiles] = useState<ChildProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);

  useEffect(() => {
    fetchChildProfiles();
  }, []);

  const fetchChildProfiles = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('auth_session') || '{}');
      const response = await fetch('/api/auth/children', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChildProfiles(data);
      }
    } catch (error) {
      console.error('Failed to fetch child profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleChildCreated = (newChild: ChildProfile) => {
    setChildProfiles(prev => [...prev, newChild]);
    setShowAddChild(false);
  };

  const handleStartReading = () => {
    window.location.href = '/select-child';
  };

  const handleViewProgress = (childId: string) => {
    router.push(`/progress/${childId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Peanut Reading</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">{user?.full_name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.full_name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-gray-600">
            Manage your children's reading journey and track their progress.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {childProfiles.length}
                </h3>
                <p className="text-gray-600">Child Profiles</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">24</h3>
                <p className="text-gray-600">Stories Read</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">12</h3>
                <p className="text-gray-600">Achievements</p>
              </div>
            </div>
          </div>
        </div>

        {/* Child Profiles Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Child Profiles</h3>
            <button
              onClick={() => setShowAddChild(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Child
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : childProfiles.length === 0 ? (
            <div className="card text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">No Child Profiles Yet</h4>
              <p className="text-gray-600 mb-4">
                Create your first child profile to start their reading journey!
              </p>
              <button
                onClick={() => setShowAddChild(true)}
                className="btn-primary"
              >
                Create First Profile
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {childProfiles.map((child) => (
                <div key={child.id} className="card hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {child.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{child.name}</h4>
                      <p className="text-sm text-gray-600">Age {child.age}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Reading Level:</span>
                      <span className="text-sm font-medium capitalize text-blue-600">
                        {child.reading_level}
                      </span>
                    </div>
                    
                    {child.interests.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600">Interests:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {child.interests.slice(0, 3).map((interest, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                            >
                              {interest}
                            </span>
                          ))}
                          {child.interests.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{child.interests.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleViewProgress(child.id)}
                      className="btn-secondary text-sm flex-1"
                    >
                      View Progress
                    </button>
                    <button 
                      onClick={handleStartReading}
                      className="btn-primary text-sm flex-1"
                    >
                      Start Reading
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Emma completed "The Magic Garden"</p>
                <p className="text-xs text-gray-600">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Award className="w-5 h-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Alex earned "Speed Reader" achievement</p>
                <p className="text-xs text-gray-600">1 day ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <BookOpen className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Emma started reading "Space Adventure"</p>
                <p className="text-xs text-gray-600">2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Child Modal */}
      {showAddChild && (
        <CreateChildForm
          onClose={() => setShowAddChild(false)}
          onSuccess={handleChildCreated}
        />
      )}
    </div>
  );
}