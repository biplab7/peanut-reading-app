'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  role: 'parent' | 'child' | 'educator';
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Function to update auth state from localStorage
  const updateAuthFromStorage = () => {
    console.log('🔄 [AuthContext] Updating auth state from localStorage');
    try {
      const storedSession = localStorage.getItem('auth_session');
      const storedProfile = localStorage.getItem('user_profile');
      
      console.log('📦 [AuthContext] Checking stored session:', !!storedSession);
      console.log('📦 [AuthContext] Checking stored profile:', !!storedProfile);

      if (storedSession && storedProfile) {
        const sessionData = JSON.parse(storedSession);
        const profileData = JSON.parse(storedProfile);
        
        console.log('👤 [AuthContext] Parsed profile data:', profileData);
        console.log('🔑 [AuthContext] Session expires at:', new Date(sessionData.expires_at * 1000));

        // Check if session is still valid
        const now = Date.now() / 1000;
        const isValid = sessionData.expires_at && now < sessionData.expires_at;
        console.log('⏰ [AuthContext] Current time:', new Date(now * 1000));
        console.log('✅ [AuthContext] Session is valid:', isValid);
        
        if (isValid) {
          setSession(sessionData);
          setUser(profileData);
          console.log('🔐 [AuthContext] Auth state updated from localStorage');
          return true;
        } else {
          // Session expired, clear storage
          console.log('⚠️ [AuthContext] Session expired, clearing storage');
          localStorage.removeItem('auth_session');
          localStorage.removeItem('user_profile');
          setSession(null);
          setUser(null);
          return false;
        }
      } else {
        console.log('📭 [AuthContext] No stored auth data found');
        setSession(null);
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('❌ [AuthContext] Failed to update auth from storage:', error);
      localStorage.removeItem('auth_session');
      localStorage.removeItem('user_profile');
      setSession(null);
      setUser(null);
      return false;
    }
  };

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      console.log('🔄 [AuthContext] Initializing auth state from localStorage');
      updateAuthFromStorage();
      setLoading(false);
      console.log('🏁 [AuthContext] Auth initialization completed');
    };

    initAuth();
  }, []);

  // Listen for storage changes (when login happens in another tab or component)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_session' || e.key === 'user_profile') {
        console.log('👂 [AuthContext] localStorage changed, updating auth state');
        updateAuthFromStorage();
      }
    };

    // Listen for custom events when auth state changes in the same tab
    const handleAuthChange = () => {
      console.log('👂 [AuthContext] Auth change event received');
      updateAuthFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('auth_session', JSON.stringify(data.session));
        localStorage.setItem('user_profile', JSON.stringify(data.profile));
        
        setSession(data.session);
        setUser(data.profile);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    console.log('🚪 [AuthContext] Starting logout process');
    
    try {
      // Call backend logout endpoint
      if (session) {
        console.log('🌐 [AuthContext] Calling backend logout endpoint');
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        console.log('✅ [AuthContext] Backend logout completed');
      } else {
        console.log('⚠️ [AuthContext] No active session to logout from backend');
      }
    } catch (error) {
      console.error('❌ [AuthContext] Logout error:', error);
    } finally {
      // Clear local state regardless of backend response
      console.log('🧹 [AuthContext] Clearing local auth state');
      localStorage.removeItem('auth_session');
      localStorage.removeItem('user_profile');
      setSession(null);
      setUser(null);
      console.log('🔄 [AuthContext] Redirecting to auth page');
      router.push('/auth');
      console.log('🏁 [AuthContext] Logout process completed');
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    if (!session?.refresh_token) return false;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('auth_session', JSON.stringify(data.session));
        setSession(data.session);
        return true;
      } else {
        // Refresh failed, logout user
        await logout();
        return false;
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      await logout();
      return false;
    }
  };

  // Auto-refresh session when it's about to expire
  useEffect(() => {
    if (!session) return;

    const checkSession = () => {
      const expiresAt = session.expires_at;
      const now = Date.now() / 1000;
      const timeUntilExpiry = expiresAt - now;

      // Refresh if expires in less than 5 minutes
      if (timeUntilExpiry < 300) {
        refreshSession();
      }
    };

    // Check every minute
    const interval = setInterval(checkSession, 60000);
    return () => clearInterval(interval);
  }, [session]);

  const value: AuthContextType = {
    user,
    session,
    loading,
    login,
    logout,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}