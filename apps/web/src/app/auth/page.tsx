'use client';

import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import LoginForm from '../../components/auth/LoginForm';
import SignupForm from '../../components/auth/SignupForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Peanut Reading</h1>
          </div>
          <p className="text-gray-600">
            AI-powered reading companion for kids
          </p>
        </div>

        {/* Demo Account Notice */}
        <div className="card bg-gradient-to-r from-green-50 to-blue-50 border-green-200 mb-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-green-800 mb-2">🎯 Try the Demo!</h3>
            <p className="text-green-700 text-sm mb-3">
              Test the full authentication and child management system
            </p>
            <div className="bg-white rounded-lg p-3 text-left text-sm">
              <div className="font-medium text-gray-800 mb-2">Demo Account Credentials:</div>
              <div className="space-y-1 text-gray-600">
                <div><strong>Email:</strong> demo@peanutreading.com</div>
                <div><strong>Password:</strong> demo123</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-green-600">
              ✅ Pre-configured with 2 child profiles • ✅ Sample reading data • ✅ Full feature access
            </div>
          </div>
        </div>

        {/* Auth Forms */}
        {isLogin ? (
          <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
        ) : (
          <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            By signing up, you agree to our{' '}
            <a href="/terms" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}