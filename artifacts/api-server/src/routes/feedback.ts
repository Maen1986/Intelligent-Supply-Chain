import { Router } from 'express';
import { db, feedbackTable } from '@workspace/db';
import { desc, eq, gte, lte, and, type SQL } from 'drizzle-orm';
import { FeedbackCreateSchema } from '@workspace/api-zod';
import { logger } from '../lib/logger';
import { feedbackRateLimiter, getFeedbackRateLimitStatus } from '../lib/rateLimit';

const router = Router();

/* Admin guard: feedback contains free-text comments and company names, so
   only an authenticated admin session may read it. Submission is public. */
const requireAdmin: import('express').RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    res.status(401).json({ ok: false, error: 'Authentication required' });
    return;
  }
  if (req.session.userRole !== 'admin') {
    res.status(403).json({ ok: false, error: 'Admin access required' });
    return;
  }
  next();
};

/* ── POST /api/feedback ──────────────────────────────────────────────────────
   Public endpoint: visitors submit structured feedback after using a tool.
   Rate-limited to 5 per IP per hour; Zod-validated. Returns 201.             */
router.post('/', feedbackRateLimiter, async (req, res) => {
  const parsed = FeedbackCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'Invalid feedback data' });
    return;
  }
  const data = parsed.data;
  try {
    const [row] = await db
      .insert(feedbackTable)
      .values({
        tool:         data.tool,
        rating:       data.rating,
        nps:          data.nps ?? null,
        comment:      data.comment ?? null,
        sentiment:    data.sentiment ?? null,
        company:      data.company ?? null,
        submissionId: data.submissionId ?? null,
      })
      .returning();
    logger.info({ feedbackId: row.id, tool: data.tool, rating: data.rating }, '[feedback] Saved');
    res.status(201).json({ ok: true, id: row.id });
  } catch (err) {
    logger.error({ err, tool: data.tool }, '[feedback] Save failed');
    res.status(500).json({ ok: false, error: 'Failed to save feedback' });
  }
});

/* ── GET /api/feedback/rate-limit ──
 * Read-only rate-limit status for the caller's IP; does NOT consume quota.
 * The frontend uses it to keep its retry countdown honest even when the
 * visitor's device clock drifts (e.g. after laptop sleep/wake). */
router.get('/rate-limit', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  return res.json(await getFeedbackRateLimitStatus(req));
});

/* ── GET /api/feedback ───────────────────────────────────────────────────────
   Admin-only. Query params: tool, from, to (ISO dates), min_rating,
   page (1-based), per_page (default 50, max 200). Newest first.              */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { tool, from, to, min_rating } = req.query as Record<string, string | undefined>;
    const page    = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const perPage = Math.min(200, Math.max(1, parseInt(String(req.query.per_page ?? '50'), 10) || 50));

    const conditions: SQL[] = [];
    if (tool) conditions.push(eq(feedbackTable.tool, tool));
    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) conditions.push(gte(feedbackTable.createdAt, d));
    }
    if (to) {
      const d = new Date(to);
      if (!Number.isNaN(d.getTime())) conditions.push(lte(feedbackTable.createdAt, d));
    }
    if (min_rating) {
      const r = parseInt(min_rating, 10);
      if (!Number.isNaN(r)) conditions.push(gte(feedbackTable.rating, r));
    }

    const base = db.select().from(feedbackTable);
    const filtered = conditions.length ? base.where(and(...conditions)) : base;
    const rows = await filtered
      .orderBy(desc(feedbackTable.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage);

    res.json({ ok: true, feedback: rows, page, perPage, count: rows.length });
  } catch (err) {
    logger.error({ err }, '[feedback] List failed');
    res.status(500).json({ ok: false, error: 'Failed to fetch feedback' });
  }
});

/* ── Keyword extraction: simple word-frequency over comments ─────────────────
   (No AI — tokenise, drop stop-words + short tokens, top 20 by count.)       */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'at', 'by',
  'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
  'on', 'off', 'over', 'under', 'again', 'further', 'once', 'here', 'there',
  'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can',
  'will', 'just', 'should', 'now', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'would',
  'could', 'ought', 'i', 'im', 'me', 'my', 'we', 'our', 'you', 'your', 'he',
  'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what',
  'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'as', 'of', 'because',
  'while', 'how', 'why', 'where', 'also', 'get', 'got', 'much', 'many', 'really',
  'like', 'thing', 'things', 'lot', 'bit', 'quite', 'still', 'even', 'us', 'dont',
  'didnt', 'cant', 'wont', 'ive', 'id', 'itd', 'youre', 'theyre', 'wasnt',
]);

export function extractTopKeywords(comments: string[], limit = 20): { word: string; count: number }[] {
  const freq = new Map<string, number>();
  for (const comment of comments) {
    const tokens = comment
      .toLowerCase()
      .replace(/['’]/g, '')
      .split(/[^a-z\u0600-\u06FF0-9]+/) // latin + arabic word chars
      .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
    for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

/* ── GET /api/feedback/analytics ─────────────────────────────────────────────
   Admin-only aggregated stats for the Customer Voice dashboard.              */
router.get('/analytics', requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select({
        tool:      feedbackTable.tool,
        rating:    feedbackTable.rating,
        nps:       feedbackTable.nps,
        comment:   feedbackTable.comment,
        createdAt: feedbackTable.createdAt,
      })
      .from(feedbackTable);

    const total = rows.length;
    const averageRating = total
      ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / total) * 100) / 100
      : null;

    // NPS: promoters 9–10, passives 7–8, detractors 0–6 (null nps excluded)
    const npsBreakdown = { promoters: 0, passives: 0, detractors: 0 };
    for (const r of rows) {
      if (r.nps == null) continue;
      if (r.nps >= 9) npsBreakdown.promoters++;
      else if (r.nps >= 7) npsBreakdown.passives++;
      else npsBreakdown.detractors++;
    }

    // Per-tool breakdown: count + average rating
    const toolMap = new Map<string, { count: number; sum: number }>();
    for (const r of rows) {
      const t = toolMap.get(r.tool) ?? { count: 0, sum: 0 };
      t.count++;
      t.sum += r.rating;
      toolMap.set(r.tool, t);
    }
    const byTool = [...toolMap.entries()]
      .map(([tool, { count, sum }]) => ({
        tool,
        count,
        averageRating: Math.round((sum / count) * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count);

    // Weekly trend: entries per week for the last 8 weeks (oldest first).
    // Buckets are 7-day windows ending "now".
    const now = Date.now();
    const WEEK = 7 * 24 * 60 * 60 * 1000;
    const weeklyTrend = Array.from({ length: 8 }, (_, i) => {
      const start = now - (8 - i) * WEEK;
      const end   = start + WEEK; // bucket i=7 ends at "now"
      return {
        weekStart: new Date(start).toISOString().slice(0, 10),
        count: rows.filter((r) => {
          const t = new Date(r.createdAt).getTime();
          return t >= start && t < end;
        }).length,
      };
    });

    const topKeywords = extractTopKeywords(
      rows.map((r) => r.comment).filter((c): c is string => Boolean(c)),
    );

    res.json({
      ok: true,
      total,
      averageRating,
      npsBreakdown,
      byTool,
      weeklyTrend,
      topKeywords,
    });
  } catch (err) {
    logger.error({ err }, '[feedback] Analytics failed');
    res.status(500).json({ ok: false, error: 'Failed to compute analytics' });
  }
});

export default router;
