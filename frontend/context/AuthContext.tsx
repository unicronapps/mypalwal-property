'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { storeAccessToken, clearAccessToken, decodeToken } from '@/lib/auth';

export type UserRole = 'user' | 'dealer' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string, user: AuthUser) => void;
  logout: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: try to restore session via refresh token cookie
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await api.post('/api/auth/refresh');
        const { accessToken } = data.data;
        storeAccessToken(accessToken);

        const payload = decodeToken(accessToken);
        if (!payload) throw new Error('Invalid token');

        // Fetch full user profile
        // TODO: [PHASE-3] Replace with proper /api/users/me call
        // For now, use token payload
        setUser({
          id: payload.sub,
          name: '',       // will be populated once /users/me exists
          phone: payload.phone,
          email: null,
          role: payload.role,
        });
      } catch {
        // No valid session — user is logged out
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback((accessToken: string, userData: AuthUser) => {
    storeAccessToken(accessToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Still clear local state even if server call fails
    }
    clearAccessToken();
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (role: UserRole) => {
      if (!user) return false;
      if (user.role === 'admin') return true; // admin has all roles
      return user.role === role;
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
  return ctx;
}
