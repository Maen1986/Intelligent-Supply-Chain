import { Router } from 'express';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { leadsRateLimiter, getLeadsRateLimitStatus } from '../lib/rateLimit';

const router = Router();

// ── Webhook target lives server-side only — never shipped to the browser. ────
// Override with N8N_LEAD_WEBHOOK_URL; optionally authenticate outbound calls
// with N8N_WEBHOOK_SECRET (sent as a bearer token, verifiable in n8n).
const LEAD_WEBHOOK_URL =
  process.env.N8N_LEAD_WEBHOOK_URL ?? 'https://maen.app.n8n.cloud/webhook/isc-lead';

// ── Validation: closed enums for structured fields, hard caps on free text ───
const BUSINESS_SIZES = ['Startup', 'SME', 'Mid-Market', 'Enterprise', 'Government Entity'] as const;
// Kept in sync with the Diagnostic wizard's region list (Diagnostic.tsx step 2).
// Was stale at just 4 values before this fix — every other region (all 6
// GCC/Levant countries individually, plus the 5 world regions added later)
// was silently failing Zod validation and dropping the lead.
const REGIONS = [
  'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Jordan', 'Oman', 'Bahrain', 'Other GCC',
  'North America', 'Europe', 'Africa', 'Asia-Pacific', 'Latin America', 'International (Other)',
] as const;
const INDUSTRIES = [
  'Manufacturing', 'Marine', 'Retail', 'FMCG', 'Pharma', 'Logistics', 'Energy',
  'Construction', 'Tech', 'Government', 'Ecommerce', 'Food & Beverage', 'Healthcare',
] as const;
const FOCUS_AREAS = [
  'Supply Chain Strategy', 'Procurement', 'CLM', 'Supplier Governance', 'Risk Management',
  'Sustainability', 'Resiliency', 'Digital Transformation', 'Organizational Design',
  'Government Compliance',
] as const;

const diagnosticLeadSchema = z.object({
  businessSize:  z.enum(BUSINESS_SIZES),
  region:        z.enum(REGIONS),
  industry:      z.enum(INDUSTRIES),
  focusArea:     z.enum(FOCUS_AREAS),
  challengeText: z.string().max(2000).optional().default(''),
  reportSummary: z.string().max(5000).optional().default(''),
});

/* ── POST /api/leads/diagnostic ──
 * Server-side proxy for the n8n lead webhook. Validates and caps input,
 * rate-limits per IP (5/hour via express-rate-limit backed by Postgres,
 * standard RateLimit headers plus Retry-After on 429), and attaches a
 * server-held secret if configured. */
router.post('/diagnostic', leadsRateLimiter, async (req, res) => {
  const parsed = diagnosticLeadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid lead payload.' });
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (secret) headers['Authorization'] = `Bearer ${secret}`;

  try {
    const upstream = await fetch(LEAD_WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ submissionType: 'diagnostic', ...parsed.data }),
    });
    if (!upstream.ok) {
      logger.warn({ status: upstream.status }, '[leads] n8n webhook returned non-OK status');
    }
  } catch (err) {
    logger.error({ err }, '[leads] Failed to forward lead to n8n webhook');
    // Deliberately do not leak upstream details to the client.
  }

  // Always 200 to the client once validated — lead capture is best-effort.
  return res.json({ ok: true });
});

// ── Newsletter signup ─────────────────────────────────────────────────────
const newsletterLeadSchema = z.object({
  email: z.string().email().max(200),
});

/* ── POST /api/leads/newsletter ──
 * Was previously a decorative form with onSubmit={(e) => e.preventDefault()}
 * on the Insights page — every submitted email was silently discarded.
 * This forwards real signups into the same n8n lead pipeline as the
 * diagnostic tool, tagged submissionType: 'newsletter', so they land
 * wherever the founder already monitors leads. Same rate limiter, same
 * best-effort-200 contract as /diagnostic above. */
router.post('/newsletter', leadsRateLimiter, async (req, res) => {
  const parsed = newsletterLeadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (secret) headers['Authorization'] = `Bearer ${secret}`;

  try {
    const upstream = await fetch(LEAD_WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ submissionType: 'newsletter', ...parsed.data }),
    });
    if (!upstream.ok) {
      logger.warn({ status: upstream.status }, '[leads] n8n webhook returned non-OK status (newsletter)');
    }
  } catch (err) {
    logger.error({ err }, '[leads] Failed to forward newsletter signup to n8n webhook');
  }

  return res.json({ ok: true });
});

/* ── GET /api/leads/diagnostic/rate-limit ──
 * Read-only rate-limit status for the caller's IP; does NOT consume quota.
 * The frontend uses it to keep its retry countdown honest even when the
 * visitor's device clock drifts (e.g. after laptop sleep/wake). */
router.get('/diagnostic/rate-limit', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  return res.json(await getLeadsRateLimitStatus(req));
});

export default router;
