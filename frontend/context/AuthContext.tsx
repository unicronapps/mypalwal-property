'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { storeAccessToken, storeRefreshToken, clearTokens, getAccessToken, getRefreshToken, isTokenExpired, decodeToken } from '@/lib/auth';

export type UserRole = 'user' | 'dealer' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        // If access token is still valid, restore from it directly
        const accessToken = getAccessToken();
        if (accessToken && !isTokenExpired(accessToken)) {
          const payload = decodeToken(accessToken);
          if (payload) {
            setUser({ id: payload.sub, name: payload.name ?? '', phone: payload.phone, role: payload.role });
            setIsLoading(false);
            return;
          }
        }

        // Access token expired — try refresh token from localStorage
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          setIsLoading(false);
          return;
        }

        const { data } = await api.post('/api/auth/refresh', { refreshToken });
        storeAccessToken(data.data.accessToken);
        storeRefreshToken(data.data.refreshToken);
        setUser(data.data.user);
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = useCallback((accessToken: string, refreshToken: string, userData: AuthUser) => {
    storeAccessToken(accessToken);
    storeRefreshToken(refreshToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {}
    clearTokens();
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (role: UserRole) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      return user.role === role;
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
  return ctx;
}
