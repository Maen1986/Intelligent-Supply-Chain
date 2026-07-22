import { Router } from 'express';
import { db } from '@workspace/db';
import { submissionsTable } from '@workspace/db';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { sendBriefingEmail } from './notify';
import {
  ObjectStorageService,
  ObjectNotFoundError,
  objectStorageClient,
} from '../lib/objectStorage';

const router = Router();

const objectStorage = new ObjectStorageService();

/* Uploads the briefing PDF to the private object dir, keyed by submission id.
   Returns the local object path (e.g. "/objects/briefings/42.pdf").           */
async function storeBriefingPdf(submissionId: number, pdfBuffer: Buffer): Promise<string> {
  let privateDir = objectStorage.getPrivateObjectDir();
  if (!privateDir.endsWith('/')) privateDir = `${privateDir}/`;
  const entityId = `briefings/${submissionId}.pdf`;
  const fullPath = `${privateDir}${entityId}`;
  // fullPath is "/<bucket>/<objectName>"
  const parts = fullPath.startsWith('/') ? fullPath.slice(1).split('/') : fullPath.split('/');
  const bucketName = parts[0];
  const objectName = parts.slice(1).join('/');
  await objectStorageClient
    .bucket(bucketName)
    .file(objectName)
    .save(pdfBuffer, { contentType: 'application/pdf', resumable: false });
  return `/objects/${entityId}`;
}

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

    // Store the branded PDF (when captured) and email the lead summary to the
    // consultant — with the PDF attached when available, or without an
    // attachment when capture failed, so no lead is ever missed.
    // Fire-and-forget: never blocks or fails the API response.
    if (data.tool === 'command_centre') {
      const inputs  = (data.inputs  ?? {}) as Record<string, unknown>;
      const outputs = (data.outputs ?? {}) as Record<string, unknown>;
      const pdfFilename = data.pdfFilename || `ISC-Executive-Briefing-${row.id}.pdf`;

      // Persist the PDF to object storage so it can be re-downloaded later.
      if (data.pdfBase64) {
        try {
          const pdfBuffer = Buffer.from(data.pdfBase64, 'base64');
          const pdfObjectPath = await storeBriefingPdf(row.id, pdfBuffer);
          await db
            .update(submissionsTable)
            .set({ pdfObjectPath, pdfFilename })
            .where(eq(submissionsTable.id, row.id));
          logger.info({ submissionId: row.id, pdfObjectPath, pdfBytes: pdfBuffer.length }, '[submissions] Briefing PDF stored');
        } catch (storeErr) {
          logger.error({ err: storeErr, submissionId: row.id }, '[submissions] Briefing PDF storage failed');
        }
      }

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
          pdfFilename,
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

/* Admin guard: lead contact details and stored briefings are sensitive, so
   only an authenticated admin session may access them.                        */
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

/* ── GET /api/submissions ────────────────────────────────────────────────────
   Returns all submissions, newest first. Admin-only.                          */
router.get('/', requireAdmin, async (req, res) => {
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
   Filter by tool type for quick admin queries. Admin-only.                     */
router.get<{ tool: string }>('/by-tool/:tool', requireAdmin, async (req, res) => {
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

/* ── GET /api/submissions/:id/briefing-pdf ──────────────────────────────────
   Streams the stored briefing PDF for a submission so an admin can
   re-download it even if the original email was lost. Admin-only.             */
router.get('/:id/briefing-pdf', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ ok: false, error: 'Invalid submission id' });
    return;
  }
  try {
    const [row] = await db
      .select()
      .from(submissionsTable)
      .where(eq(submissionsTable.id, id))
      .limit(1);
    if (!row) {
      res.status(404).json({ ok: false, error: 'Submission not found' });
      return;
    }
    if (!row.pdfObjectPath) {
      res.status(404).json({ ok: false, error: 'No stored PDF for this submission' });
      return;
    }
    const file = await objectStorage.getObjectEntityFile(row.pdfObjectPath);
    const [metadata] = await file.getMetadata();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${(row.pdfFilename || `ISC-Executive-Briefing-${id}.pdf`).replace(/"/g, '')}"`
    );
    if (metadata.size) res.setHeader('Content-Length', String(metadata.size));
    file
      .createReadStream()
      .on('error', (err) => {
        logger.error({ err, submissionId: id }, '[submissions] PDF stream failed');
        if (!res.headersSent) res.status(500).json({ ok: false, error: 'Failed to stream PDF' });
        else res.end();
      })
      .pipe(res);
  } catch (err) {
    if (err instanceof ObjectNotFoundError) {
      res.status(404).json({ ok: false, error: 'Stored PDF not found in object storage' });
      return;
    }
    logger.error({ err, submissionId: id }, '[submissions] PDF download failed');
    res.status(500).json({ ok: false, error: 'Failed to download PDF' });
  }
});

export default router;
