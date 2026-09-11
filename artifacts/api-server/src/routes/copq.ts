/**
 * /api/copq -- real backend persistence for the Supplier COPQ Operational
 * tier (Supplier Lifecycle Governance build, Item 1, 11 Sep 2026).
 *
 * GET  /api/copq/ledger  -- the authenticated user's full COPQ ledger
 *   history, newest first. Append-only: every row that was ever written is
 *   returned, including superseded corrections for the same period, so the
 *   audit trail is never hidden.
 * POST /api/copq/ledger  -- insert ONE new ledger entry (never a whole-state
 *   replace -- see copqLedger.ts's schema header for why). The server, not
 *   the client, computes the alert outcome against the latest prior entry
 *   for a DIFFERENT period (never trust a client-supplied alert flag), and
 *   -- when triggered -- writes a companion row into findings_actions
 *   (source: 'copq') so it surfaces on the cross-engine command-centre view,
 *   per the client-confirmed decision to fold action items into that
 *   existing table rather than building a parallel one here.
 *
 * Advisory tier note: this route is opt-in. A client on the Advisory tier
 * never calls it -- artifacts/i-supply-chain/src/lib/supplierCOPQ.ts's
 * computeCOPQRollup() runs fresh in the browser/consultancy session with
 * zero persistence. Nothing here is required for the Advisory tier to work.
 *
 * STANDALONE-FIRST NOTE: this route does not import from the frontend
 * package (artifacts/i-supply-chain) -- same precedent already set by
 * maturityRemedies.ts, which defines its own local types rather than
 * reaching into the frontend. detectCOPQAlert() below is therefore a
 * disclosed, manually-synced MIRROR of the canonical implementation in
 * artifacts/i-supply-chain/src/lib/supplierCOPQ.ts (same two signals, same
 * client-configurable threshold, same strict-`>` boundary behavior) -- not a
 * separate methodology. If the canonical threshold logic changes, this copy
 * must be updated in the same change, same discipline already applied to
 * every other mirrored type in this codebase (see supplierRecoveryPortfolio.
 * ts's header for the established precedent of this exact technique).
 */
import { Router } from 'express';
import { db } from '@workspace/db';
import { copqLedgerTable, findingsActionsTable, usersTable } from '@workspace/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireSession } from '../middlewares/requireSession';
import { logger } from '../lib/logger';

const router = Router();
router.use(requireSession);

/** Minimal mirror of supplierCOPQ.ts's COPQRollup -- only the fields the
 *  server-side alert check actually needs. The full object is still stored
 *  verbatim in the `data` jsonb column; this interface is not a schema. */
interface COPQRollupForAlert {
  periodLabel: string;
  internalFailure: { carCount: number };
  externalFailure: { carCount: number };
  totalCostedUSD: number | null;
}

interface COPQAlertResult {
  triggered: boolean;
  reason: 'external-failure-share-increased' | 'total-costed-copq-increased' | 'none';
  messageEn: string;
  messageAr: string;
}

/** Mirror of supplierCOPQ.ts's detectCOPQAlert() -- see file header. */
function detectCOPQAlert(
  current: COPQRollupForAlert,
  prior: COPQRollupForAlert | null,
  increasePctThreshold = 15
): COPQAlertResult {
  if (!prior) {
    return {
      triggered: false,
      reason: 'none',
      messageEn: 'No prior period to compare against — alerting begins from the second recorded period onward.',
      messageAr: 'لا توجد فترة سابقة للمقارنة — يبدأ التنبيه اعتبارًا من الفترة الثانية المسجَّلة.',
    };
  }

  const currentTotalClassified = current.internalFailure.carCount + current.externalFailure.carCount;
  const priorTotalClassified = prior.internalFailure.carCount + prior.externalFailure.carCount;
  const currentExternalShare = currentTotalClassified > 0 ? current.externalFailure.carCount / currentTotalClassified : null;
  const priorExternalShare = priorTotalClassified > 0 ? prior.externalFailure.carCount / priorTotalClassified : null;

  if (currentExternalShare !== null && priorExternalShare !== null && currentExternalShare > priorExternalShare) {
    const curPct = Math.round(currentExternalShare * 1000) / 10;
    const priorPct = Math.round(priorExternalShare * 1000) / 10;
    return {
      triggered: true,
      reason: 'external-failure-share-increased',
      messageEn: `External Failure's share of classified CARs rose from ${priorPct}% (${prior.periodLabel}) to ${curPct}% (${current.periodLabel}) — per the PAF model, a rising external-failure share is the leading indicator that a quality issue is starting to reach customers more often, not less.`,
      messageAr: `ارتفعت حصة الفشل الخارجي من إجمالي الطلبات المصنّفة من ${priorPct}% (${prior.periodLabel}) إلى ${curPct}% (${current.periodLabel}) — وفق نموذج PAF، يُعدّ ارتفاع حصة الفشل الخارجي مؤشرًا رائدًا على أن مشكلة الجودة بدأت تصل إلى العملاء بشكل أكبر، لا أقل.`,
    };
  }

  if (current.totalCostedUSD !== null && prior.totalCostedUSD !== null && prior.totalCostedUSD > 0) {
    const pctChange = ((current.totalCostedUSD - prior.totalCostedUSD) / prior.totalCostedUSD) * 100;
    if (pctChange > increasePctThreshold) {
      return {
        triggered: true,
        reason: 'total-costed-copq-increased',
        messageEn: `Costed COPQ rose ${Math.round(pctChange * 10) / 10}% from ${prior.periodLabel} ($${prior.totalCostedUSD.toLocaleString()}) to ${current.periodLabel} ($${current.totalCostedUSD.toLocaleString()}) — above the configured ${increasePctThreshold}% threshold.`,
        messageAr: `ارتفعت تكلفة الجودة الرديئة المكلَّفة (COPQ) بنسبة ${Math.round(pctChange * 10) / 10}% من ${prior.periodLabel} (${prior.totalCostedUSD.toLocaleString()} دولار) إلى ${current.periodLabel} (${current.totalCostedUSD.toLocaleString()} دولار) — أعلى من الحد المعدّ مسبقًا وهو ${increasePctThreshold}%.`,
      };
    }
  }

  return {
    triggered: false,
    reason: 'none',
    messageEn: `No threshold-crossing signal between ${prior.periodLabel} and ${current.periodLabel}.`,
    messageAr: `لا توجد إشارة تجاوز حد بين ${prior.periodLabel} و${current.periodLabel}.`,
  };
}

