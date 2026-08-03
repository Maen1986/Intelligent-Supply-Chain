/**
 * /api/maturity/evidence — Client-facing evidence upload & management.
 *
 * Flow:
 *   1. POST /upload-url → validates inputs, creates pending DB row,
 *                          returns presigned GCS PUT URL.
 *   2. Client PUTs file directly to GCS.
 *   3. POST /:id/confirm → verifies file exists, triggers synchronous
 *                           GPT-4o evaluation, returns updated tier.
 *   4. GET  /            → lists all evidence for a snapshot (owner-scoped).
 *   5. DELETE /:id       → removes row + GCS file (blocked if consultant_validated).
 */

import { Router }                from 'express';
import { db }                    from '@workspace/db';
import { maturityEvidenceTable, maturitySnapshotsTable } from '@workspace/db/schema';
import { eq, and }               from 'drizzle-orm';
import { randomUUID }            from 'crypto';
import { openai }                from '@workspace/integrations-openai-ai-server';
import { OPENAI_MODEL, friendlyAIError } from '../lib/aiConfig';
import { ObjectStorageService, ObjectNotFoundError } from '../lib/objectStorage';
import { requireSession }        from '../middlewares/requireSession';
import { logger }                from '../lib/logger';
import type { AiEvaluation }     from '@workspace/db/schema';

const router = Router();
const objectStorage = new ObjectStorageService();

/* ── Constants ───────────────────────────────────────────────────────────── */

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/webp',
]);
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'application/pdf':            'pdf',
    'application/msword':         'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'image/png':  'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  };
  return map[mime] ?? 'bin';
}

function isImageMime(mime: string): boolean {
  return mime.startsWith('image/');
}

/* ── AI Evaluation ───────────────────────────────────────────────────────── */

