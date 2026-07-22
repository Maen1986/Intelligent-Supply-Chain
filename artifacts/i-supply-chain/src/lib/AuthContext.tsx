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
  login:           (profile: Omit<UserProfile, 'id' | 'role'>) => Promise<void>;
  logout:          () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user:            null,
  isAuthenticated: false,
  loading:         true,
  login:           async () => {},
  logout:          async () => {},
});

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, '').replace('/i-supply-chain', '') + '/api-server/api';

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

  // ── login: POST profile to server, receive session cookie ────────────────
  const login = useCallback(async (profile: Omit<UserProfile, 'id' | 'role'>) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',   // store the returned session cookie
      body: JSON.stringify({
        email:       profile.email,
        fullName:    profile.fullName,
        mobile:      profile.mobile ?? undefined,
        designation: profile.designation ?? undefined,
        company:     profile.company ?? undefined,
      }),
    });

    if (!res.ok) throw new Error('Registration failed — server error');
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? 'Registration failed');

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

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
