import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db, appCacheTable } from '@workspace/db';
import { z } from 'zod';
import { OPENAI_MODEL, friendlyAIError } from '../lib/aiConfig';
import { requireAdmin } from '../middlewares/requireAdmin';

const router = Router();

const newsItemSchema = z.object({
  category: z.string().min(1),
  date: z.string().min(1),
  headline: z.string().min(1),
  summary: z.string().min(1),
  impact: z.string().min(1),
  impactColor: z.string().min(1),
  iconName: z.string().min(1),
});

const toolItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  desc: z.string().min(1),
  bestFor: z.string().min(1),
  badge: z.string().min(1),
  badgeColor: z.string().min(1),
  rating: z.string().min(1),
  logo: z.string().min(1),
});

const processItemSchema = z.object({
  iconName: z.string().min(1),
  title: z.string().min(1),
  tag: z.string().min(1),
  tagColor: z.string().min(1),
  desc: z.string().min(1),
  steps: z.array(z.string().min(1)).length(4),
});

const tipItemSchema = z.object({
  number: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  tag: z.string().min(1),
});

export const intelligenceContentSchema = z.object({
  news: z.array(newsItemSchema).length(6),
  tools: z.array(toolItemSchema).length(6),
  processes: z.array(processItemSchema).length(6),
  tips: z.array(tipItemSchema).length(8),
});

const CACHE_KEY = 'intelligence';

/* Refresh proactively once the cache is older than this (before the 7-day hard expiry). */
const REFRESH_AFTER_MS = 6 * 24 * 60 * 60 * 1000;

interface CacheEntry {
  data: Record<string, unknown>;
  ageMs: number;
}

/* Read any schema-valid cache regardless of age; caller decides how to treat staleness.
 * Stored in Postgres so the cache survives restarts and redeploys (the
 * container filesystem is ephemeral on Replit deployments). */
async function readCacheEntry(): Promise<CacheEntry | null> {
  try {
    const [row] = await db
      .select()
      .from(appCacheTable)
      .where(eq(appCacheTable.key, CACHE_KEY))
      .limit(1);
    if (!row) return null;
    const data = row.value as { generatedAt?: string };
    if (!data || typeof data !== 'object' || !data.generatedAt) return null;
    const parsed = intelligenceContentSchema.safeParse(data);
    if (!parsed.success) {
      console.warn('[intelligence] cached content failed schema validation — regenerating');
      return null;
    }
    return { data: data as Record<string, unknown>, ageMs: Date.now() - new Date(data.generatedAt).getTime() };
  } catch (e) {
    console.error('[intelligence] cache read failed', e);
    return null;
  }
}

async function writeCache(data: Record<string, unknown>): Promise<void> {
  try {
    const generatedAt = new Date((data as { generatedAt: string }).generatedAt);
    await db
      .insert(appCacheTable)
      .values({ key: CACHE_KEY, value: data, generatedAt })
      .onConflictDoUpdate({
        target: appCacheTable.key,
        set: { value: data, generatedAt },
      });
  } catch (e) {
    console.error('[intelligence] cache write failed', e);
  }
}

async function generateContent(): Promise<Record<string, unknown>> {
  try {
    return await generateContentOnce();
  } catch (err) {
    if (err instanceof ContentValidationError) {
      console.warn('[intelligence] AI content malformed, retrying once', err.message);
      return await generateContentOnce(err.correctionHint);
    }
    throw err;
  }
}

