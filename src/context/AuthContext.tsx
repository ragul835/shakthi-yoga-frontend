'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiPost } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
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
  googleLogin: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  googleLogin: async () => {},
  logout: () => {},
  isAuthenticated: false,
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('zen_token');
    const savedUser = localStorage.getItem('zen_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
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

  const googleLogin = useCallback(async () => {
    const fakeUser = {
      id: 'google-user-1',
      name: 'Google User',
      email: 'user@gmail.com',
      role: 'STUDENT',
      profilePhotoUrl: 'https://ui-avatars.com/api/?name=Google+User&background=4285F4&color=fff'
    };
    const fakeToken = 'mock-google-jwt-token';
    setToken(fakeToken);
    setUser(fakeUser);
    localStorage.setItem('zen_token', fakeToken);
    localStorage.setItem('zen_refresh', fakeToken);
    localStorage.setItem('zen_user', JSON.stringify(fakeUser));
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

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
