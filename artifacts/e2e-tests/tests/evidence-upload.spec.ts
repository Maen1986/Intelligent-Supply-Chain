/**
 * E2E — Evidence upload flow on the Maturity results page.
 *
 * Scenario:
 *   A logged-in user reaches the results phase, opens the evidence accordion
 *   for the "Supply Chain Strategy & Design" segment, uploads a PDF, waits
 *   for the AI evaluation round-trip (mocked), and confirms that the
 *   "AI-verified ✓" badge appears.
 *
 * All API calls are intercepted via page.route().
 * Route ordering: Playwright is LIFO — register catch-all first so specific
 * handlers (registered after) take priority.
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

/* ── Fixtures ───────────────────────────────────────────────────────────────── */

/**
 * Answers for 12 segments × 5 questions.
 * CORE_SEGMENTS has 11 entries. Seeding 12 ensures all core segments are
 * complete regardless of exact count so the incomplete-segment guard
 * never fires. Using industry='' so no extra module is added.
 */
function buildAnswers(): Record<string, number> {
  const a: Record<string, number> = {};
  for (let s = 0; s < 12; s++) {
    for (let q = 0; q < 5; q++) {
      a[`${s}-${q}`] = 3;
    }
  }
  return a;
}

const MOCK_USER = {
  id: 1,
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'user',
  mobile: '+966500000001',
  designation: 'Supply Chain Manager',
  company: 'Acme Corp',
};

const MOCK_SNAPSHOT = {
  id: 42,
  userId: 1,
  overallScore: 3.0,
  overallLevel: 'Developing',
  segmentScores: [],
  createdAt: new Date().toISOString(),
};

const AI_EVALUATION = {
  plausible_support: true,
  confidence: 'high',
  flag_reason: null,
  summary: 'Document clearly supports the claimed maturity level.',
};

const EVIDENCE_RECORD = {
  id: 1,
  segId: 'strategy',
  subSegId: 'strategy-align',      // real subsegment ID from maturitySubSegData1to5
  subSegLabel: 'Strategic Alignment',
  originalFilename: 'strategy.pdf',
  mimeType: 'application/pdf',
  confidenceTier: 'ai_evaluated',
  aiEvaluation: AI_EVALUATION,
  createdAt: new Date().toISOString(),
};

/* ── Test ───────────────────────────────────────────────────────────────────── */

