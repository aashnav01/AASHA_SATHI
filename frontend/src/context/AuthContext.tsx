import React, { createContext, useContext, useState, useCallback } from 'react';
import { loginAsha, registerAsha, type AuthUser } from '../services/api';

const AUTH_STORAGE_KEY = 'asha_sathi_auth';

interface StoredAuth {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (mobile: string, pin: string) => Promise<void>;
  register: (name: string, mobile: string, pin: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredAuth()?.user ?? null);

  const persist = useCallback((auth: StoredAuth) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    setUser(auth.user);
  }, []);

  const login = useCallback(async (mobile: string, pin: string) => {
    const auth = await loginAsha(mobile, pin);
    persist(auth);
  }, [persist]);

  const register = useCallback(async (name: string, mobile: string, pin: string) => {
    const auth = await registerAsha(name, mobile, pin);
    persist(auth);
  }, [persist]);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
