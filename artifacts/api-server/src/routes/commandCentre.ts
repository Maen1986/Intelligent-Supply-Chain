/**
 * /api/command-centre — live benchmark data + AI-powered analysis
 *
 * GET  /api/command-centre/benchmarks     — public; returns all gcc_benchmarks rows
 * POST /api/command-centre/savings        — AI savings analysis (session required, #364 billing gate; rate-limited)
 * POST /api/command-centre/risk-score     — AI risk scoring  (session required, #364 billing gate; rate-limited)
 */

import { Router }   from 'express';
import { eq, sql }  from 'drizzle-orm';
import { db, gccBenchmarksTable } from '@workspace/db';
import { openai }   from '@workspace/integrations-openai-ai-server';
import { OPENAI_MODEL, friendlyAIError } from '../lib/aiConfig';
import { leadsRateLimiter } from '../lib/rateLimit';
import { requireSession }   from '../middlewares/requireSession';
import { logger }   from '../lib/logger';

const router = Router();

// ── Ma'in Alhaqash persona (shared with consultancy / diagnostic routes) ───────
const MAIN_IDENTITY = `You are Ma'in Alhaqash — MCIPS, CPSM, MSc, MIPP — founding principal of I Supply Chain. You have 20+ years of transformational supply chain and procurement experience across Saudi Arabia, Jordan, UAE, Qatar, and Kuwait. You deliver solutions at the standard of McKinsey, BCG, Kearney, Accenture, and Gartner. You apply SCOR, CIPS, ISO 31000, Lean, Six Sigma, and GCC regulatory frameworks. Every output is industry-specific, process-specific, and region-specific — no generic advice.`;

// ── GET /api/command-centre/benchmarks ────────────────────────────────────────
// Public endpoint — returns all benchmark rows, ordered for easy client merge.
router.get('/command-centre/benchmarks', async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(gccBenchmarksTable)
      .orderBy(gccBenchmarksTable.category, gccBenchmarksTable.itemId);
    res.json({ ok: true, rows });
  } catch (err) {
    logger.error({ err }, '[command-centre/benchmarks] GET failed');
    res.status(500).json({ ok: false, error: 'Failed to load benchmarks' });
  }
});