test('uploads a PDF and sees the AI-verified badge on the results page', async ({ page }) => {

  /* 1 — Catch-all first (registered first = lowest LIFO priority) */
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true }) }));

  /* 2 — Specific handlers (registered after = higher priority) */

  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true, user: MOCK_USER }) }));

  await page.route('**/api/maturity/snapshots', async (route) => {
    if (route.request().method() === 'POST') {
      // Component checks data.id (not data.snapshot.id) — see auto-save handler
      return route.fulfill({ status: 201, contentType: 'application/json',
        body: JSON.stringify({ ok: true, id: MOCK_SNAPSHOT.id }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true, snapshots: [MOCK_SNAPSHOT] }) });
  });

  /* Single handler for all /maturity/evidence* routes — dispatches by URL+method */
  let evidenceGetCount = 0;
  await page.route('**/api/maturity/evidence**', async (route) => {
    const url  = route.request().url();
    const meth = route.request().method();

    if (meth === 'POST' && url.includes('/confirm')) {
      // Pause 400 ms so the "AI evaluation in progress…" state is rendered long
      // enough for Playwright's 100 ms poll to catch it before transitioning to done.
      await new Promise(r => setTimeout(r, 400));
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ ok: true, confidence_tier: 'ai_evaluated',
          ai_evaluation: AI_EVALUATION }) });
    }
    if (meth === 'POST' && url.includes('/upload-url')) {
      return route.fulfill({ status: 201, contentType: 'application/json',
        body: JSON.stringify({ ok: true, evidence_id: 1,
          upload_url: 'https://storage.example.com/presigned-put' }) });
    }
    if (meth === 'GET') {
      evidenceGetCount++;
      const records = evidenceGetCount > 1 ? [EVIDENCE_RECORD] : [];
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ ok: true, evidence: records }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true }) });
  });

  /* GCS presigned PUT (external origin) */
  await page.route('https://storage.example.com/**', (route) =>
    route.fulfill({ status: 200 }));

  /* 3 — Seed localStorage before navigation
         industry='' prevents any extra industry module being added, keeping
         activeSegments = CORE_SEGMENTS (11).  Answers for indices 0-11
         ensure all segments are complete so the guard doesn't redirect.   */
  await page.addInitScript((draft: string) => {
    localStorage.setItem('maturity_draft_v2', draft);
  }, JSON.stringify({
    phase: 'results',
    answers: buildAnswers(),
    intakeData: { industry: '', companySize: 'enterprise' },
  }));

  /* 4 — Navigate */
  await page.goto('/maturity');

  /* 5 — Wait for the results container */
  await expect(page.locator('[data-testid="maturity-results"]')).toBeVisible({ timeout: 15_000 });

  /* 6 — Wait for and dismiss the feedback modal.
         The modal fires after a 2 500 ms setTimeout inside the results effect.
         It sets aria-hidden on the background, making the accordion invisible
         to Playwright.  We must wait for it to appear and then close it.    */
  const feedbackDialog = page.getByRole('dialog', { name: /how was your experience/i });
  try {
    await feedbackDialog.waitFor({ state: 'visible', timeout: 5_000 });
    await feedbackDialog.getByRole('button', { name: /not now/i }).click();
    await feedbackDialog.waitFor({ state: 'hidden', timeout: 3_000 });
  } catch {
    // Dialog did not appear — that is fine; proceed without dismissing.
  }

  /* 7 — Find and click the "Add supporting evidence" accordion
         (requires user ≠ null AND currentSnapshotId ≠ null — wait up to 10s
         for the auth + auto-save snapshot round-trip to complete)          */
  const accordionBtn = page.getByText('Add supporting evidence').first();
  await expect(accordionBtn).toBeVisible({ timeout: 10_000 });
  await accordionBtn.click();

  /* 8 — Upload zone text is now visible inside the open accordion */
  const uploadZone = page.getByText(
    'Add supporting evidence (optional) — PDF, Word, or image',
  ).first();
  await expect(uploadZone).toBeVisible({ timeout: 5_000 });

  /* 9 — Create a minimal valid-ish PDF in tmp */
  const pdfPath = path.join(os.tmpdir(), 'e2e-evidence.pdf');
  fs.writeFileSync(pdfPath, '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n');

  /* 10 — Trigger the hidden file input via the file chooser event */
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    uploadZone.click(),
  ]);
  await fileChooser.setFiles(pdfPath);

  /* 11 — Uploading → evaluating → done */
  await expect(page.getByText('Uploading…')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('AI evaluation in progress…')).toBeVisible({ timeout: 10_000 });

  /* 12 — AI-verified badge appears once evidence is confirmed */
  await expect(page.getByText('AI-verified ✓')).toBeVisible({ timeout: 10_000 });

  /* Cleanup */
  fs.unlinkSync(pdfPath);
});

/* ── Flagged-evidence test ──────────────────────────────────────────────────── */

const AI_EVALUATION_FLAGGED = {
  plausible_support: false,
  confidence: 'low',
  flag_reason: 'generic_template',
  summary: 'Document appears to be an unmodified generic template.',
};

const EVIDENCE_RECORD_FLAGGED = {
  id: 2,
  segId: 'strategy',
  subSegId: 'strategy-align',
  subSegLabel: 'Strategic Alignment',
  originalFilename: 'flagged.pdf',
  mimeType: 'application/pdf',
  confidenceTier: 'ai_evaluated',
  aiEvaluation: AI_EVALUATION_FLAGGED,
  createdAt: new Date().toISOString(),
};

