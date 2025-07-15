'use client';

import { useState } from 'react';
import { User, Calendar, BookOpen, Heart, Save, X } from 'lucide-react';

interface CreateChildFormProps {
  onClose: () => void;
  onSuccess: (child: any) => void;
}

const READING_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'Just starting to read, learning basic words' },
  { value: 'elementary', label: 'Elementary', description: 'Can read simple sentences and short stories' },
  { value: 'intermediate', label: 'Intermediate', description: 'Comfortable with longer texts and complex words' },
  { value: 'advanced', label: 'Advanced', description: 'Confident reader, enjoys chapter books' },
];

const INTEREST_OPTIONS = [
  'Animals', 'Adventure', 'Fantasy', 'Science', 'Space', 'Dinosaurs',
  'Friendship', 'Family', 'Sports', 'Music', 'Art', 'Nature',
  'Mystery', 'Comedy', 'Superheroes', 'Fairy Tales', 'Vehicles', 'Food'
];

const AVATAR_COLORS = [
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-green-400 to-green-600',
  'from-pink-400 to-pink-600',
  'from-yellow-400 to-yellow-600',
  'from-red-400 to-red-600',
  'from-indigo-400 to-indigo-600',
  'from-teal-400 to-teal-600',
];

export default function CreateChildForm({ onClose, onSuccess }: CreateChildFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    readingLevel: 'beginner' as const,
    interests: [] as string[],
    avatarColor: AVATAR_COLORS[0],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleAvatarColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, avatarColor: color }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    const age = parseInt(formData.age);
    if (!age || age < 3 || age > 18) {
      setError('Age must be between 3 and 18');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const session = JSON.parse(localStorage.getItem('auth_session') || '{}');
      const response = await fetch('/api/auth/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          age: parseInt(formData.age),
          readingLevel: formData.readingLevel,
          interests: formData.interests,
          avatarUrl: formData.avatarColor, // Store color as avatar
          preferences: {},
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess(data);
      } else {
        setError(data.error || 'Failed to create child profile');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Create Child Profile</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Basic Information</h4>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Child's Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter child's name"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="3"
                  max="18"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Child's age (3-18)"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Avatar Color Selection */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Choose Avatar Color</h4>
            <div className="grid grid-cols-4 gap-3">
              {AVATAR_COLORS.map((color, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleAvatarColorSelect(color)}
                  className={`w-12 h-12 bg-gradient-to-br ${color} rounded-full flex items-center justify-center text-white font-bold text-lg transition-transform ${
                    formData.avatarColor === color ? 'ring-4 ring-blue-500 scale-110' : 'hover:scale-105'
                  }`}
                  disabled={isLoading}
                >
                  {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                </button>
              ))}
            </div>
          </div>

          {/* Reading Level */}
          <div>
            <label htmlFor="readingLevel" className="block text-sm font-medium text-gray-700 mb-1">
              Reading Level
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BookOpen className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="readingLevel"
                name="readingLevel"
                value={formData.readingLevel}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                {READING_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {READING_LEVELS.find(l => l.value === formData.readingLevel)?.description}
            </p>
          </div>

          {/* Interests */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Interests (Select up to 6)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    formData.interests.includes(interest)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                  }`}
                  disabled={isLoading || (!formData.interests.includes(interest) && formData.interests.length >= 6)}
                >
                  <Heart className={`w-4 h-4 inline mr-1 ${formData.interests.includes(interest) ? 'fill-current' : ''}`} />
                  {interest}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Selected: {formData.interests.length}/6
            </p>
          </div>


          {/* Form Actions */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}