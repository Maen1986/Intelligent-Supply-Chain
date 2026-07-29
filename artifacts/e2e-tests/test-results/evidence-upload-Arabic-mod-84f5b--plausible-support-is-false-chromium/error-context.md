# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: evidence-upload.spec.ts >> Arabic mode: uploads a PDF and sees the Arabic Flagged badge — not AI-verified — when plausible_support is false
- Location: tests/evidence-upload.spec.ts:338:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:18807/maturity
Call log:
  - navigating to "http://localhost:18807/maturity", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "This site can’t be reached" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - strong [ref=e9]: localhost
      - text: refused to connect.
    - generic [ref=e10]:
      - paragraph [ref=e11]: "Try:"
      - list [ref=e12]:
        - listitem [ref=e13]: Checking the connection
        - listitem [ref=e14]:
          - link "Checking the proxy and the firewall" [ref=e15] [cursor=pointer]:
            - /url: "#buttons"
    - generic [ref=e16]: ERR_CONNECTION_REFUSED
  - generic [ref=e17]:
    - button "Reload" [ref=e19] [cursor=pointer]
    - button "Details" [ref=e20] [cursor=pointer]
```

# Test source

```ts
  305 |   await accordionBtn.click();
  306 | 
  307 |   /* 8 — Upload zone visible */
  308 |   const uploadZone = page.getByText(
  309 |     'Add supporting evidence (optional) — PDF, Word, or image',
  310 |   ).first();
  311 |   await expect(uploadZone).toBeVisible({ timeout: 5_000 });
  312 | 
  313 |   /* 9 — Create a minimal PDF */
  314 |   const pdfPath = path.join(os.tmpdir(), 'e2e-evidence-flagged.pdf');
  315 |   fs.writeFileSync(pdfPath, '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n');
  316 | 
  317 |   /* 10 — Trigger upload */
  318 |   const [fileChooser] = await Promise.all([
  319 |     page.waitForEvent('filechooser'),
  320 |     uploadZone.click(),
  321 |   ]);
  322 |   await fileChooser.setFiles(pdfPath);
  323 | 
  324 |   /* 11 — Progress states */
  325 |   await expect(page.getByText('Uploading…')).toBeVisible({ timeout: 5_000 });
  326 |   await expect(page.getByText('AI evaluation in progress…')).toBeVisible({ timeout: 10_000 });
  327 | 
  328 |   /* 12 — Flagged badge must appear; AI-verified badge must NOT */
  329 |   await expect(page.getByText(/Flagged/)).toBeVisible({ timeout: 10_000 });
  330 |   await expect(page.getByText('AI-verified ✓')).not.toBeVisible();
  331 | 
  332 |   /* Cleanup */
  333 |   fs.unlinkSync(pdfPath);
  334 | });
  335 | 
  336 | /* ── Arabic Flagged-evidence test ──────────────────────────────────────────── */
  337 | 
  338 | test('Arabic mode: uploads a PDF and sees the Arabic Flagged badge — not AI-verified — when plausible_support is false', async ({ page }) => {
  339 | 
  340 |   /* 1 — Catch-all first */
  341 |   await page.route('**/api/**', (route) =>
  342 |     route.fulfill({ status: 200, contentType: 'application/json',
  343 |       body: JSON.stringify({ ok: true }) }));
  344 | 
  345 |   /* 2 — Specific handlers */
  346 | 
  347 |   await page.route('**/api/auth/me', (route) =>
  348 |     route.fulfill({ status: 200, contentType: 'application/json',
  349 |       body: JSON.stringify({ ok: true, user: MOCK_USER }) }));
  350 | 
  351 |   await page.route('**/api/maturity/snapshots', async (route) => {
  352 |     if (route.request().method() === 'POST') {
  353 |       return route.fulfill({ status: 201, contentType: 'application/json',
  354 |         body: JSON.stringify({ ok: true, id: MOCK_SNAPSHOT.id }) });
  355 |     }
  356 |     return route.fulfill({ status: 200, contentType: 'application/json',
  357 |       body: JSON.stringify({ ok: true, snapshots: [MOCK_SNAPSHOT] }) });
  358 |   });
  359 | 
  360 |   /* Evidence routes — confirm returns plausible_support: false */
  361 |   let evidenceGetCount = 0;
  362 |   await page.route('**/api/maturity/evidence**', async (route) => {
  363 |     const url  = route.request().url();
  364 |     const meth = route.request().method();
  365 | 
  366 |     if (meth === 'POST' && url.includes('/confirm')) {
  367 |       await new Promise(r => setTimeout(r, 400));
  368 |       return route.fulfill({ status: 200, contentType: 'application/json',
  369 |         body: JSON.stringify({
  370 |           ok: true,
  371 |           confidence_tier: 'ai_evaluated',
  372 |           ai_evaluation: AI_EVALUATION_FLAGGED,
  373 |         }) });
  374 |     }
  375 |     if (meth === 'POST' && url.includes('/upload-url')) {
  376 |       return route.fulfill({ status: 201, contentType: 'application/json',
  377 |         body: JSON.stringify({ ok: true, evidence_id: 3,
  378 |           upload_url: 'https://storage.example.com/presigned-put' }) });
  379 |     }
  380 |     if (meth === 'GET') {
  381 |       evidenceGetCount++;
  382 |       const records = evidenceGetCount > 1 ? [{ ...EVIDENCE_RECORD_FLAGGED, id: 3 }] : [];
  383 |       return route.fulfill({ status: 200, contentType: 'application/json',
  384 |         body: JSON.stringify({ ok: true, evidence: records }) });
  385 |     }
  386 |     return route.fulfill({ status: 200, contentType: 'application/json',
  387 |       body: JSON.stringify({ ok: true }) });
  388 |   });
  389 | 
  390 |   /* GCS presigned PUT */
  391 |   await page.route('https://storage.example.com/**', (route) =>
  392 |     route.fulfill({ status: 200 }));
  393 | 
  394 |   /* 3 — Seed localStorage with Arabic language and results-phase draft */
  395 |   await page.addInitScript((draft: string) => {
  396 |     localStorage.setItem('isc-lang', 'ar');
  397 |     localStorage.setItem('maturity_draft_v2', draft);
  398 |   }, JSON.stringify({
  399 |     phase: 'results',
  400 |     answers: buildAnswers(),
  401 |     intakeData: { industry: '', companySize: 'enterprise' },
  402 |   }));
  403 | 
  404 |   /* 4 — Navigate */
> 405 |   await page.goto('/maturity');
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:18807/maturity
  406 | 
  407 |   /* 5 — Wait for results */
  408 |   await expect(page.locator('[data-testid="maturity-results"]')).toBeVisible({ timeout: 15_000 });
  409 | 
  410 |   /* 6 — Dismiss feedback modal if it appears (title differs by language) */
  411 |   const feedbackDialog = page.getByRole('dialog', { name: /how was your experience|كيف كانت تجربتك/i });
  412 |   try {
  413 |     await feedbackDialog.waitFor({ state: 'visible', timeout: 5_000 });
  414 |     const notNowBtn = feedbackDialog.getByRole('button').filter({ hasText: /not now|ليس الآن/i }).first();
  415 |     await notNowBtn.click();
  416 |     await feedbackDialog.waitFor({ state: 'hidden', timeout: 3_000 });
  417 |   } catch {
  418 |     // Dialog did not appear — proceed.
  419 |   }
  420 | 
  421 |   /* 7 — Open Arabic accordion trigger */
  422 |   const accordionBtn = page.getByText('إضافة أدلة داعمة').first();
  423 |   await expect(accordionBtn).toBeVisible({ timeout: 10_000 });
  424 |   await accordionBtn.click();
  425 | 
  426 |   /* 8 — Arabic upload zone is visible */
  427 |   const uploadZone = page.getByText(
  428 |     'أضف دليلاً داعماً (اختياري) — PDF، Word، أو صورة',
  429 |   ).first();
  430 |   await expect(uploadZone).toBeVisible({ timeout: 5_000 });
  431 | 
  432 |   /* 9 — Create a minimal PDF */
  433 |   const pdfPath = path.join(os.tmpdir(), 'e2e-evidence-ar-flagged.pdf');
  434 |   fs.writeFileSync(pdfPath, '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n');
  435 | 
  436 |   /* 10 — Trigger upload */
  437 |   const [fileChooser] = await Promise.all([
  438 |     page.waitForEvent('filechooser'),
  439 |     uploadZone.click(),
  440 |   ]);
  441 |   await fileChooser.setFiles(pdfPath);
  442 | 
  443 |   /* 11 — Progress states (Arabic labels) */
  444 |   await expect(page.getByText('جارٍ رفع الملف…')).toBeVisible({ timeout: 5_000 });
  445 |   await expect(page.getByText('يُقيَّم بالذكاء الاصطناعي…')).toBeVisible({ timeout: 10_000 });
  446 | 
  447 |   /* 12 — Arabic Flagged badge must appear; Arabic AI-verified badge must NOT */
  448 |   await expect(page.getByText('مُحدَّد — نموذج عام غير مُعدَّل')).toBeVisible({ timeout: 10_000 });
  449 |   await expect(page.getByText('مُتحقَّق منه بالذكاء الاصطناعي ✓')).not.toBeVisible();
  450 | 
  451 |   /* Cleanup */
  452 |   fs.unlinkSync(pdfPath);
  453 | });
  454 | 
  455 | test('re-upload: remove existing evidence and upload a replacement — badge appears again', async ({ page }) => {
  456 | 
  457 |   /* 1 — Catch-all first */
  458 |   await page.route('**/api/**', (route) =>
  459 |     route.fulfill({ status: 200, contentType: 'application/json',
  460 |       body: JSON.stringify({ ok: true }) }));
  461 | 
  462 |   /* 2 — Auth */
  463 |   await page.route('**/api/auth/me', (route) =>
  464 |     route.fulfill({ status: 200, contentType: 'application/json',
  465 |       body: JSON.stringify({ ok: true, user: MOCK_USER }) }));
  466 | 
  467 |   /* 3 — Snapshots */
  468 |   await page.route('**/api/maturity/snapshots', async (route) => {
  469 |     if (route.request().method() === 'POST') {
  470 |       return route.fulfill({ status: 201, contentType: 'application/json',
  471 |         body: JSON.stringify({ ok: true, id: MOCK_SNAPSHOT.id }) });
  472 |     }
  473 |     return route.fulfill({ status: 200, contentType: 'application/json',
  474 |       body: JSON.stringify({ ok: true, snapshots: [MOCK_SNAPSHOT] }) });
  475 |   });
  476 | 
  477 |   /* 4 — Evidence routes: GET cycles through 4 states, DELETE returns 204,
  478 |          upload-url issues id=1 then id=2 for the replacement, confirm works
  479 |          for both ids.
  480 |          GET sequence:
  481 |            call 1 → []               (initial page load — nothing uploaded yet)
  482 |            call 2 → [EVIDENCE_RECORD] (after first upload confirm → onChanged re-fetch)
  483 |            call 3 → []               (after remove → onChanged re-fetch)
  484 |            call 4 → [EVIDENCE_RECORD] (after second upload confirm → onChanged re-fetch)
  485 |   */
  486 |   let evidenceGetCount   = 0;
  487 |   let uploadUrlCallCount = 0;
  488 | 
  489 |   const EVIDENCE_RECORD_2 = { ...EVIDENCE_RECORD, id: 2, originalFilename: 'replacement.pdf' };
  490 | 
  491 |   await page.route('**/api/maturity/evidence**', async (route) => {
  492 |     const url  = route.request().url();
  493 |     const meth = route.request().method();
  494 | 
  495 |     if (meth === 'DELETE') {
  496 |       return route.fulfill({ status: 204 });
  497 |     }
  498 | 
  499 |     if (meth === 'POST' && url.includes('/confirm')) {
  500 |       await new Promise(r => setTimeout(r, 400));
  501 |       return route.fulfill({ status: 200, contentType: 'application/json',
  502 |         body: JSON.stringify({ ok: true, confidence_tier: 'ai_evaluated',
  503 |           ai_evaluation: AI_EVALUATION }) });
  504 |     }
  505 | 
```