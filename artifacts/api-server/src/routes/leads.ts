import { Router } from 'express';
import { z } from 'zod';
import { logger } from '../lib/logger';

const router = Router();

// ── Webhook target lives server-side only — never shipped to the browser. ────
// Override with N8N_LEAD_WEBHOOK_URL; optionally authenticate outbound calls
// with N8N_WEBHOOK_SECRET (sent as a bearer token, verifiable in n8n).
const LEAD_WEBHOOK_URL =
  process.env.N8N_LEAD_WEBHOOK_URL ?? 'https://maen.app.n8n.cloud/webhook/isc-lead';

// ── Simple in-memory per-IP rate limiter ─────────────────────────────────────
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 5;         // lead submissions per IP per hour
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  if (arr.length >= MAX_PER_WINDOW) {
    hits.set(ip, arr);
    return true;
  }
  arr.push(now);
  hits.set(ip, arr);
  return false;
}

// Periodically prune stale entries so the map cannot grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [ip, arr] of hits) {
    const fresh = arr.filter(t => now - t < WINDOW_MS);
    if (fresh.length === 0) hits.delete(ip);
    else hits.set(ip, fresh);
  }
}, WINDOW_MS).unref?.();

// ── Validation: closed enums for structured fields, hard caps on free text ───
const BUSINESS_SIZES = ['Startup', 'SME', 'Mid-Market', 'Enterprise', 'Government Entity'] as const;
const REGIONS = ['International', 'Saudi Arabia', 'Jordan', 'Other GCC'] as const;
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
 * rate-limits per IP, and attaches a server-held secret if configured. */
router.post('/diagnostic', async (req, res) => {
  const ip = req.ip ?? 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'Too many submissions. Please try again later.' });
  }

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

export default router;
