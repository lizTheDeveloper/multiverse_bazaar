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

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
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

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
    });

    await Promise.all([
      storage.setToken(response.token),
      storage.setUser(response.user),
      storage.remove(GUEST_MODE_KEY),
    ]);

    setIsGuest(false);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
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
        logout,
        continueAsGuest,
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
