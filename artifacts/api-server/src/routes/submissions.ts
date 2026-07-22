import { Router } from 'express';
import { db } from '@workspace/db';
import { submissionsTable } from '@workspace/db';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { sendBriefingEmail } from './notify';

const router = Router();

const SaveSchema = z.object({
  tool:                z.enum(['command_centre', 'diagnostic', 'maturity', 'booking', 'lead']),
  contactName:         z.string().optional(),
  contactEmail:        z.string().optional(),
  contactMobile:       z.string().optional(),
  contactDesignation:  z.string().optional(),
  contactCompany:      z.string().optional(),
  inputs:              z.record(z.unknown()).optional(),
  outputs:             z.record(z.unknown()).optional(),
  language:            z.enum(['en', 'ar']).optional(),
  // Base64-encoded branded PDF briefing rendered client-side (≤ ~15 MB decoded)
  pdfBase64:           z.string().max(20_000_000).optional(),
  pdfFilename:         z.string().max(200).optional(),
});

/* ── POST /api/submissions ───────────────────────────────────────────────────
   Persists any tool interaction (Command Centre briefing, Diagnostic,
   Maturity assessment, Booking, or Lead registration) to PostgreSQL.
   Augments with user session info if the caller is authenticated.             */
router.post('/', async (req, res) => {
  const parsed = SaveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'Invalid submission data' });
    return;
  }

  const data = parsed.data;

  // Pull contact info from session if not explicitly provided
  const contactName        = data.contactName        ?? req.session.userFullName    ?? null;
  const contactEmail       = data.contactEmail       ?? req.session.userEmail       ?? null;
  const contactMobile      = data.contactMobile      ?? req.session.userMobile      ?? null;
  const contactDesignation = data.contactDesignation ?? req.session.userDesignation ?? null;
  const contactCompany     = data.contactCompany     ?? req.session.userCompany     ?? null;

  try {
    const [row] = await db
      .insert(submissionsTable)
      .values({
        tool:                data.tool,
        userId:              req.session.userId ?? null,
        contactName,
        contactEmail,
        contactMobile,
        contactDesignation,
        contactCompany,
        inputs:              data.inputs  ?? null,
        outputs:             data.outputs ?? null,
        ipAddress:           req.ip ?? null,
      })
      .returning();

    logger.info({ submissionId: row.id, tool: data.tool, contactEmail }, '[submissions] Saved');
    res.json({ ok: true, id: row.id });

    // Email the lead summary to the consultant — with the branded PDF attached
    // when the client captured one, or without an attachment when capture
    // failed, so no lead is ever missed. Fire-and-forget: never blocks or
    // fails the API response.
    if (data.tool === 'command_centre') {
      const inputs  = (data.inputs  ?? {}) as Record<string, unknown>;
      const outputs = (data.outputs ?? {}) as Record<string, unknown>;
      try {
        const pdfBuffer = data.pdfBase64 ? Buffer.from(data.pdfBase64, 'base64') : undefined;
        const result = await sendBriefingEmail({
          contactName,
          contactEmail,
          company: contactCompany,
          industry:      typeof inputs.industry    === 'string' ? inputs.industry    : '—',
          revenueBand:   typeof inputs.revenueBand === 'string' ? inputs.revenueBand : '—',
          language:      data.language ?? 'en',
          maturityScore: String(outputs.maturityScore ?? '—'),
          maturityLevel: String(outputs.maturityLevel ?? '—'),
          pdfBuffer,
          pdfFilename: data.pdfFilename || `ISC-Executive-Briefing-${row.id}.pdf`,
        });
        if (!result.sent) {
          logger.error({ submissionId: row.id, reason: result.reason }, '[submissions] Briefing email NOT sent');
        } else {
          logger.info(
            { submissionId: row.id, pdfBytes: pdfBuffer?.length ?? 0, hasPdf: !!pdfBuffer },
            pdfBuffer ? '[submissions] Briefing PDF emailed' : '[submissions] Briefing email sent WITHOUT PDF (capture failed client-side)'
          );
        }
      } catch (emailErr) {
        logger.error({ err: emailErr, submissionId: row.id }, '[submissions] Briefing email failed');
      }
    }
  } catch (err) {
    logger.error({ err, tool: data.tool }, '[submissions] Save failed');
    res.status(500).json({ ok: false, error: 'Failed to save submission' });
  }
});

/* ── GET /api/submissions ────────────────────────────────────────────────────
   Returns all submissions, newest first. Intended for admin review.
   In production, protect with an admin-role middleware.                        */
router.get('/', async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(submissionsTable)
      .orderBy(desc(submissionsTable.createdAt))
      .limit(500);
    res.json({ ok: true, submissions: rows, total: rows.length });
  } catch (err) {
    logger.error({ err }, '[submissions] List failed');
    res.status(500).json({ ok: false, error: 'Failed to fetch submissions' });
  }
});

/* ── GET /api/submissions/by-tool/:tool ─────────────────────────────────────
   Filter by tool type for quick admin queries.                                 */
router.get('/by-tool/:tool', async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(submissionsTable)
      .where(eq(submissionsTable.tool, req.params.tool))
      .orderBy(desc(submissionsTable.createdAt))
      .limit(200);
    res.json({ ok: true, submissions: rows, total: rows.length });
  } catch (err) {
    logger.error({ err }, '[submissions] Filter failed');
    res.status(500).json({ ok: false, error: 'Failed to fetch submissions' });
  }
});

export default router;