test('uploads a PDF and sees the Flagged badge — not AI-verified — when plausible_support is false', async ({ page }) => {

  /* 1 — Catch-all first */
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true }) }));

  /* 2 — Specific handlers */

  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true, user: MOCK_USER }) }));

  await page.route('**/api/maturity/snapshots', async (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 201, contentType: 'application/json',
        body: JSON.stringify({ ok: true, id: MOCK_SNAPSHOT.id }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true, snapshots: [MOCK_SNAPSHOT] }) });
  });

  /* Evidence routes — confirm returns plausible_support: false */
  let evidenceGetCount = 0;
  await page.route('**/api/maturity/evidence**', async (route) => {
    const url  = route.request().url();
    const meth = route.request().method();

    if (meth === 'POST' && url.includes('/confirm')) {
      await new Promise(r => setTimeout(r, 400));
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          confidence_tier: 'ai_evaluated',
          ai_evaluation: AI_EVALUATION_FLAGGED,
        }) });
    }
    if (meth === 'POST' && url.includes('/upload-url')) {
      return route.fulfill({ status: 201, contentType: 'application/json',
        body: JSON.stringify({ ok: true, evidence_id: 2,
          upload_url: 'https://storage.example.com/presigned-put' }) });
    }
    if (meth === 'GET') {
      evidenceGetCount++;
      const records = evidenceGetCount > 1 ? [EVIDENCE_RECORD_FLAGGED] : [];
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ ok: true, evidence: records }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true }) });
  });

  /* GCS presigned PUT */
  await page.route('https://storage.example.com/**', (route) =>
    route.fulfill({ status: 200 }));

  /* 3 — Seed localStorage */
  await page.addInitScript((draft: string) => {
    localStorage.setItem('maturity_draft_v2', draft);
  }, JSON.stringify({
    phase: 'results',
    answers: buildAnswers(),
    intakeData: { industry: '', companySize: 'enterprise' },
  }));

  /* 4 — Navigate */
  await page.goto('/maturity');

  /* 5 — Wait for results */
  await expect(page.locator('[data-testid="maturity-results"]')).toBeVisible({ timeout: 15_000 });

  /* 6 — Dismiss feedback modal if it appears */
  const feedbackDialog = page.getByRole('dialog', { name: /how was your experience/i });
  try {
    await feedbackDialog.waitFor({ state: 'visible', timeout: 5_000 });
    await feedbackDialog.getByRole('button', { name: /not now/i }).click();
    await feedbackDialog.waitFor({ state: 'hidden', timeout: 3_000 });
  } catch {
    // Dialog did not appear — proceed.
  }

  /* 7 — Open accordion */
  const accordionBtn = page.getByText('Add supporting evidence').first();
  await expect(accordionBtn).toBeVisible({ timeout: 10_000 });
  await accordionBtn.click();

  /* 8 — Upload zone visible */
  const uploadZone = page.getByText(
    'Add supporting evidence (optional) — PDF, Word, or image',
  ).first();
  await expect(uploadZone).toBeVisible({ timeout: 5_000 });

  /* 9 — Create a minimal PDF */
  const pdfPath = path.join(os.tmpdir(), 'e2e-evidence-flagged.pdf');
  fs.writeFileSync(pdfPath, '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n');

  /* 10 — Trigger upload */
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    uploadZone.click(),
  ]);
  await fileChooser.setFiles(pdfPath);

  /* 11 — Progress states */
  await expect(page.getByText('Uploading…')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('AI evaluation in progress…')).toBeVisible({ timeout: 10_000 });

  /* 12 — Flagged badge must appear; AI-verified badge must NOT */
  await expect(page.getByText(/Flagged/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('AI-verified ✓')).not.toBeVisible();

  /* Cleanup */
  fs.unlinkSync(pdfPath);
});

/* ── Arabic Flagged-evidence test ──────────────────────────────────────────── */

