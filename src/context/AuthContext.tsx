import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isVip: boolean;
  login: (phone: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { phone: string; username: string; password: string; securityQuestion?: string; securityAnswer?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updated: Partial<UserProfile>) => void;
  refreshUser: () => Promise<void>;
  loginDemoAdmin: () => Promise<void>;
  loginDemoUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('sureodd_token'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Token invalid
        setToken(null);
        setUser(null);
        localStorage.removeItem('sureodd_token');
      }
    } catch (_err) {
      console.error('Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (phone: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('sureodd_token', data.token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Network error during login' };
    }
  };

  const register = async (formData: { phone: string; username: string; password: string; securityQuestion?: string; securityAnswer?: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('sureodd_token', data.token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Network error during registration' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sureodd_token');
  };

  const updateUser = (updated: Partial<UserProfile>) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };

  const refreshUser = async () => {
    if (token) {
      await fetchProfile(token);
    }
  };

  const loginDemoAdmin = async () => {
    await login('+2348000000000', 'admin123');
  };

  const loginDemoUser = async () => {
    await login('+2348123456789', 'user1234');
  };

  const isAdmin = user?.role === 'admin';
  const isVip = Boolean(user?.isVip) || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        isVip,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        loginDemoAdmin,
        loginDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