// ── POST /api/command-centre/savings ──────────────────────────────────────────
// AI-reasoned savings analysis. Returns per-lever adjusted maxPct values and
// narrative grounded in the client's industry.
router.post('/command-centre/savings', requireSession, leadsRateLimiter, async (req, res) => {
  const { industry, revenue, spendPct, levers, language } = req.body as {
    industry:  string;
    revenue:   number;   // SAR millions
    spendPct:  number;   // procurement spend as % of revenue
    levers:    Record<string, number>; // lever id → deployment % (0-100)
    language?: 'en' | 'ar';
  };

  if (!industry || !levers) {
    res.status(400).json({ ok: false, error: 'industry and levers are required' });
    return;
  }

  const lang = language === 'ar' ? 'Arabic' : 'English';
  const spend = (revenue ?? 500) * 1_000_000 * (spendPct ?? 28) / 100;

  // Fetch current GCC-wide lever baselines from DB for context
  let dbLevers: Record<string, number> = {};
  try {
    const rows = await db
      .select()
      .from(gccBenchmarksTable)
      .where(
        sql`category = 'lever' AND industry IS NULL`,
      );
    for (const r of rows) {
      const d = r.data as Record<string, number>;
      if (typeof d.maxPct === 'number') dbLevers[r.itemId] = d.maxPct;
    }
  } catch { /* ignore — AI still runs with reasonable GCC defaults */ }

  const LEVER_LABELS: Record<string, string> = {
    catMgmt:  'Strategic Category Management',
    suppCons: 'Supplier Consolidation',
    procAuto: 'Process & eProcurement Automation',
    invOpt:   'Inventory Optimisation',
    demand:   'Demand Forecasting Improvement',
  };
  const FALLBACK_MAX: Record<string, number> = {
    catMgmt: 0.13, suppCons: 0.09, procAuto: 0.05, invOpt: 0.07, demand: 0.04,
  };

  const leverLines = Object.entries(levers)
    .map(([id, pct]) => {
      const base = dbLevers[id] ?? FALLBACK_MAX[id] ?? 0.05;
      return `  - ${LEVER_LABELS[id] ?? id}: ${pct}% deployment intent | GCC baseline max savings potential: ${(base*100).toFixed(0)}% of spend`;
    })
    .join('\n');

  const prompt = `A ${industry} company in the GCC is running a savings opportunity analysis.

COMPANY PROFILE:
  Annual Revenue: SAR ${revenue ?? 500}M
  Procurement Spend: ${spendPct ?? 28}% of revenue = SAR ${Math.round(spend / 1_000_000)}M
  Industry: ${industry}

INITIATIVE LEVER DEPLOYMENT INTENTS (0% = no action, 100% = full deployment):
${leverLines}

GCC BASELINE MAX SAVINGS POTENTIALS above are industry-wide averages. For ${industry} specifically, these may differ materially based on spend structure, supply base, and procurement maturity.

Provide a genuinely ${industry}-specific savings analysis in ${lang}. Two ${industry} companies with different spend profiles and lever priorities should get different output — not a scaled version of the same formula.

Return ONLY valid JSON (no markdown):
{
  "levers": [
    {
      "id": "catMgmt",
      "adjustedMaxPct": <number: adjusted max savings as fraction of spend, specific to ${industry} — e.g. 0.14>,
      "narrative": "<2-3 sentences: why this percentage is right for ${industry}; what drives savings in this sector>",
      "priority": <integer 1-5, 1=highest impact for ${industry} specifically>,
      "keyActions": ["<specific action 1 for ${industry}>", "<specific action 2>"],
      "quickWin": "<one specific quick-win action achievable in 4-6 weeks for ${industry}>"
    }
  ],
  "paybackMonths": <integer: realistic payback period in months for ${industry}>,
  "totalSavingsNarrative": "<2-3 sentences: overall savings commentary for a ${industry} company at this spend level>",
  "industryContext": "<2-3 sentences: what makes ${industry} procurement savings opportunities unique in the GCC>",
  "consultantNote": "<Ma'in's personal 2-sentence note — specific to ${industry} procurement, not generic>"
}

Rules:
- Provide one entry per lever id: catMgmt, suppCons, procAuto, invOpt, demand
- adjustedMaxPct must reflect ${industry}-specific realities (e.g. Manufacturing category management savings differ from Government or Retail)
- All text in ${lang}
- No generic advice — every sentence must be industry-specific`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: MAIN_IDENTITY },
        { role: 'user',   content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content from AI');
    const analysis = JSON.parse(content);
    res.json({ ok: true, analysis });
  } catch (err) {
    logger.error({ err }, '[command-centre/savings] failed');
    const { message, status } = friendlyAIError(err);
    res.status(status).json({ ok: false, error: message });
  }
});