test('Arabic mode: uploads a PDF and sees the Arabic Flagged badge — not AI-verified — when plausible_support is false', async ({ page }) => {

  /* 1 — Catch-all first */
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true }) }));

  /* 2 — Specific handlers */

  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true, user: MOCK_USER }) }));

  await page.route('**/api/maturity/snapshots', async (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 201, contentType: 'application/json',
        body: JSON.stringify({ ok: true, id: MOCK_SNAPSHOT.id }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true, snapshots: [MOCK_SNAPSHOT] }) });
  });

  /* Evidence routes — confirm returns plausible_support: false */
  let evidenceGetCount = 0;
  await page.route('**/api/maturity/evidence**', async (route) => {
    const url  = route.request().url();
    const meth = route.request().method();

    if (meth === 'POST' && url.includes('/confirm')) {
      await new Promise(r => setTimeout(r, 400));
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          confidence_tier: 'ai_evaluated',
          ai_evaluation: AI_EVALUATION_FLAGGED,
        }) });
    }
    if (meth === 'POST' && url.includes('/upload-url')) {
      return route.fulfill({ status: 201, contentType: 'application/json',
        body: JSON.stringify({ ok: true, evidence_id: 3,
          upload_url: 'https://storage.example.com/presigned-put' }) });
    }
    if (meth === 'GET') {
      evidenceGetCount++;
      const records = evidenceGetCount > 1 ? [{ ...EVIDENCE_RECORD_FLAGGED, id: 3 }] : [];
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ ok: true, evidence: records }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true }) });
  });

  /* GCS presigned PUT */
  await page.route('https://storage.example.com/**', (route) =>
    route.fulfill({ status: 200 }));

  /* 3 — Seed localStorage with Arabic language and results-phase draft */
  await page.addInitScript((draft: string) => {
    localStorage.setItem('isc-lang', 'ar');
    localStorage.setItem('maturity_draft_v2', draft);
  }, JSON.stringify({
    phase: 'results',
    answers: buildAnswers(),
    intakeData: { industry: '', companySize: 'enterprise' },
  }));

  /* 4 — Navigate */
  await page.goto('/maturity');

  /* 5 — Wait for results */
  await expect(page.locator('[data-testid="maturity-results"]')).toBeVisible({ timeout: 15_000 });

  /* 6 — Dismiss feedback modal if it appears (title differs by language) */
  const feedbackDialog = page.getByRole('dialog', { name: /how was your experience|كيف كانت تجربتك/i });
  try {
    await feedbackDialog.waitFor({ state: 'visible', timeout: 5_000 });
    const notNowBtn = feedbackDialog.getByRole('button').filter({ hasText: /not now|ليس الآن/i }).first();
    await notNowBtn.click();
    await feedbackDialog.waitFor({ state: 'hidden', timeout: 3_000 });
  } catch {
    // Dialog did not appear — proceed.
  }

  /* 7 — Open Arabic accordion trigger */
  const accordionBtn = page.getByText('إضافة أدلة داعمة').first();
  await expect(accordionBtn).toBeVisible({ timeout: 10_000 });
  await accordionBtn.click();

  /* 8 — Arabic upload zone is visible */
  const uploadZone = page.getByText(
    'أضف دليلاً داعماً (اختياري) — PDF، Word، أو صورة',
  ).first();
  await expect(uploadZone).toBeVisible({ timeout: 5_000 });

  /* 9 — Create a minimal PDF */
  const pdfPath = path.join(os.tmpdir(), 'e2e-evidence-ar-flagged.pdf');
  fs.writeFileSync(pdfPath, '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n');

  /* 10 — Trigger upload */
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    uploadZone.click(),
  ]);
  await fileChooser.setFiles(pdfPath);

  /* 11 — Progress states (Arabic labels) */
  await expect(page.getByText('جارٍ رفع الملف…')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('يُقيَّم بالذكاء الاصطناعي…')).toBeVisible({ timeout: 10_000 });

  /* 12 — Arabic Flagged badge must appear; Arabic AI-verified badge must NOT */
  await expect(page.getByText('مُحدَّد — نموذج عام غير مُعدَّل')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('مُتحقَّق منه بالذكاء الاصطناعي ✓')).not.toBeVisible();

  /* Cleanup */
  fs.unlinkSync(pdfPath);
});