interface LedgerEntryPayload {
  periodLabel: string;
  data: COPQRollupForAlert & Record<string, unknown>;
}

function isValidPayload(a: unknown): a is LedgerEntryPayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  if (typeof r.periodLabel !== 'string' || r.periodLabel.length === 0) return false;
  if (typeof r.data !== 'object' || r.data === null || Array.isArray(r.data)) return false;
  const d = r.data as Record<string, unknown>;
  const hasCarCount = (v: unknown): v is { carCount: number } =>
    typeof v === 'object' && v !== null && typeof (v as { carCount?: unknown }).carCount === 'number';
  return hasCarCount(d.internalFailure) && hasCarCount(d.externalFailure)
    && (typeof d.totalCostedUSD === 'number' || d.totalCostedUSD === null);
}

/* ─── GET /api/copq/ledger ────────────────────────────────────────────────────────── */

router.get('/ledger', async (_req, res) => {
  try {
    const userId = res.locals.userId as number;
    const rows = await db
      .select()
      .from(copqLedgerTable)
      .where(eq(copqLedgerTable.userId, userId))
      .orderBy(desc(copqLedgerTable.createdAt));
    res.json({ ok: true, entries: rows });
  } catch (err) {
    logger.error({ err }, '[copq/ledger] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── POST /api/copq/ledger ──────────────────────────────────────────────────────── */

router.post('/ledger', async (req, res) => {
  const body = req.body as unknown;
  if (!isValidPayload(body)) {
    res.status(400).json({ ok: false, error: 'Invalid ledger entry shape -- expected {periodLabel, data: {internalFailure:{carCount}, externalFailure:{carCount}, totalCostedUSD}}' });
    return;
  }
  try {
    const userId = res.locals.userId as number;

    const [userRow] = await db
      .select({ organizationId: usersTable.organizationId })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    const organizationId = userRow?.organizationId ?? null;

    // Latest prior entry for a DIFFERENT period -- a correction row for the
    // SAME period must never be compared against itself for trend alerting.
    const priorRows = await db
      .select()
      .from(copqLedgerTable)
      .where(eq(copqLedgerTable.userId, userId))
      .orderBy(desc(copqLedgerTable.createdAt))
      .limit(50); // ledger history is expected to be small; 50 is a generous look-back
    const priorRow = priorRows.find((r) => r.periodLabel !== body.periodLabel);
    const priorRollup = priorRow ? (priorRow.data as COPQRollupForAlert) : null;

    const alert = detectCOPQAlert(body.data, priorRollup);

    const [inserted] = await db
      .insert(copqLedgerTable)
      .values({
        userId,
        organizationId,
        periodLabel: body.periodLabel,
        data: body.data,
        alerted: alert.triggered,
        alertReason: alert.triggered ? alert.reason : null,
      })
      .returning();

    if (alert.triggered && inserted) {
      await db.insert(findingsActionsTable).values({
        userId,
        organizationId,
        source: 'copq',
        sourceRefId: inserted.id,
        sourceRefKey: null,
        itemKey: `copq-alert-${inserted.id}`,
        phase: null,
        segmentTitle: 'Cost of Poor Quality',
        action: alert.messageEn,
        framework: 'PAF (Prevention-Appraisal-Failure) — ASQ quality-cost standard',
        measurableTarget: 'Review the period-over-period COPQ trend and confirm whether the flagged movement reflects a real supplier issue or a one-off.',
        status: 'not_started',
        notes: alert.messageAr,
      });
    }

    logger.info({ userId, entryId: inserted?.id, alerted: alert.triggered }, '[copq/ledger] Entry recorded');
    res.json({ ok: true, entry: inserted, alert });
  } catch (err) {
    logger.error({ err }, '[copq/ledger] POST failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
