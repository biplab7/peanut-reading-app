'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, ArrowLeft } from 'lucide-react';

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  reading_level: string;
  interests: string[];
  avatar_url?: string;
  preferences: {
    pin?: string;
    allowDirectAccess?: boolean;
  };
}

interface ChildSelectorProps {
  onBack: () => void;
  mode: 'selection' | 'pin-entry';
  selectedChild?: ChildProfile;
}

export default function ChildSelector({ onBack, mode: initialMode, selectedChild: initialChild }: ChildSelectorProps) {
  const [childProfiles, setChildProfiles] = useState<ChildProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState(initialMode);
  const [selectedChild, setSelectedChild] = useState<ChildProfile | undefined>(initialChild);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (mode === 'selection') {
      fetchChildProfiles();
    }
  }, [mode]);

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

  const handleChildSelect = (child: ChildProfile) => {
    // Store selected child in session storage for reading session
    sessionStorage.setItem('selected_child', JSON.stringify(child));

    // If child has PIN protection, show PIN entry
    if (child.preferences.pin) {
      setSelectedChild(child);
      setMode('pin-entry');
      setPin('');
      setPinError('');
    } else {
      // Direct access
      router.push('/reading?childId=' + child.id);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    if (!selectedChild) return;

    if (pin === selectedChild.preferences.pin) {
      // PIN correct, proceed to reading
      router.push('/reading?childId=' + selectedChild.id);
    } else {
      setPinError('Incorrect PIN. Please try again.');
      setPin('');
    }
  };

  const handlePinDigitClick = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
    }
  };

  const handlePinClear = () => {
    setPin('');
    setPinError('');
  };

  const handlePinBack = () => {
    setMode('selection');
    setSelectedChild(undefined);
    setPin('');
    setPinError('');
  };

  if (mode === 'pin-entry' && selectedChild) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <button
            onClick={handlePinBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to selection
          </button>

          <div className={`w-20 h-20 bg-gradient-to-br ${selectedChild.avatar_url || 'from-blue-400 to-blue-600'} rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4`}>
            {selectedChild.name.charAt(0).toUpperCase()}
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Welcome, {selectedChild.name}!
          </h3>
          <p className="text-gray-600 mb-6">
            Enter your PIN to continue
          </p>

          {pinError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {pinError}
            </div>
          )}

          <form onSubmit={handlePinSubmit} className="space-y-6">
            {/* PIN Display */}
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="w-12 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center text-2xl font-bold bg-white"
                >
                  {pin[index] ? '•' : ''}
                </div>
              ))}
            </div>

            {/* PIN Keypad */}
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handlePinDigitClick(digit.toString())}
                  className="w-16 h-16 bg-white border-2 border-gray-300 rounded-lg text-xl font-bold text-gray-900 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  disabled={pin.length >= 4}
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handlePinClear}
                className="w-16 h-16 bg-white border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-red-500 hover:bg-red-50 transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handlePinDigitClick('0')}
                className="w-16 h-16 bg-white border-2 border-gray-300 rounded-lg text-xl font-bold text-gray-900 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                disabled={pin.length >= 4}
              >
                0
              </button>
              <button
                type="submit"
                className="w-16 h-16 bg-blue-600 border-2 border-blue-600 rounded-lg text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                disabled={pin.length !== 4}
              >
                Go
              </button>
            </div>
          </form>

          <div className="mt-6 text-sm text-gray-500">
            <p>
              <Lock className="w-4 h-4 inline mr-1" />
              Your PIN keeps your reading progress safe
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Who's reading today? 📚
          </h2>
          <p className="text-gray-600">
            Select a child profile to start reading
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : childProfiles.length === 0 ? (
          <div className="card text-center py-12 max-w-md mx-auto">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-gray-900 mb-2">No Child Profiles</h4>
            <p className="text-gray-600 mb-4">
              Create a child profile first to start reading
            </p>
            <button
              onClick={onBack}
              className="btn-primary"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {childProfiles.map((child) => (
              <button
                key={child.id}
                onClick={() => handleChildSelect(child)}
                className="card hover:shadow-xl transition-all duration-300 hover:scale-105 text-left group"
              >
                <div className="flex flex-col items-center text-center p-6">
                  <div className={`w-20 h-20 bg-gradient-to-br ${child.avatar_url || 'from-blue-400 to-blue-600'} rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {child.name}
                  </h3>
                  
                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    <p>Age {child.age}</p>
                    <p className="capitalize">{child.reading_level} reader</p>
                  </div>

                  {child.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center mb-4">
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
                          +{child.interests.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    {child.preferences.pin && (
                      <>
                        <Lock className="w-3 h-3" />
                        PIN Protected
                      </>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}