test('re-upload: remove existing evidence and upload a replacement — badge appears again', async ({ page }) => {

  /* 1 — Catch-all first */
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true }) }));

  /* 2 — Auth */
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true, user: MOCK_USER }) }));

  /* 3 — Snapshots */
  await page.route('**/api/maturity/snapshots', async (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 201, contentType: 'application/json',
        body: JSON.stringify({ ok: true, id: MOCK_SNAPSHOT.id }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true, snapshots: [MOCK_SNAPSHOT] }) });
  });

  /* 4 — Evidence routes: GET cycles through 4 states, DELETE returns 204,
         upload-url issues id=1 then id=2 for the replacement, confirm works
         for both ids.
         GET sequence:
           call 1 → []               (initial page load — nothing uploaded yet)
           call 2 → [EVIDENCE_RECORD] (after first upload confirm → onChanged re-fetch)
           call 3 → []               (after remove → onChanged re-fetch)
           call 4 → [EVIDENCE_RECORD] (after second upload confirm → onChanged re-fetch)
  */
  let evidenceGetCount   = 0;
  let uploadUrlCallCount = 0;

  const EVIDENCE_RECORD_2 = { ...EVIDENCE_RECORD, id: 2, originalFilename: 'replacement.pdf' };

  await page.route('**/api/maturity/evidence**', async (route) => {
    const url  = route.request().url();
    const meth = route.request().method();

    if (meth === 'DELETE') {
      return route.fulfill({ status: 204 });
    }

    if (meth === 'POST' && url.includes('/confirm')) {
      await new Promise(r => setTimeout(r, 400));
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ ok: true, confidence_tier: 'ai_evaluated',
          ai_evaluation: AI_EVALUATION }) });
    }

    if (meth === 'POST' && url.includes('/upload-url')) {
      uploadUrlCallCount++;
      const evidenceId = uploadUrlCallCount === 1 ? 1 : 2;
      return route.fulfill({ status: 201, contentType: 'application/json',
        body: JSON.stringify({ ok: true, evidence_id: evidenceId,
          upload_url: 'https://storage.example.com/presigned-put' }) });
    }

    if (meth === 'GET') {
      evidenceGetCount++;
      let records: typeof EVIDENCE_RECORD[] = [];
      if (evidenceGetCount === 2) records = [EVIDENCE_RECORD];
      else if (evidenceGetCount === 4) records = [EVIDENCE_RECORD_2];
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ ok: true, evidence: records }) });
    }

    return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true }) });
  });

  /* 5 — GCS presigned PUT */
  await page.route('https://storage.example.com/**', (route) =>
    route.fulfill({ status: 200 }));

  /* 6 — Seed localStorage */
  await page.addInitScript((draft: string) => {
    localStorage.setItem('maturity_draft_v2', draft);
  }, JSON.stringify({
    phase: 'results',
    answers: buildAnswers(),
    intakeData: { industry: '', companySize: 'enterprise' },
  }));

  /* 7 — Navigate and wait for results */
  await page.goto('/maturity');
  await expect(page.locator('[data-testid="maturity-results"]')).toBeVisible({ timeout: 15_000 });

  /* 8 — Dismiss feedback modal if it appears */
  const feedbackDialog = page.getByRole('dialog', { name: /how was your experience/i });
  try {
    await feedbackDialog.waitFor({ state: 'visible', timeout: 5_000 });
    await feedbackDialog.getByRole('button', { name: /not now/i }).click();
    await feedbackDialog.waitFor({ state: 'hidden', timeout: 3_000 });
  } catch { /* did not appear */ }

  /* 9 — Open evidence accordion */
  const accordionBtn = page.getByText('Add supporting evidence').first();
  await expect(accordionBtn).toBeVisible({ timeout: 10_000 });
  await accordionBtn.click();

  /* 10 — Upload zone is visible */
  const uploadZone = page.getByText(
    'Add supporting evidence (optional) — PDF, Word, or image',
  ).first();
  await expect(uploadZone).toBeVisible({ timeout: 5_000 });

  /* 11 — First upload */
  const pdfPath = path.join(os.tmpdir(), 'e2e-evidence-reupload.pdf');
  fs.writeFileSync(pdfPath, '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n');

  const [chooser1] = await Promise.all([
    page.waitForEvent('filechooser'),
    uploadZone.click(),
  ]);
  await chooser1.setFiles(pdfPath);

  /* 12 — Wait for first AI-verified badge */
  await expect(page.getByText('Uploading…')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('AI evaluation in progress…')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('AI-verified ✓')).toBeVisible({ timeout: 10_000 });

  /* 13 — Click the remove (×) button */
  const removeBtn = page.getByRole('button', { name: /remove evidence/i }).first();
  await expect(removeBtn).toBeVisible({ timeout: 5_000 });
  await removeBtn.click();

  /* 14 — Upload zone reappears after removal */
  await expect(page.getByText(
    'Add supporting evidence (optional) — PDF, Word, or image',
  ).first()).toBeVisible({ timeout: 8_000 });

  /* 15 — Second upload (replacement file) */
  const replacementPath = path.join(os.tmpdir(), 'e2e-replacement.pdf');
  fs.writeFileSync(replacementPath, '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n');

  const uploadZone2 = page.getByText(
    'Add supporting evidence (optional) — PDF, Word, or image',
  ).first();

  const [chooser2] = await Promise.all([
    page.waitForEvent('filechooser'),
    uploadZone2.click(),
  ]);
  await chooser2.setFiles(replacementPath);

  /* 16 — AI-verified badge appears again for the replacement */
  await expect(page.getByText('Uploading…')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('AI evaluation in progress…')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('AI-verified ✓')).toBeVisible({ timeout: 10_000 });

  /* Cleanup */
  fs.unlinkSync(pdfPath);
  fs.unlinkSync(replacementPath);
});

