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