// ── POST /api/command-centre/risk-score ───────────────────────────────────────
// AI-reasoned risk scoring calibrated to the client's industry.
router.post('/command-centre/risk-score', requireSession, leadsRateLimiter, async (req, res) => {
  const { industry, revenue, ratings, language } = req.body as {
    industry:  string;
    revenue:   number;
    ratings:   Record<string, { likelihood: number; impact: number; mitigation: string }>;
    language?: 'en' | 'ar';
  };

  if (!industry || !ratings) {
    res.status(400).json({ ok: false, error: 'industry and ratings are required' });
    return;
  }

  const lang = language === 'ar' ? 'Arabic' : 'English';

  // Fetch GCC-wide risk baselines from DB
  let dbRisk: Record<string, { gcMedian: number; gcTopQ: number }> = {};
  try {
    const rows = await db
      .select()
      .from(gccBenchmarksTable)
      .where(sql`category = 'risk' AND industry IS NULL`);
    for (const r of rows) {
      const d = r.data as Record<string, number>;
      if (typeof d.gcMedian === 'number') dbRisk[r.itemId] = { gcMedian: d.gcMedian, gcTopQ: d.gcTopQ };
    }
  } catch { /* ignore */ }

  const FALLBACK_RISK: Record<string, { gcMedian: number; gcTopQ: number }> = {
    supply:       { gcMedian: 45, gcTopQ: 22 }, demand:      { gcMedian: 40, gcTopQ: 20 },
    operational:  { gcMedian: 48, gcTopQ: 25 }, financial:   { gcMedian: 38, gcTopQ: 18 },
    geopolitical: { gcMedian: 42, gcTopQ: 20 }, esg:         { gcMedian: 52, gcTopQ: 28 },
    cyber:        { gcMedian: 55, gcTopQ: 25 }, contract:    { gcMedian: 44, gcTopQ: 20 },
  };

  const CATEGORY_LABELS: Record<string, string> = {
    supply: 'Supply Risk', demand: 'Demand Risk', operational: 'Operational Risk',
    financial: 'Financial Risk', geopolitical: 'Geopolitical / Regulatory Risk',
    esg: 'ESG / Sustainability Risk', cyber: 'Cyber / Technology Risk',
    contract: 'Contract / Governance Risk',
  };

  const ratingLines = Object.entries(ratings).map(([id, r]) => {
    const bench = dbRisk[id] ?? FALLBACK_RISK[id] ?? { gcMedian: 45, gcTopQ: 22 };
    const score = r.likelihood * r.impact;
    return `  - ${CATEGORY_LABELS[id] ?? id}: L${r.likelihood}×I${r.impact}=${score}/25, mitigation=${r.mitigation} | GCC median exposure points: ${bench.gcMedian}, top-quartile: ${bench.gcTopQ}`;
  }).join('\n');

  const exposureScore = (() => {
    let total = 0;
    for (const [, r] of Object.entries(ratings)) {
      const raw = r.likelihood * r.impact;
      const mit = r.mitigation === 'full' ? 0.6 : r.mitigation === 'partial' ? 0.3 : 0;
      total += raw * (1 - mit);
    }
    return Math.round(Math.min(100, (total / 200) * 100));
  })();

  const prompt = `A ${industry} company in the GCC has completed a supply chain risk assessment.

COMPANY PROFILE:
  Annual Revenue: SAR ${revenue ?? 300}M
  Industry: ${industry}
  Composite Exposure Score: ${exposureScore}/100

RISK RATINGS (Likelihood 1-5 × Impact 1-5 = Score/25):
${ratingLines}

GCC BASELINE BENCHMARKS above are industry-wide averages. For ${industry} specifically, risk profiles differ materially.

Provide a genuinely ${industry}-specific risk calibration in ${lang}.

Return ONLY valid JSON (no markdown):
{
  "industryBenchmark": <integer 0-100: typical GCC risk exposure score for ${industry} — industry-specific, not generic average>,
  "targetScore": <integer 0-100: top-quartile (best-in-class) risk score for ${industry}>,
  "annualExposureCoefficient": <number: fraction of annual revenue representing financial exposure per risk point above target — specific to ${industry}'s risk profile, e.g. 0.0004 for Energy & Oil, 0.0002 for Services>,
  "commentary": [
    {
      "categoryId": "<one of: supply, demand, operational, financial, geopolitical, esg, cyber, contract>",
      "priority": <integer 1-8, 1=most critical for ${industry}>,
      "headline": "<10-word max headline>",
      "narrative": "<2-3 sentences: what this risk means specifically for ${industry} companies in the GCC>",
      "industryGcMedian": <integer: industry-specific GCC median for this category>,
      "industryGcTopQ": <integer: industry-specific top-quartile target>
    }
  ],
  "consultantNote": "<Ma'in's 2-sentence personal note on the single most important risk action for this ${industry} company>"
}

Rules:
- industryBenchmark and targetScore must reflect ${industry} realities (e.g. Energy & Oil typically scores 45-55, while professional Services scores 25-35)
- annualExposureCoefficient: Energy & Oil ~0.0005, Manufacturing ~0.0004, Government ~0.0003, Services ~0.0002
- commentary: one entry per category, all 8 categories
- All text in ${lang}`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: MAIN_IDENTITY },
        { role: 'user',   content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 2500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content from AI');
    const analysis = JSON.parse(content);
    res.json({ ok: true, analysis });
  } catch (err) {
    logger.error({ err }, '[command-centre/risk-score] failed');
    const { message, status } = friendlyAIError(err);
    res.status(status).json({ ok: false, error: message });
  }
});

export default router;