/* ── Failed removal — error shown, badge stays visible ─────────────────── */

test('failed DELETE shows error message and keeps the AI-verified badge visible', async ({ page }) => {

  /* 1 — Catch-all first */
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true }) }));

  /* 2 — Auth */
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true, user: MOCK_USER }) }));

  /* 3 — Snapshots */
  await page.route('**/api/maturity/snapshots', async (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 201, contentType: 'application/json',
        body: JSON.stringify({ ok: true, id: MOCK_SNAPSHOT.id }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true, snapshots: [MOCK_SNAPSHOT] }) });
  });

  /* 4 — Evidence: GET always returns the AI-verified record; DELETE returns 500 */
  await page.route('**/api/maturity/evidence**', async (route) => {
    const meth = route.request().method();

    if (meth === 'DELETE') {
      return route.fulfill({ status: 500, contentType: 'application/json',
        body: JSON.stringify({ ok: false, error: 'Internal server error' }) });
    }
    if (meth === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ ok: true, evidence: [EVIDENCE_RECORD] }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true }) });
  });

  /* 5 — Seed localStorage */
  await page.addInitScript((draft: string) => {
    localStorage.setItem('maturity_draft_v2', draft);
  }, JSON.stringify({
    phase: 'results',
    answers: buildAnswers(),
    intakeData: { industry: '', companySize: 'enterprise' },
  }));

  /* 6 — Navigate and wait for results */
  await page.goto('/maturity');
  await expect(page.locator('[data-testid="maturity-results"]')).toBeVisible({ timeout: 15_000 });

  /* 7 — Dismiss feedback modal if it appears */
  const feedbackDialog = page.getByRole('dialog', { name: /how was your experience/i });
  try {
    await feedbackDialog.waitFor({ state: 'visible', timeout: 5_000 });
    await feedbackDialog.getByRole('button', { name: /not now/i }).click();
    await feedbackDialog.waitFor({ state: 'hidden', timeout: 3_000 });
  } catch { /* did not appear */ }

  /* 8 — Open evidence accordion */
  const accordionBtn = page.getByText('Add supporting evidence').first();
  await expect(accordionBtn).toBeVisible({ timeout: 10_000 });
  await accordionBtn.click();

  /* 9 — AI-verified badge is visible before attempting removal */
  await expect(page.getByText('AI-verified ✓')).toBeVisible({ timeout: 8_000 });

  /* 10 — Click the remove (×) button */
  const removeBtn = page.getByRole('button', { name: /remove evidence/i }).first();
  await expect(removeBtn).toBeVisible({ timeout: 5_000 });
  await removeBtn.click();

  /* 11 — Error message appears */
  await expect(page.getByText('Could not remove file. Please try again.')).toBeVisible({ timeout: 8_000 });

  /* 12 — AI-verified badge is still visible (badge was not removed) */
  await expect(page.getByText('AI-verified ✓')).toBeVisible();
});

