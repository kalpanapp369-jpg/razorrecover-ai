import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/database.types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (payload: { email: string; password: string; fullName: string; role: UserRole; company?: string }) => Promise<User>;
  googleLogin: (payload: { email: string; fullName?: string; avatarUrl?: string; googleId?: string; role?: UserRole; company?: string }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('razorrecover_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('razorrecover_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkSession = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        if (res.success && res.user) {
          setUser(res.user);
          localStorage.setItem('razorrecover_user', JSON.stringify(res.user));
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session verification fallback to stored session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [token]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.login({ email, password });
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('razorrecover_token', res.token);
      localStorage.setItem('razorrecover_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error('Invalid login response');
  };

  const signup = async (payload: { email: string; password: string; fullName: string; role: UserRole; company?: string }): Promise<User> => {
    const res = await api.signup(payload);
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('razorrecover_token', res.token);
      localStorage.setItem('razorrecover_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error('Invalid signup response');
  };

  const googleLogin = async (payload: { email: string; fullName?: string; avatarUrl?: string; googleId?: string; role?: UserRole; company?: string }): Promise<User> => {
    const res = await api.googleLogin(payload);
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('razorrecover_token', res.token);
      localStorage.setItem('razorrecover_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error('Invalid Google authentication response');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('razorrecover_token');
    localStorage.removeItem('razorrecover_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        signup,
        googleLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