async function evaluateEvidence(
  storagePath:   string,
  mimeType:      string,
  filename:      string,
  subSegLabel:   string,
  subSegHint:    string,
  segmentScore?: number,
): Promise<AiEvaluation> {
  const claimedLevelText = segmentScore !== undefined
    ? `The client's overall segment score is ${segmentScore.toFixed(1)}/5.`
    : '';

  const systemMsg = `You are a supply chain maturity assessment auditor. Your job is to objectively evaluate whether a client-uploaded document plausibly supports their self-reported maturity level. Be fair but rigorous. When genuinely uncertain, lean toward plausible_support: true with confidence: "medium".`;

  // Build the user message content
  type ContentPart =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string; detail: 'low' } };
  const contentParts: ContentPart[] = [];

  const promptText = `Sub-segment being assessed: ${subSegLabel}
What a qualifying document for this sub-segment should contain: ${subSegHint}
${claimedLevelText}
Uploaded file: "${filename}" (${mimeType})

EVALUATION TASK: Does this document plausibly support the claimed maturity level?

Return ONLY valid JSON matching this exact schema (no markdown, no fences):
{
  "plausible_support": boolean,
  "confidence": "high" | "medium" | "low",
  "flag_reason": "generic_template" | "blank_or_irrelevant" | "contradicts_claimed_level" | null,
  "summary": "1–2 sentence assessment of why the document does or does not support the claimed level"
}

Flag rules:
- generic_template: document appears to be an unmodified blank template
- blank_or_irrelevant: document has no content relevant to this sub-segment
- contradicts_claimed_level: document evidence suggests a significantly lower maturity level
- null: document is plausible and supports the claimed level`;

  contentParts.push({ type: 'text', text: promptText });

  // For image files: download and include as vision input
  if (isImageMime(mimeType) && storagePath) {
    try {
      const file = await objectStorage.getObjectEntityFile(storagePath);
      const [contents] = await file.download();
      const b64 = (contents as Buffer).toString('base64');
      contentParts.push({
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${b64}`, detail: 'low' },
      });
    } catch {
      // File not accessible — proceed with text-only evaluation
    }
  }

  const response = await openai.chat.completions.create({
    model:           OPENAI_MODEL,
    max_completion_tokens: 400,
    messages: [
      { role: 'system', content: systemMsg },
      { role: 'user',   content: contentParts },
    ],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content) as Partial<AiEvaluation>;
  return {
    plausible_support: Boolean(parsed.plausible_support ?? true),
    confidence:        (['high','medium','low'].includes(parsed.confidence ?? '') ? parsed.confidence! : 'medium'),
    flag_reason:       (['generic_template','blank_or_irrelevant','contradicts_claimed_level'].includes(parsed.flag_reason ?? '') ? parsed.flag_reason! : null),
    summary:           typeof parsed.summary === 'string' ? parsed.summary : 'Document evaluation complete.',
  };
}

/* ── POST /api/maturity/evidence/upload-url ─────────────────────────────── */

router.post('/maturity/evidence/upload-url', requireSession, async (req, res) => {
  const userId = req.session.userId!;
  const { snapshot_id, seg_id, subseg_id, filename, mime_type, file_size,
          subseg_label = '', subseg_hint = '' } = req.body as {
    snapshot_id: unknown; seg_id: unknown; subseg_id: unknown;
    filename: unknown; mime_type: unknown; file_size: unknown;
    subseg_label?: string; subseg_hint?: string;
  };

  if (!snapshot_id || !seg_id || !subseg_id || !filename || !mime_type) {
    res.status(400).json({ ok: false, error: 'Missing required fields' });
    return;
  }
  const fileBytes = Number(file_size);
  if (!Number.isFinite(fileBytes) || fileBytes <= 0) {
    res.status(400).json({ ok: false, error: 'file_size must be a positive number' });
    return;
  }
  if (!ALLOWED_MIME_TYPES.has(mime_type as string)) {
    res.status(400).json({ ok: false, error: `File type not allowed. Accepted: PDF, Word, PNG, JPEG, WebP.` });
    return;
  }
  if (fileBytes > MAX_FILE_BYTES) {
    res.status(400).json({ ok: false, error: 'File exceeds 10 MB limit.' });
    return;
  }

  // Verify the snapshot exists and belongs to the requesting user
  const [ownedSnapshot] = await db
    .select({ id: maturitySnapshotsTable.id })
    .from(maturitySnapshotsTable)
    .where(and(
      eq(maturitySnapshotsTable.id,     Number(snapshot_id)),
      eq(maturitySnapshotsTable.userId, userId),
    ))
    .limit(1);

  if (!ownedSnapshot) {
    res.status(403).json({ ok: false, error: 'Snapshot not found or does not belong to you' });
    return;
  }

  // Enforce one-file-per-sub-segment-per-snapshot
  const [existing] = await db
    .select({ id: maturityEvidenceTable.id })
    .from(maturityEvidenceTable)
    .where(and(
      eq(maturityEvidenceTable.userId,     userId),
      eq(maturityEvidenceTable.snapshotId, Number(snapshot_id)),
      eq(maturityEvidenceTable.segId,      String(seg_id)),
      eq(maturityEvidenceTable.subSegId,   String(subseg_id)),
    ))
    .limit(1);

  if (existing) {
    res.status(409).json({ ok: false, error: 'Evidence already uploaded for this sub-segment. Remove the existing file first.' });
    return;
  }

  try {
    const uuid = randomUUID();
    const ext  = extFromMime(mime_type as string);
    const storagePath = `/objects/maturity-evidence/${userId}/${snapshot_id}/${seg_id}/${subseg_id}/${uuid}.${ext}`;

    // Generate presigned PUT URL
    const uploadUrl = await objectStorage.signEvidencePutURL(storagePath);

    // Create the pending DB row now — storage_path is deterministic
    const [row] = await db
      .insert(maturityEvidenceTable)
      .values({
        userId,
        snapshotId:       Number(snapshot_id),
        segId:            String(seg_id),
        subSegId:         String(subseg_id),
        subSegLabel:      String(subseg_label),
        subSegHint:       String(subseg_hint),
        storagePath,
        originalFilename: String(filename),
        mimeType:         String(mime_type),
        confidenceTier:   'self_reported',
      })
      .returning();

    logger.info({ evidenceId: row.id, userId, snapshotId: snapshot_id, segId: seg_id, subSegId: subseg_id }, '[evidence] Upload URL issued');
    res.status(201).json({ ok: true, evidence_id: row.id, upload_url: uploadUrl });
  } catch (err) {
    logger.error({ err }, '[evidence/upload-url] Failed');
    res.status(500).json({ ok: false, error: 'Failed to create upload URL' });
  }
});

/* ── POST /api/maturity/evidence/:id/confirm ─────────────────────────────── */

router.post('/maturity/evidence/:id/confirm', requireSession, async (req, res) => {
  const userId = req.session.userId!;
  const id     = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ ok: false, error: 'Invalid evidence id' });
    return;
  }

  const [evidenceRow] = await db
    .select()
    .from(maturityEvidenceTable)
    .where(and(eq(maturityEvidenceTable.id, id), eq(maturityEvidenceTable.userId, userId)))
    .limit(1);

  if (!evidenceRow) {
    res.status(404).json({ ok: false, error: 'Evidence not found' });
    return;
  }

  // Guard: consultant-validated — must not be overwritten by AI re-evaluation
  if (evidenceRow.confidenceTier === 'consultant_validated') {
    res.status(409).json({
      ok: false,
      error: 'Evidence has been consultant-validated and cannot be re-confirmed. Contact your consultant to release it.',
      confidence_tier: evidenceRow.confidenceTier,
      ai_evaluation:   evidenceRow.aiEvaluation,
    });
    return;
  }

  // Guard: already AI-evaluated — return the existing result without re-running
  if (evidenceRow.confidenceTier === 'ai_evaluated') {
    res.status(409).json({
      ok: false,
      error: 'Evidence has already been AI-evaluated. Remove and re-upload the file to trigger a new evaluation.',
      confidence_tier: evidenceRow.confidenceTier,
      ai_evaluation:   evidenceRow.aiEvaluation,
    });
    return;
  }

  // Verify file exists in GCS and check size
  let fileSize = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let gcsFile: any = null;
  try {
    gcsFile = await objectStorage.getObjectEntityFile(evidenceRow.storagePath);
    const [metadata] = await gcsFile.getMetadata();
    fileSize = Number(metadata.size ?? 0);
  } catch (fileErr) {
    if (fileErr instanceof ObjectNotFoundError) {
      res.status(422).json({ ok: false, error: 'File not found in storage — please upload the file before confirming.' });
      return;
    }
    logger.warn({ err: fileErr, evidenceId: id }, '[evidence/confirm] Metadata check failed');
  }

  if (fileSize > MAX_FILE_BYTES) {
    // File exceeded limit — delete the DB row and GCS object
    await db.delete(maturityEvidenceTable).where(eq(maturityEvidenceTable.id, id));
    if (gcsFile) {
      try {
        await gcsFile.delete();
      } catch (delErr) {
        logger.warn({ err: delErr, evidenceId: id }, '[evidence/confirm] Failed to delete oversized GCS object');
      }
    }
    res.status(400).json({ ok: false, error: 'Uploaded file exceeds the 10 MB size limit.' });
    return;
  }

  // Run AI evaluation (synchronous — ~2-5 seconds)
  let aiEval: AiEvaluation | null = null;
  let newTier = 'self_reported';

  try {
    aiEval = await evaluateEvidence(
      evidenceRow.storagePath,
      evidenceRow.mimeType,
      evidenceRow.originalFilename,
      evidenceRow.subSegLabel,
      evidenceRow.subSegHint,
    );
    newTier = aiEval.plausible_support ? 'ai_evaluated' : 'self_reported';
  } catch (aiErr) {
    logger.warn({ err: aiErr, evidenceId: id }, '[evidence/confirm] AI eval failed — keeping self_reported');
    const { message } = friendlyAIError(aiErr);
    logger.info({ message }, '[evidence/confirm] AI error detail');
  }

  // Update the row
  const [updated] = await db
    .update(maturityEvidenceTable)
    .set({
      confidenceTier: newTier,
      aiEvaluation:   aiEval ?? null,
    })
    .where(eq(maturityEvidenceTable.id, id))
    .returning();

  logger.info({ evidenceId: id, tier: newTier, plausible: aiEval?.plausible_support }, '[evidence] Confirmed');
  res.json({ ok: true, confidence_tier: updated.confidenceTier, ai_evaluation: updated.aiEvaluation });
});

/* ── GET /api/maturity/evidence ─────────────────────────────────────────── */

router.get('/maturity/evidence', requireSession, async (req, res) => {
  const userId = req.session.userId!;
  const snapshotId = Number(req.query.snapshot_id);
  if (!Number.isInteger(snapshotId) || snapshotId <= 0) {
    res.status(400).json({ ok: false, error: 'snapshot_id is required' });
    return;
  }
  try {
    const rows = await db
      .select({
        id:               maturityEvidenceTable.id,
        segId:            maturityEvidenceTable.segId,
        subSegId:         maturityEvidenceTable.subSegId,
        subSegLabel:      maturityEvidenceTable.subSegLabel,
        originalFilename: maturityEvidenceTable.originalFilename,
        mimeType:         maturityEvidenceTable.mimeType,
        confidenceTier:   maturityEvidenceTable.confidenceTier,
        aiEvaluation:     maturityEvidenceTable.aiEvaluation,
        createdAt:        maturityEvidenceTable.createdAt,
      })
      .from(maturityEvidenceTable)
      .where(and(
        eq(maturityEvidenceTable.userId,     userId),
        eq(maturityEvidenceTable.snapshotId, snapshotId),
      ));
    res.json({ ok: true, evidence: rows });
  } catch (err) {
    logger.error({ err }, '[evidence] List failed');
    res.status(500).json({ ok: false, error: 'Failed to list evidence' });
  }
});

/* ── DELETE /api/maturity/evidence/:id ──────────────────────────────────── */

router.delete('/maturity/evidence/:id', requireSession, async (req, res) => {
  const userId = req.session.userId!;
  const id     = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ ok: false, error: 'Invalid evidence id' });
    return;
  }

  const [row] = await db
    .select()
    .from(maturityEvidenceTable)
    .where(and(eq(maturityEvidenceTable.id, id), eq(maturityEvidenceTable.userId, userId)))
    .limit(1);

  if (!row) {
    res.status(404).json({ ok: false, error: 'Evidence not found' });
    return;
  }

  if (row.confidenceTier === 'consultant_validated') {
    res.status(403).json({ ok: false, error: 'Cannot remove consultant-validated evidence. Contact your consultant to release it.' });
    return;
  }

  // Delete GCS file (best-effort — don't fail if already gone)
  try {
    const file = await objectStorage.getObjectEntityFile(row.storagePath);
    await file.delete();
  } catch {
    // Object already gone or not found — proceed
  }

  await db.delete(maturityEvidenceTable).where(eq(maturityEvidenceTable.id, id));

  logger.info({ evidenceId: id, userId, segId: row.segId, subSegId: row.subSegId }, '[evidence] Deleted');
  res.status(204).send();
});

export default router;