/* ── Consultant-validated — remove button hidden ────────────────────────── */

const EVIDENCE_RECORD_CONSULTANT = {
  id: 10,
  segId: 'strategy',
  subSegId: 'strategy-align',
  subSegLabel: 'Strategic Alignment',
  originalFilename: 'consultant-validated.pdf',
  mimeType: 'application/pdf',
  confidenceTier: 'consultant_validated',
  aiEvaluation: null,
  createdAt: new Date().toISOString(),
};

test('remove button is absent when evidence is consultant-validated', async ({ page }) => {

  /* 1 — Catch-all first */
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true }) }));

  /* 2 — Auth */
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true, user: MOCK_USER }) }));

  /* 3 — Snapshots */
  await page.route('**/api/maturity/snapshots', async (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 201, contentType: 'application/json',
        body: JSON.stringify({ ok: true, id: MOCK_SNAPSHOT.id }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true, snapshots: [MOCK_SNAPSHOT] }) });
  });

  /* 4 — Evidence: always return the consultant-validated record */
  await page.route('**/api/maturity/evidence**', async (route) => {
    const meth = route.request().method();
    if (meth === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ ok: true, evidence: [EVIDENCE_RECORD_CONSULTANT] }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true }) });
  });

  /* 5 — Seed localStorage */
  await page.addInitScript((draft: string) => {
    localStorage.setItem('maturity_draft_v2', draft);
  }, JSON.stringify({
    phase: 'results',
    answers: buildAnswers(),
    intakeData: { industry: '', companySize: 'enterprise' },
  }));

  /* 6 — Navigate and wait for results */
  await page.goto('/maturity');
  await expect(page.locator('[data-testid="maturity-results"]')).toBeVisible({ timeout: 15_000 });

  /* 7 — Dismiss feedback modal if it appears */
  const feedbackDialog = page.getByRole('dialog', { name: /how was your experience/i });
  try {
    await feedbackDialog.waitFor({ state: 'visible', timeout: 5_000 });
    await feedbackDialog.getByRole('button', { name: /not now/i }).click();
    await feedbackDialog.waitFor({ state: 'hidden', timeout: 3_000 });
  } catch { /* did not appear */ }

  /* 8 — Open evidence accordion */
  const accordionBtn = page.getByText('Add supporting evidence').first();
  await expect(accordionBtn).toBeVisible({ timeout: 10_000 });
  await accordionBtn.click();

  /* 9 — Consultant-validated badge must appear */
  await expect(page.getByText('Consultant-validated')).toBeVisible({ timeout: 8_000 });

  /* 10 — Remove button must NOT be in the DOM */
  await expect(page.getByRole('button', { name: /remove evidence/i })).not.toBeAttached();
});

/* ── Parameterised flag_reason badge test ───────────────────────────────────── */

const FLAG_REASON_CASES: Array<{
  flag_reason: 'blank_or_irrelevant' | 'generic_template' | 'contradicts_claimed_level';
  expectedBadge: string;
}> = [
  { flag_reason: 'blank_or_irrelevant',        expectedBadge: 'Flagged — blank or irrelevant'        },
  { flag_reason: 'generic_template',            expectedBadge: 'Flagged — generic template'            },
  { flag_reason: 'contradicts_claimed_level',   expectedBadge: 'Flagged — contradicts claimed level'  },
];

