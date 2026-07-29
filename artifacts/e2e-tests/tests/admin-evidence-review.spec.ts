/**
 * E2E — Admin evidence review queue.
 *
 * Scenario:
 *   An admin navigates to /admin/evidence-review, sees an AI-evaluated record
 *   in the queue, clicks "Validate ✓", and confirms the status badge updates
 *   to "Consultant-validated".
 *
 * All API calls are intercepted via page.route().
 * Route ordering: Playwright is LIFO — register catch-all first so specific
 * handlers (registered after) take priority.
 *
 * Important: the page also renders a filter button labelled "Consultant-validated"
 * which matches /validate/i.  Always use exact text ('Validate ✓') or scope
 * locators to the table body when targeting the action button.
 */

import { test, expect } from '@playwright/test';

/* ── Fixtures ───────────────────────────────────────────────────────────────── */

const MOCK_ADMIN = {
  id: 2,
  email: 'admin@example.com',
  fullName: 'Administrator',
  role: 'admin',
  mobile: '+966500000002',
  designation: 'Administrator',
  company: 'I Supply Chain',
};

const AI_EVALUATED_RECORD = {
  id: 1,
  userId: 10,
  snapshotId: 42,
  segId: 'strategy',
  subSegId: 'strategy-sub-1',
  subSegLabel: 'Supply Chain Strategy Document',
  originalFilename: 'strategy-doc.pdf',
  mimeType: 'application/pdf',
  storagePath: '/objects/maturity-evidence/10/42/strategy/strategy-sub-1/uuid.pdf',
  confidenceTier: 'ai_evaluated',
  aiEvaluation: {
    plausible_support: true,
    confidence: 'high',
    flag_reason: null,
    summary: 'Document clearly evidences the claimed maturity level.',
  },
  consultantNotes: null,
  reviewedBy: null,
  reviewedAt: null,
  createdAt: new Date(Date.now() - 3600_000).toISOString(),
};

const VALIDATED_RECORD = {
  ...AI_EVALUATED_RECORD,
  confidenceTier: 'consultant_validated',
  consultantNotes: 'Reviewed and approved.',
  reviewedBy: 2,
  reviewedAt: new Date().toISOString(),
};

/* ── Test ───────────────────────────────────────────────────────────────────── */

test('admin validates an AI-evaluated record and sees Consultant-validated badge', async ({ page }) => {

  /* 1 — Catch-all first (registered first = lowest LIFO priority) */
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true }) }));

  /* 2 — Auth: admin session */
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true, user: MOCK_ADMIN }) }));

  /* 3 — Single handler for all /admin/evidence-review* routes.
         Dispatching internally by method and path avoids any glob-overlap
         ambiguity between the list endpoint and the /:id PATCH endpoint.
         fetchCount tracks list GETs: first call returns AI-evaluated data,
         subsequent calls return the consultant-validated data.              */
  let fetchCount = 0;

  await page.route('**/api/admin/evidence-review**', async (route) => {
    const url    = route.request().url();
    const method = route.request().method();

    /* PATCH /admin/evidence-review/:id  — consultant validation decision */
    if (method === 'PATCH') {
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          id: VALIDATED_RECORD.id,
          confidence_tier: 'consultant_validated',
        }) });
    }

    /* GET /admin/evidence-review  — list (no numeric id segment after path) */
    if (method === 'GET' && !url.match(/\/admin\/evidence-review\/\d+/)) {
      fetchCount++;
      const records = fetchCount > 1 ? [VALIDATED_RECORD] : [AI_EVALUATED_RECORD];
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ ok: true, records, total: records.length }) });
    }

    return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ ok: true }) });
  });

  /* 4 — Navigate to the admin review queue */
  await page.goto('/admin/evidence-review');

  /* 5 — Page header */
  await expect(page.getByText('Evidence Review Queue')).toBeVisible({ timeout: 10_000 });

  /* 6 — The AI-evaluated record row is present */
  await expect(page.getByText('strategy-doc.pdf')).toBeVisible({ timeout: 8_000 });

  /* 7 — Status badge shows "AI-evaluated" initially */
  await expect(page.getByText('AI-evaluated').first()).toBeVisible();

  /* 8 — Click the action "Validate ✓" button in the table row.
         Using exact text avoids matching the "Consultant-validated" filter
         button whose label also contains the substring "validate".          */
  const validateBtn = page.getByRole('button', { name: 'Validate ✓' }).first();
  await expect(validateBtn).toBeVisible();
  await validateBtn.click();

  /* 9 — After PATCH + re-fetch, the status badge changes to Consultant-validated
         in the STATUS column of the table row.                               */
  // Scope to the table to avoid matching the filter button of the same label
  await expect(
    page.locator('table').getByText('Consultant-validated').first()
  ).toBeVisible({ timeout: 10_000 });

  /* 10 — With confidenceTier = consultant_validated the action button is gone */
  await expect(page.getByRole('button', { name: 'Validate ✓' })).toHaveCount(0);
});
