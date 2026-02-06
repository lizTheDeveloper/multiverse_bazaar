import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { storage } from '../lib/storage';
import { api } from '../lib/api';

const GUEST_MODE_KEY = 'guest_mode';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  karma: number;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface MagicLinkResponse {
  message: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  requestMagicLink: (email: string) => Promise<void>;
  verifyMagicLink: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  requireAuth: () => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const [token, storedUser, guestMode] = await Promise.all([
        storage.getToken(),
        storage.getUser<User>(),
        storage.get(GUEST_MODE_KEY),
      ]);

      if (token && storedUser) {
        setUser(storedUser);
      } else if (guestMode === 'true') {
        setIsGuest(true);
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const saveAuthData = async (response: AuthResponse) => {
    await Promise.all([
      storage.setToken(response.accessToken),
      storage.setRefreshToken(response.refreshToken),
      storage.setUser(response.user),
      storage.remove(GUEST_MODE_KEY),
    ]);
    setIsGuest(false);
    setUser(response.user);
  };

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    await saveAuthData(response);
  }, []);

  const requestMagicLink = useCallback(async (email: string) => {
    await api.post<MagicLinkResponse>('/auth/magic-link', { email });
  }, []);

  const verifyMagicLink = useCallback(async (token: string) => {
    const response = await api.post<AuthResponse>('/auth/magic-link/verify', { token });
    await saveAuthData(response);
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await api.post<AuthResponse>('/auth/refresh', {
        refreshToken,
      });

      await Promise.all([
        storage.setToken(response.accessToken),
        storage.setRefreshToken(response.refreshToken),
        storage.setUser(response.user),
      ]);

      setUser(response.user);
      return true;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      await storage.clear();
      setUser(null);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout API errors, still clear local state
      console.error('Logout API error:', error);
    }
    await storage.clear();
    setUser(null);
    setIsGuest(false);
  }, []);

  const continueAsGuest = useCallback(async () => {
    await storage.set(GUEST_MODE_KEY, 'true');
    setIsGuest(true);
  }, []);

  const requireAuth = useCallback(() => {
    return !!user;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isGuest,
        isLoading,
        login,
        requestMagicLink,
        verifyMagicLink,
        logout,
        continueAsGuest,
        refreshSession,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