async function generateContentOnce(correctionHint?: string): Promise<Record<string, unknown>> {
  const baseUrl = process.env['AI_INTEGRATIONS_OPENAI_BASE_URL'];
  const apiKey = process.env['AI_INTEGRATIONS_OPENAI_API_KEY'];
  if (!baseUrl || !apiKey) throw new Error('OpenAI env vars not configured');

  const today = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const basePrompt = `You are a senior procurement and supply chain expert curating weekly intelligence for I Supply Chain (ISC) — a GCC consultancy led by Ma'in Alhaqash MCIPS CPSM MSc. Generate fresh content for ${today} relevant to Saudi Arabia, Jordan, and the broader GCC. Return ONLY valid JSON matching this exact schema — no markdown, no code fences:

{
  "news": [
    {
      "category": "string — one of: AI & Technology | GCC Policy | Regulatory | Market Intelligence | Digital Tools | Sustainability",
      "date": "string — month and year e.g. July 2026",
      "headline": "string — specific realistic headline, 12-18 words",
      "summary": "string — 3-4 sentences with specific data points, CIPS/APICS/ISO/Vision2030 context where relevant",
      "impact": "string — one of: High Impact | Critical for KSA | Regulatory Alert | Strategic | Tool Update | Compliance Alert",
      "impactColor": "string — one of: bg-red-100 text-red-700 | bg-green-100 text-green-700 | bg-orange-100 text-orange-700 | bg-blue-100 text-blue-700 | bg-purple-100 text-purple-700 | bg-emerald-100 text-emerald-700",
      "iconName": "string — one of: Cpu | Globe | Lock | TrendingUp | Zap | Leaf"
    }
  ],
  "tools": [
    {
      "name": "string — tool name",
      "category": "string — tool category",
      "desc": "string — 3-4 sentences covering key features, AI capabilities, GCC/Saudi relevance",
      "bestFor": "string — sectors or company sizes e.g. Enterprise · Government",
      "badge": "string — short label e.g. AI-Native",
      "badgeColor": "string — one of: bg-blue-100 text-blue-700 | bg-purple-100 text-purple-700 | bg-orange-100 text-orange-700 | bg-cyan-100 text-cyan-700 | bg-violet-100 text-violet-700 | bg-yellow-100 text-yellow-700",
      "rating": "string — e.g. Gartner Leader 2026",
      "logo": "string — single relevant emoji"
    }
  ],
  "processes": [
    {
      "iconName": "string — one of: Cpu | BarChart3 | GitBranch | Leaf | Shield | Radio",
      "title": "string — process innovation name",
      "tag": "string — short label e.g. 2026 Trend | Best Practice | Resilience | ESG | Risk | Emerging",
      "tagColor": "string — one of: bg-blue-100 text-blue-700 | bg-green-100 text-green-700 | bg-red-100 text-red-700 | bg-emerald-100 text-emerald-700 | bg-orange-100 text-orange-700 | bg-purple-100 text-purple-700",
      "desc": "string — 3-4 sentences explaining the innovation, its business impact, and GCC adoption context",
      "steps": ["string", "string", "string", "string"]
    }
  ],
  "tips": [
    {
      "number": "string — 01 through 08",
      "title": "string — bold actionable principle starting with a verb, 8-12 words",
      "body": "string — 4-6 sentences drawing on CIPS/CPSM/APICS/ISO frameworks, specific percentages and benchmarks",
      "tag": "string — category label"
    }
  ]
}

Rules:
- news: exactly 6 items
- tools: exactly 6 items (mix of established and emerging platforms; at least 1 GCC-relevant)
- processes: exactly 6 items
- tips: exactly 8 items (numbered 01–08)
- All content must be fresh and distinct — no generic filler
- GCC/Saudi/Vision2030 context where relevant
- Ground in professional standards: CIPS, CPSM, APICS SCOR, ISO, IACCM, CSCMP`;

  const prompt = correctionHint
    ? `${basePrompt}

IMPORTANT — your previous output was rejected for the following reason(s):
${correctionHint}
Fix these issues and return ONLY valid JSON matching the schema above.`
    : basePrompt;

  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_completion_tokens: 16000,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI API ${resp.status}: ${err}`);
  }

  const json = await resp.json() as { choices: { message: { content: string } }[] };
  let content: unknown;
  try {
    content = JSON.parse(json.choices[0].message.content);
  } catch (e) {
    throw new ContentValidationError('AI returned invalid JSON', 'The output was not valid JSON (it failed to parse).');
  }

  const parsed = intelligenceContentSchema.safeParse(content);
  if (!parsed.success) {
    const topIssues = parsed.error.issues.slice(0, 5);
    console.error('[intelligence] AI content failed schema validation', topIssues);
    const hint = topIssues
      .map((i) => `- ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new ContentValidationError('AI returned content in an unexpected shape', hint);
  }

  return {
    generatedAt: new Date().toISOString(),
    ...parsed.data,
  };
}

export class ContentValidationError extends Error {
  constructor(message: string, public readonly correctionHint: string) {
    super(message);
  }
}

/* Single-flight background refresh: never let two generations run concurrently. */
let refreshInFlight: Promise<void> | null = null;

function refreshInBackground(reason: string): Promise<void> {
  if (refreshInFlight) return refreshInFlight;
  console.log(`[intelligence] background refresh started (${reason})`);
  refreshInFlight = (async () => {
    try {
      const content = await generateContent();
      await writeCache(content);
      console.log('[intelligence] background refresh succeeded');
    } catch (err) {
      // Keep serving the old cache; just log the failure.
      console.error('[intelligence] background refresh failed — keeping existing cache', err);
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

/* Proactive timer: check hourly and regenerate before the 7-day window lapses. */
const REFRESH_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const refreshTimer = setInterval(() => {
  void (async () => {
    const entry = await readCacheEntry();
    if (entry && entry.ageMs < REFRESH_AFTER_MS) return;
    void refreshInBackground(entry ? 'scheduled: cache nearing expiry' : 'scheduled: no valid cache');
  })().catch((err) => console.error('[intelligence] scheduled refresh check failed', err));
}, REFRESH_CHECK_INTERVAL_MS);
refreshTimer.unref?.();

/* GET /api/intelligence — serve cache instantly; refresh in the background when stale */
router.get('/intelligence', async (_req, res) => {
  try {
    const entry = await readCacheEntry();
    if (entry) {
      if (entry.ageMs >= REFRESH_AFTER_MS) {
        // Stale-while-revalidate: serve the old cache, refresh in the background.
        void refreshInBackground('stale-while-revalidate');
        res.setHeader('X-Cache', 'STALE');
      } else {
        res.setHeader('X-Cache', 'HIT');
      }
      return res.json(entry.data);
    }

    // No usable cache at all — the visitor has to wait for this one generation.
    res.setHeader('X-Cache', 'MISS');
    const content = await generateContent();
    await writeCache(content);
    return res.json(content);
  } catch (err) {
    console.error('[intelligence] GET failed', err);
    if (err instanceof ContentValidationError) {
      return res.status(502).json({ error: 'The intelligence feed could not be refreshed right now. Please try again shortly.' });
    }
    const { message, status } = friendlyAIError(err);
    return res.status(status).json({ error: message });
  }
});

/* POST /api/intelligence/refresh — force regeneration (bypass cache).
   Each call costs AI credits, so only an authenticated admin may trigger it. */
router.post('/intelligence/refresh', requireAdmin, async (_req, res) => {
  try {
    const content = await generateContent();
    await writeCache(content);
    return res.json({ success: true, generatedAt: (content as { generatedAt: string }).generatedAt });
  } catch (err) {
    console.error('[intelligence] refresh failed', err);
    if (err instanceof ContentValidationError) {
      return res.status(502).json({ error: 'The intelligence feed could not be refreshed right now. Please try again shortly.' });
    }
    const { message, status } = friendlyAIError(err);
    return res.status(status).json({ error: message });
  }
});

export default router;
