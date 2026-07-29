/**
 * /api/admin/evidence-review — Admin-only evidence review queue.
 *
 * GET  /api/admin/evidence-review       — list all ai_evaluated records awaiting review
 * PATCH /api/admin/evidence-review/:id  — set consultant_validated (or reject back to self_reported)
 */

import { Router }                from 'express';
import { db }                    from '@workspace/db';
import { maturityEvidenceTable, usersTable } from '@workspace/db/schema';
import { eq, inArray }           from 'drizzle-orm';
import { logger }                from '../lib/logger';

const router = Router();

/* Admin guard ─────────────────────────────────────────────────────────────── */
const requireAdmin: import('express').RequestHandler = (req, res, next) => {
  if (!req.session.userId)              { res.status(401).json({ ok: false, error: 'Authentication required' }); return; }
  if (req.session.userRole !== 'admin') { res.status(403).json({ ok: false, error: 'Admin access required' }); return; }
  next();
};

/* ── GET /api/admin/evidence-review ─────────────────────────────────────── */

router.get('/admin/evidence-review', requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select({
        id:               maturityEvidenceTable.id,
        userId:           maturityEvidenceTable.userId,
        snapshotId:       maturityEvidenceTable.snapshotId,
        segId:            maturityEvidenceTable.segId,
        subSegId:         maturityEvidenceTable.subSegId,
        subSegLabel:      maturityEvidenceTable.subSegLabel,
        originalFilename: maturityEvidenceTable.originalFilename,
        mimeType:         maturityEvidenceTable.mimeType,
        storagePath:      maturityEvidenceTable.storagePath,
        confidenceTier:   maturityEvidenceTable.confidenceTier,
        aiEvaluation:     maturityEvidenceTable.aiEvaluation,
        consultantNotes:  maturityEvidenceTable.consultantNotes,
        reviewedBy:       maturityEvidenceTable.reviewedBy,
        reviewedAt:       maturityEvidenceTable.reviewedAt,
        createdAt:        maturityEvidenceTable.createdAt,
      })
      .from(maturityEvidenceTable)
      .where(inArray(maturityEvidenceTable.confidenceTier, ['ai_evaluated', 'consultant_validated']));

    res.json({ ok: true, records: rows, total: rows.length });
  } catch (err) {
    logger.error({ err }, '[admin/evidence-review] List failed');
    res.status(500).json({ ok: false, error: 'Failed to list evidence records' });
  }
});

/* ── PATCH /api/admin/evidence-review/:id ──────────────────────────────── */

router.patch('/admin/evidence-review/:id', requireAdmin, async (req, res) => {
  const id     = Number(req.params.id);
  const userId = req.session.userId!;

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ ok: false, error: 'Invalid evidence id' });
    return;
  }

  const { action, consultant_notes } = req.body as {
    action?:           unknown;
    consultant_notes?: unknown;
  };

  if (action !== 'validate' && action !== 'reject') {
    res.status(400).json({ ok: false, error: 'action must be "validate" or "reject"' });
    return;
  }

  const newTier = action === 'validate' ? 'consultant_validated' : 'self_reported';

  try {
    const [updated] = await db
      .update(maturityEvidenceTable)
      .set({
        confidenceTier:  newTier,
        consultantNotes: typeof consultant_notes === 'string' ? consultant_notes : null,
        reviewedBy:      userId,
        reviewedAt:      new Date(),
      })
      .where(eq(maturityEvidenceTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ ok: false, error: 'Evidence record not found' });
      return;
    }

    logger.info({ evidenceId: id, action, newTier, reviewedBy: userId }, '[admin/evidence] Review decision saved');
    res.json({ ok: true, id: updated.id, confidence_tier: updated.confidenceTier });
  } catch (err) {
    logger.error({ err, evidenceId: id }, '[admin/evidence] Review update failed');
    res.status(500).json({ ok: false, error: 'Failed to update evidence record' });
  }
});

/* ── GET /api/storage/objects/* — evidence file proxy (ownership-checked) ─ */
/*
   Path format: /storage/objects/maturity-evidence/{userId}/{snapshotId}/...
   Ownership: userId in path must match session userId, unless admin.
*/
import { ObjectStorageService, ObjectNotFoundError } from '../lib/objectStorage';

const objectStorage = new ObjectStorageService();

router.get('/storage/objects/:seg/:ownerId/:snapshotId/:segId/:subSegId/:file',
  // Require a valid session for every object request — no unauthenticated reads.
  (req, res, next) => {
    if (!req.session.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    next();
  },
  async (req, res) => {
  const { seg, ownerId, snapshotId, segId, subSegId, file } = req.params;
  const objectPath = `/${seg}/${ownerId}/${snapshotId}/${segId}/${subSegId}/${file}`;
  const fullPath   = `/objects${objectPath}`;

  // For maturity-evidence paths: owner or admin only.
  // For any other path pattern: admin only (belt-and-suspenders).
  const pathOwnerId = Number(ownerId);
  const isMaturityEvidence = seg === 'maturity-evidence' && Number.isInteger(pathOwnerId) && pathOwnerId > 0;

  if (isMaturityEvidence) {
    if (req.session.userId !== pathOwnerId && req.session.userRole !== 'admin') {
      res.status(404).json({ error: 'Not found' }); // 404, not 403, to avoid path enumeration
      return;
    }
  } else {
    // Non-evidence storage paths: admin only
    if (req.session.userRole !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
  }

  try {
    const file = await objectStorage.getObjectEntityFile(fullPath);
    const dlResponse = await objectStorage.downloadObject(file, 300); // 5 min cache for evidence files

    res.setHeader('Content-Type', dlResponse.headers.get('Content-Type') ?? 'application/octet-stream');
    res.setHeader('Cache-Control', dlResponse.headers.get('Cache-Control') ?? 'private, max-age=300');
    const ct = dlResponse.headers.get('Content-Length');
    if (ct) res.setHeader('Content-Length', ct);

    const buf = await dlResponse.arrayBuffer();
    res.send(Buffer.from(buf));
  } catch (err) {
    if (err instanceof ObjectNotFoundError) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    logger.error({ err, objectPath }, '[storage/objects] Serve failed');
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

export default router;