for (const { flag_reason, expectedBadge } of FLAG_REASON_CASES) {
  test(`badge shows correct flag reason label for flag_reason="${flag_reason}"`, async ({ page }) => {

    const AI_EVAL_FLAGGED_VARIANT = {
      plausible_support: false,
      confidence: 'low' as const,
      flag_reason,
      summary: `Document flagged: ${flag_reason.replace(/_/g, ' ')}.`,
    };

    const EVIDENCE_RECORD_FLAGGED_VARIANT = {
      id: 10,
      segId: 'strategy',
      subSegId: 'strategy-align',
      subSegLabel: 'Strategic Alignment',
      originalFilename: `flagged-${flag_reason}.pdf`,
      mimeType: 'application/pdf',
      confidenceTier: 'ai_evaluated',
      aiEvaluation: AI_EVAL_FLAGGED_VARIANT,
      createdAt: new Date().toISOString(),
    };

    /* 1 — Catch-all */
    await page.route('**/api/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ ok: true }) }));

    /* 2 — Specific handlers */
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ ok: true, user: MOCK_USER }) }));

    await page.route('**/api/maturity/snapshots', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 201, contentType: 'application/json',
          body: JSON.stringify({ ok: true, id: MOCK_SNAPSHOT.id }) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ ok: true, snapshots: [MOCK_SNAPSHOT] }) });
    });

    let evidenceGetCount = 0;
    await page.route('**/api/maturity/evidence**', async (route) => {
      const url  = route.request().url();
      const meth = route.request().method();

      if (meth === 'POST' && url.includes('/confirm')) {
        await new Promise(r => setTimeout(r, 400));
        return route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            confidence_tier: 'ai_evaluated',
            ai_evaluation: AI_EVAL_FLAGGED_VARIANT,
          }) });
      }
      if (meth === 'POST' && url.includes('/upload-url')) {
        return route.fulfill({ status: 201, contentType: 'application/json',
          body: JSON.stringify({ ok: true, evidence_id: 10,
            upload_url: 'https://storage.example.com/presigned-put' }) });
      }
      if (meth === 'GET') {
        evidenceGetCount++;
        const records = evidenceGetCount > 1 ? [EVIDENCE_RECORD_FLAGGED_VARIANT] : [];
        return route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ ok: true, evidence: records }) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ ok: true }) });
    });

    await page.route('https://storage.example.com/**', (route) =>
      route.fulfill({ status: 200 }));

    /* 3 — Seed localStorage */
    await page.addInitScript((draft: string) => {
      localStorage.setItem('maturity_draft_v2', draft);
    }, JSON.stringify({
      phase: 'results',
      answers: buildAnswers(),
      intakeData: { industry: '', companySize: 'enterprise' },
    }));

    /* 4 — Navigate */
    await page.goto('/maturity');

    /* 5 — Wait for results */
    await expect(page.locator('[data-testid="maturity-results"]')).toBeVisible({ timeout: 15_000 });

    /* 6 — Dismiss feedback modal if it appears */
    const feedbackDialog = page.getByRole('dialog', { name: /how was your experience/i });
    try {
      await feedbackDialog.waitFor({ state: 'visible', timeout: 5_000 });
      await feedbackDialog.getByRole('button', { name: /not now/i }).click();
      await feedbackDialog.waitFor({ state: 'hidden', timeout: 3_000 });
    } catch {
      // Dialog did not appear — proceed.
    }

    /* 7 — Open evidence accordion */
    const accordionBtn = page.getByText('Add supporting evidence').first();
    await expect(accordionBtn).toBeVisible({ timeout: 10_000 });
    await accordionBtn.click();

    /* 8 — Upload zone visible */
    const uploadZone = page.getByText(
      'Add supporting evidence (optional) — PDF, Word, or image',
    ).first();
    await expect(uploadZone).toBeVisible({ timeout: 5_000 });

    /* 9 — Create a minimal PDF */
    const pdfPath = path.join(os.tmpdir(), `e2e-flagged-${flag_reason}.pdf`);
    fs.writeFileSync(pdfPath, '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n');

    /* 10 — Trigger upload */
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      uploadZone.click(),
    ]);
    await fileChooser.setFiles(pdfPath);

    /* 11 — Progress states */
    await expect(page.getByText('Uploading…')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('AI evaluation in progress…')).toBeVisible({ timeout: 10_000 });

    /* 12 — Exact badge label must match the flag_reason with underscores replaced by spaces */
    await expect(page.getByText(expectedBadge)).toBeVisible({ timeout: 10_000 });

    /* 13 — AI-verified badge must NOT appear */
    await expect(page.getByText('AI-verified ✓')).not.toBeVisible();

    /* Cleanup */
    fs.unlinkSync(pdfPath);
  });
}
