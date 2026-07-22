import { Router } from 'express';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const router = Router();

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_DIR = join(process.cwd(), 'cache');
const CACHE_FILE = join(CACHE_DIR, 'intelligence.json');

function readCache(): Record<string, unknown> | null {
  try {
    if (existsSync(CACHE_FILE)) {
      const raw = readFileSync(CACHE_FILE, 'utf8');
      const data = JSON.parse(raw) as { generatedAt?: string };
      if (data.generatedAt && Date.now() - new Date(data.generatedAt).getTime() < SEVEN_DAYS_MS) {
        return data as Record<string, unknown>;
      }
    }
  } catch (_) { /* stale or corrupt — regenerate */ }
  return null;
}

function writeCache(data: Record<string, unknown>): void {
  try {
    if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[intelligence] cache write failed', e);
  }
}

async function generateContent(): Promise<Record<string, unknown>> {
  const baseUrl = process.env['AI_INTEGRATIONS_OPENAI_BASE_URL'];
  const apiKey = process.env['AI_INTEGRATIONS_OPENAI_API_KEY'];
  if (!baseUrl || !apiKey) throw new Error('OpenAI env vars not configured');

  const today = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const prompt = `You are a senior procurement and supply chain expert curating weekly intelligence for I Supply Chain (ISC) — a GCC consultancy led by Ma'in Alhaqash MCIPS CPSM MSc. Generate fresh content for ${today} relevant to Saudi Arabia, Jordan, and the broader GCC. Return ONLY valid JSON matching this exact schema — no markdown, no code fences:

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

  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5',
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
  const content = JSON.parse(json.choices[0].message.content) as Record<string, unknown>;

  return {
    generatedAt: new Date().toISOString(),
    ...content,
  };
}

/* GET /api/intelligence — return cached or freshly generated content */
router.get('/intelligence', async (_req, res) => {
  try {
    const cached = readCache();
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    res.setHeader('X-Cache', 'MISS');
    const content = await generateContent();
    writeCache(content);
    return res.json(content);
  } catch (err) {
    console.error('[intelligence] GET failed', err);
    return res.status(500).json({ error: 'Failed to load intelligence content', details: String(err) });
  }
});

/* POST /api/intelligence/refresh — force regeneration (bypass cache) */
router.post('/intelligence/refresh', async (_req, res) => {
  try {
    const content = await generateContent();
    writeCache(content);
    return res.json({ success: true, generatedAt: (content as { generatedAt: string }).generatedAt });
  } catch (err) {
    console.error('[intelligence] refresh failed', err);
    return res.status(500).json({ error: 'Failed to refresh intelligence content', details: String(err) });
  }
});

export default router;
