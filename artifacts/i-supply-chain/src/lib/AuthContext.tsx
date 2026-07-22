import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface UserProfile {
  id:          number;
  fullName:    string;
  email:       string;
  mobile:      string | null;
  designation: string | null;
  company:     string | null;
  role:        string;
}

interface AuthState {
  user:            UserProfile | null;
  isAuthenticated: boolean;
  loading:         boolean;
  register:        (profile: Omit<UserProfile, 'id' | 'role'> & { password: string }) => Promise<void>;
  login:           (email: string, password: string) => Promise<void>;
  logout:          () => Promise<void>;
  changePassword:  (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user:            null,
  isAuthenticated: false,
  loading:         true,
  register:        async () => {},
  login:           async () => {},
  logout:          async () => {},
  changePassword:  async () => {},
});

import { API_BASE } from '@/lib/apiBase';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── On mount: validate session server-side ───────────────────────────────
  // This is the key security fix: we ask the SERVER whether this browser
  // has a valid session cookie. localStorage cannot fake this response.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: 'include',   // send the httpOnly session cookie
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.user) setUser(data.user);
        }
      } catch {
        // Network error — not authenticated, just carry on
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── register: create account server-side (password hashed there),
  //    receive session cookie ────────────────────────────────────────────────
  const register = useCallback(async (profile: Omit<UserProfile, 'id' | 'role'> & { password: string }) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',   // store the returned session cookie
      body: JSON.stringify({
        email:       profile.email,
        fullName:    profile.fullName,
        password:    profile.password,
        mobile:      profile.mobile ?? undefined,
        designation: profile.designation ?? undefined,
        company:     profile.company ?? undefined,
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) throw new Error(data?.error ?? 'Registration failed — server error');

    setUser(data.user);
  }, []);

  // ── login: verify credentials server-side, receive session cookie ────────
  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) throw new Error(data?.error ?? 'Invalid email or password.');

    setUser(data.user);
  }, []);

  // ── logout: destroy session server-side, then clear local state ──────────
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method:      'POST',
        credentials: 'include',
      });
    } catch {
      // Best-effort
    }
    setUser(null);
  }, []);

  // ── changePassword: verify current password, set new one server-side ─────
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) throw new Error(data?.error ?? 'Could not update the password.');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, register, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
