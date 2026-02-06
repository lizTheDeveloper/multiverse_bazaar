import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { storage } from '../lib/storage';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  karma: number;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const [token, storedUser] = await Promise.all([
        storage.getToken(),
        storage.getUser<User>(),
      ]);

      if (token && storedUser) {
        setUser(storedUser);
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
    ]);

    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    await storage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
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
