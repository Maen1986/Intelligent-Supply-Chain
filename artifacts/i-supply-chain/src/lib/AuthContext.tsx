import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

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
  updateProfile:   (profile: Pick<UserProfile, 'fullName' | 'mobile' | 'designation' | 'company'>) => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user:            null,
  isAuthenticated: false,
  loading:         true,
  register:        async () => {},
  login:           async () => {},
  logout:          async () => {},
  changePassword:  async () => {},
  updateProfile:   async () => {},
});

import { API_BASE } from '@/lib/apiBase';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Shared helper: call /auth/me and update state ───────────────────────
  const revalidateSession = useCallback(async (opts?: { setLoadingTrue?: boolean }) => {
    if (opts?.setLoadingTrue) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include',   // send the httpOnly session cookie
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.ok && data.user ? data.user : null);
      } else {
        setUser(null);
      }
    } catch {
      // Network error — keep existing state, don't clear the user
    } finally {
      setLoading(false);
    }
  }, []);

  // ── On mount: validate session server-side ───────────────────────────────
  // This is the key security fix: we ask the SERVER whether this browser
  // has a valid session cookie. localStorage cannot fake this response.
  useEffect(() => {
    revalidateSession({ setLoadingTrue: false });
  }, [revalidateSession]);

  // ── Throttle: track when the last visibility-triggered check ran ──────────
  // Initialised to 0 so the very first visibilitychange always fires.
  // The mount-time check does NOT update this ref — only the handler below
  // does — so a cross-tab login seen right after page load still works.
  const lastVisibilityCheckRef = useRef<number>(0);

  // ── Cross-tab login: re-validate when this tab regains visibility ─────────
  // If the user logs in on another tab, their session cookie is now valid.
  // When they switch back here, the visibilitychange event lets us pick up
  // the new session without requiring a full page reload.
  // A 30-second throttle prevents a flood of round-trips when the user
  // rapidly switches between many tabs.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastVisibilityCheckRef.current < 30_000) return;
        lastVisibilityCheckRef.current = now;
        revalidateSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [revalidateSession]);

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
    if (!res.ok || !data?.ok) {
      const err = new Error(data?.error ?? 'Registration failed — server error');
      if (res.status === 429 && typeof data?.retryAfterSeconds === 'number') {
        (err as any).retryAfterSeconds = data.retryAfterSeconds;
      }
      throw err;
    }

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
    // Wipe all pending AI-plan flags so they cannot be consumed by the next
    // user who signs in on the same tab (guaranteed cleanup at the logout
    // boundary, regardless of which hook instances are currently mounted).
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('pendingAIPlan_')) {
        sessionStorage.removeItem(key);
      }
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

  // ── updateProfile: update name, mobile, designation, company server-side ──
  const updateProfile = useCallback(async (profile: Pick<UserProfile, 'fullName' | 'mobile' | 'designation' | 'company'>) => {
    const res = await fetch(`${API_BASE}/auth/update-profile`, {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(profile),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) throw new Error(data?.error ?? 'Could not update profile.');
    // Refresh local state so the Header and other consumers reflect new values
    if (data.user) setUser(data.user);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, register, login, logout, changePassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
