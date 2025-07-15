'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export default function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'parent' as 'parent' | 'child' | 'educator',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 [SignupForm] Starting registration process');
    console.log('👤 [SignupForm] Registration data:', {
      fullName: formData.fullName,
      email: formData.email,
      role: formData.role,
      password: '***'
    });
    
    setError('');

    if (!validateForm()) {
      console.log('❌ [SignupForm] Form validation failed');
      return;
    }

    console.log('✅ [SignupForm] Form validation passed');
    setIsLoading(true);

    try {
      console.log('🌐 [SignupForm] Making Supabase Auth signup call');
      const requestData = {
        email: formData.email,
        password: '***', // Don't log actual password
        fullName: formData.fullName,
        role: formData.role,
      };
      console.log('📤 [SignupForm] Request data:', requestData);

      const startTime = Date.now();
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role,
          }
        }
      });

      const requestTime = Date.now() - startTime;
      console.log(`⏱️ [SignupForm] Supabase signup completed in ${requestTime}ms`);

      if (error) {
        console.error('❌ [SignupForm] Supabase signup error:', error);
        setError(error.message || 'Registration failed');
        return;
      }

      console.log('✅ [SignupForm] Registration successful!');
      console.log('👤 [SignupForm] User data:', data.user);
      console.log('🔑 [SignupForm] Session:', data.session ? 'Created' : 'Pending confirmation');

      if (data.session) {
        // User is immediately signed in
        console.log('💾 [SignupForm] Storing session data');
        localStorage.setItem('auth_session', JSON.stringify(data.session));
        
        // Get the profile that was automatically created
        if (!data.user) {
          setError('User creation failed');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (profile) {
          localStorage.setItem('user_profile', JSON.stringify(profile));
          console.log('👤 [SignupForm] Profile loaded:', profile);
          
          // Dispatch custom event to notify AuthContext of auth state change
          window.dispatchEvent(new CustomEvent('authStateChanged'));
          console.log('📢 [SignupForm] Auth state change event dispatched');
        }
        
        console.log('🔄 [SignupForm] Redirecting to dashboard');
        router.push('/dashboard');
      } else {
        // Email confirmation required
        console.log('📧 [SignupForm] Email confirmation required');
        setError('Please check your email and confirm your account before signing in.');
      }
    } catch (error) {
      console.error('❌ [SignupForm] Registration error occurred:', error);
      console.error('🔍 [SignupForm] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      setError('Network error. Please try again.');
    } finally {
      console.log('🏁 [SignupForm] Registration process completed');
      setIsLoading(false);
    }
  };

  return (
    <div className="card max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
        <p className="text-gray-600">Join thousands of families improving reading skills</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your full name"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="your@email.com"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Account Type
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            <option value="parent">Parent/Guardian</option>
            <option value="child">Child (13+ years)</option>
            <option value="educator">Educator</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {formData.role === 'parent' && 'Manage child profiles and settings'}
            {formData.role === 'child' && 'Own account with parental oversight'}
            {formData.role === 'educator' && 'Classroom and student management'}
          </p>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="At least 6 characters"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirm your password"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <UserPlus className="h-5 w-5" />
              Create Account
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-500 font-medium"
            disabled={isLoading}
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
}