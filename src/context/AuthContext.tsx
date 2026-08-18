'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, apiPost, apiPublicPost } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  profilePhotoUrl?: string;
}

interface AuthResponse {
  user: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => { throw new Error('AuthProvider is unavailable'); },
  register: async () => {},
  logout: () => {},
  updateUser: () => {},
  isAuthenticated: false,
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api<User>('/auth/profile', { method: 'GET', allowUnauthenticated: true })
      .then(profile => {
        if (!cancelled) {
          setUser(profile);
          setToken('cookie-session');
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiPublicPost<AuthResponse>('/auth/login', { email, password });
    setToken('cookie-session');
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (data: Record<string, unknown>) => {
    const res = await apiPublicPost<AuthResponse>('/auth/register', data);
    setToken('cookie-session');
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    if (token) {
      apiPost('/auth/logout', {}, token).catch(() => {});
    }
    setToken(null);
    setUser(null);
  }, [token]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((current) => {
      if (!current) return current;
      return { ...current, ...updates };
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
