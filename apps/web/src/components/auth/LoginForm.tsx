'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export default function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 [LoginForm] Starting login process');
    console.log('📧 [LoginForm] Email:', email);
    
    setIsLoading(true);
    setError('');

    try {
      console.log('🌐 [LoginForm] Making Supabase Auth signin call');
      const requestData = { email, password: '***' }; // Don't log actual password
      console.log('📤 [LoginForm] Request data:', requestData);

      const startTime = Date.now();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      const requestTime = Date.now() - startTime;
      console.log(`⏱️ [LoginForm] Supabase signin completed in ${requestTime}ms`);

      if (error) {
        console.error('❌ [LoginForm] Supabase signin error:', error);
        setError(error.message || 'Login failed');
        return;
      }

      console.log('✅ [LoginForm] Login successful!');
      console.log('👤 [LoginForm] User data:', data.user);
      console.log('🔑 [LoginForm] Session expires at:', new Date((data.session?.expires_at || 0) * 1000));
      
      // Get the user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      console.log('👤 [LoginForm] User profile:', profile);
      
      // Store auth session
      localStorage.setItem('auth_session', JSON.stringify(data.session));
      localStorage.setItem('user_profile', JSON.stringify(profile));
      console.log('💾 [LoginForm] Auth data stored in localStorage');
      
      // Dispatch custom event to notify AuthContext of auth state change
      window.dispatchEvent(new CustomEvent('authStateChanged'));
      console.log('📢 [LoginForm] Auth state change event dispatched');
      
      // Redirect to dashboard
      console.log('🔄 [LoginForm] Redirecting to dashboard');
      router.push('/dashboard');
    } catch (error) {
      console.error('❌ [LoginForm] Login error occurred:', error);
      console.error('🔍 [LoginForm] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      setError('Network error. Please try again.');
    } finally {
      console.log('🏁 [LoginForm] Login process completed');
      setIsLoading(false);
    }
  };

  return (
    <div className="card max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
        <p className="text-gray-600">Sign in to continue your reading journey</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="your@email.com"
              required
              disabled={isLoading}
            />
          </div>
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
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your password"
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

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <LogIn className="h-5 w-5" />
              Sign In
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToSignup}
            className="text-blue-600 hover:text-blue-500 font-medium"
            disabled={isLoading}
          >
            Sign up here
          </button>
        </p>
      </div>
    </div>
  );
}