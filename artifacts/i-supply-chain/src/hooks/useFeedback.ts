import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';

import { API_BASE } from '@/lib/apiBase';

export interface FeedbackEntry {
  id: number;
  tool: string;
  rating: number;
  nps: number | null;
  comment: string | null;
  sentiment: string | null;
  company: string | null;
  submissionId: number | null;
  createdAt: string;
}

export interface FeedbackAnalytics {
  ok: boolean;
  total: number;
  averageRating: number | null;
  npsBreakdown: { promoters: number; passives: number; detractors: number };
  ratingDistribution: { rating: number; count: number }[];
  byTool: { tool: string; count: number; averageRating: number }[];
  weeklyTrend: { weekStart: string; count: number }[];
  topKeywords: { word: string; count: number }[];
}

export interface FeedbackListFilters {
  tool?: string;
  from?: string;
  to?: string;
  minRating?: number;
  page?: number;
  perPage?: number;
}

export interface FeedbackListResponse {
  ok: boolean;
  feedback: FeedbackEntry[];
  page: number;
  perPage: number;
  count: number;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export function useIsAdmin(): boolean {
  const { user } = useAuth();
  return user?.role === 'admin';
}

export interface FeedbackAnalyticsFilters {
  tool?: string;
  from?: string;
  to?: string;
}

export function useFeedbackAnalytics(filters: FeedbackAnalyticsFilters = {}) {
  const isAdmin = useIsAdmin();
  const params = new URLSearchParams();
  if (filters.tool) params.set('tool', filters.tool);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  const qs = params.toString();
  return useQuery<FeedbackAnalytics>({
    queryKey: ['feedback-analytics', filters],
    enabled: isAdmin,
    queryFn: () => fetchJson<FeedbackAnalytics>(`${API_BASE}/feedback/analytics${qs ? `?${qs}` : ''}`),
    staleTime: 60_000,
  });
}

export function useFeedbackList(filters: FeedbackListFilters) {
  const isAdmin = useIsAdmin();
  const params = new URLSearchParams();
  if (filters.tool) params.set('tool', filters.tool);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.minRating) params.set('min_rating', String(filters.minRating));
  params.set('page', String(filters.page ?? 1));
  params.set('per_page', String(filters.perPage ?? 20));

  return useQuery<FeedbackListResponse>({
    queryKey: ['feedback-list', filters],
    enabled: isAdmin,
    queryFn: () => fetchJson<FeedbackListResponse>(`${API_BASE}/feedback?${params.toString()}`),
    staleTime: 30_000,
  });
}

export interface SubmitFeedbackResult {
  ok: boolean;
  /** True when the server responded 429 (rate limited). */
  rateLimited: boolean;
  /** Seconds until the rate-limit window resets (0 when not rate-limited). */
  retryAfter: number;
}

export async function submitFeedback(payload: {
  tool: string;
  rating: number;
  nps?: number;
  comment?: string;
  company?: string;
  submissionId?: number;
}): Promise<SubmitFeedbackResult> {
  try {
    const res = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (res.ok) return { ok: true, rateLimited: false, retryAfter: 0 };
    if (res.status === 429) {
      // Prefer the Retry-After header; fall back to JSON body; default 1 hour.
      let seconds = Number(res.headers?.get?.('Retry-After'));
      if (!Number.isFinite(seconds) || seconds <= 0) {
        const body = await res.json().catch(() => null);
        seconds = Number(body?.retryAfterSeconds) || 3600;
      }
      return { ok: false, rateLimited: true, retryAfter: seconds };
    }
    return { ok: false, rateLimited: false, retryAfter: 0 };
  } catch {
    return { ok: false, rateLimited: false, retryAfter: 0 };
  }
}
