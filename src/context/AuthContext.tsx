'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiPost } from '@/lib/api';

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
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
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
  login: async () => {},
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
    try {
      const savedToken = localStorage.getItem('zen_token');
      const savedUser = localStorage.getItem('zen_user');
      if (savedToken && savedUser) {
        // Restoring browser-persisted authentication necessarily synchronizes
        // external storage with React after hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setToken(savedToken);
        setUser(JSON.parse(savedUser) as User);
      }
    } catch {
      localStorage.removeItem('zen_token');
      localStorage.removeItem('zen_refresh');
      localStorage.removeItem('zen_user');
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiPost<AuthResponse>('/auth/login', { email, password });
    setToken(res.accessToken);
    setUser(res.user);
    localStorage.setItem('zen_token', res.accessToken);
    localStorage.setItem('zen_refresh', res.refreshToken);
    localStorage.setItem('zen_user', JSON.stringify(res.user));
  }, []);

  const register = useCallback(async (data: Record<string, unknown>) => {
    const res = await apiPost<AuthResponse>('/auth/register', data);
    setToken(res.accessToken);
    setUser(res.user);
    localStorage.setItem('zen_token', res.accessToken);
    localStorage.setItem('zen_refresh', res.refreshToken);
    localStorage.setItem('zen_user', JSON.stringify(res.user));
  }, []);

  const logout = useCallback(() => {
    if (token) {
      apiPost('/auth/logout', {}, token).catch(() => {});
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('zen_token');
    localStorage.removeItem('zen_refresh');
    localStorage.removeItem('zen_user');
  }, [token]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((current) => {
      if (!current) return current;
      const updated = { ...current, ...updates };
      localStorage.setItem('zen_user', JSON.stringify(updated));
      return updated;
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
