/**
 * Guest Maturity Snapshot routes
 *
 * POST /api/maturity/save-guest  — store answers + email a tokenised results link
 * GET  /api/maturity/guest-results/:token — retrieve a snapshot by token
 */
import { Router }       from 'express';
import crypto           from 'node:crypto';
import { db }           from '@workspace/db';
import { maturityGuestSnapshotsTable } from '@workspace/db';
import { eq }           from 'drizzle-orm';
import { z }            from 'zod';
import { logger }       from '../lib/logger';
import { sendGuestResultsEmail } from './notify';

const router = Router();

const SNAPSHOT_TTL_DAYS = 30;

/* ── POST /api/maturity/save-guest ──────────────────────────────────────────
   Persists the guest's answers and emails a tokenised link so they can
   return to their results from any device for 30 days.                      */

const SaveGuestSchema = z.object({
  email:      z.string().email(),
  answers:    z.record(z.string(), z.number()),
  intakeData: z.object({
    industry:    z.string(),
    companySize: z.string(),
  }),
  lang:       z.enum(['en', 'ar']).optional().default('en'),
  /** Precomputed summary to include in the email (optional) */
  overallScore: z.number().optional(),
  overallLevel: z.string().optional(),
});

router.post('/maturity/save-guest', async (req, res) => {
  const parsed = SaveGuestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'Invalid data', details: parsed.error.format() });
    return;
  }

  const { email, answers, intakeData, lang, overallScore, overallLevel } = parsed.data;

  // Generate a cryptographically random URL-safe token
  const token     = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SNAPSHOT_TTL_DAYS * 24 * 60 * 60 * 1000);

  try {
    await db
      .insert(maturityGuestSnapshotsTable)
      .values({ token, email, answers, intakeData, lang, expiresAt });

    logger.info({ email, token: token.slice(0, 8) + '…' }, '[maturityGuest] Snapshot saved');

    // Fire-and-forget: send the tokenised link to the guest
    sendGuestResultsEmail({ email, token, lang, overallScore, overallLevel, expiresInDays: SNAPSHOT_TTL_DAYS })
      .catch(err => logger.error({ err, email }, '[maturityGuest] Email send failed'));

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err, email }, '[maturityGuest] Save failed');
    res.status(500).json({ ok: false, error: 'Could not save your results' });
  }
});

/* ── GET /api/maturity/guest-results/:token ─────────────────────────────────
   Returns stored answers and intakeData so the frontend can reconstruct
   the full results view for returning guests.                                */

router.get('/maturity/guest-results/:token', async (req, res) => {
  const { token } = req.params;
  if (!token || token.length > 64) {
    res.status(400).json({ ok: false, error: 'Invalid token' });
    return;
  }

  try {
    const [row] = await db
      .select()
      .from(maturityGuestSnapshotsTable)
      .where(eq(maturityGuestSnapshotsTable.token, token))
      .limit(1);

    if (!row) {
      res.status(404).json({ ok: false, error: 'Results not found or link has expired' });
      return;
    }

    if (row.expiresAt.getTime() < Date.now()) {
      res.status(410).json({ ok: false, error: 'This results link has expired' });
      return;
    }

    res.json({
      ok:         true,
      answers:    row.answers    as Record<string, number>,
      intakeData: row.intakeData as { industry: string; companySize: string },
      lang:       row.lang,
    });
  } catch (err) {
    logger.error({ err, token: token.slice(0, 8) + '…' }, '[maturityGuest] Retrieve failed');
    res.status(500).json({ ok: false, error: 'Could not retrieve results' });
  }
});

export default router;
