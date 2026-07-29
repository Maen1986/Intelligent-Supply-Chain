# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: evidence-upload.spec.ts >> re-upload: remove existing evidence and upload a replacement — badge appears again
- Location: tests/evidence-upload.spec.ts:455:1

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
  506 |     if (meth === 'POST' && url.includes('/upload-url')) {
  507 |       uploadUrlCallCount++;
  508 |       const evidenceId = uploadUrlCallCount === 1 ? 1 : 2;
  509 |       return route.fulfill({ status: 201, contentType: 'application/json',
  510 |         body: JSON.stringify({ ok: true, evidence_id: evidenceId,
  511 |           upload_url: 'https://storage.example.com/presigned-put' }) });
  512 |     }
  513 | 
  514 |     if (meth === 'GET') {
  515 |       evidenceGetCount++;
  516 |       let records: typeof EVIDENCE_RECORD[] = [];
  517 |       if (evidenceGetCount === 2) records = [EVIDENCE_RECORD];
  518 |       else if (evidenceGetCount === 4) records = [EVIDENCE_RECORD_2];
  519 |       return route.fulfill({ status: 200, contentType: 'application/json',
  520 |         body: JSON.stringify({ ok: true, evidence: records }) });
  521 |     }
  522 | 
  523 |     return route.fulfill({ status: 200, contentType: 'application/json',
  524 |       body: JSON.stringify({ ok: true }) });
  525 |   });
  526 | 
  527 |   /* 5 — GCS presigned PUT */
  528 |   await page.route('https://storage.example.com/**', (route) =>
  529 |     route.fulfill({ status: 200 }));
  530 | 
  531 |   /* 6 — Seed localStorage */
  532 |   await page.addInitScript((draft: string) => {
  533 |     localStorage.setItem('maturity_draft_v2', draft);
  534 |   }, JSON.stringify({
  535 |     phase: 'results',
  536 |     answers: buildAnswers(),
  537 |     intakeData: { industry: '', companySize: 'enterprise' },
  538 |   }));
  539 | 
  540 |   /* 7 — Navigate and wait for results */
> 541 |   await page.goto('/maturity');
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:18807/maturity
  542 |   await expect(page.locator('[data-testid="maturity-results"]')).toBeVisible({ timeout: 15_000 });
  543 | 
  544 |   /* 8 — Dismiss feedback modal if it appears */
  545 |   const feedbackDialog = page.getByRole('dialog', { name: /how was your experience/i });
  546 |   try {
  547 |     await feedbackDialog.waitFor({ state: 'visible', timeout: 5_000 });
  548 |     await feedbackDialog.getByRole('button', { name: /not now/i }).click();
  549 |     await feedbackDialog.waitFor({ state: 'hidden', timeout: 3_000 });
  550 |   } catch { /* did not appear */ }
  551 | 
  552 |   /* 9 — Open evidence accordion */
  553 |   const accordionBtn = page.getByText('Add supporting evidence').first();
  554 |   await expect(accordionBtn).toBeVisible({ timeout: 10_000 });
  555 |   await accordionBtn.click();
  556 | 
  557 |   /* 10 — Upload zone is visible */
  558 |   const uploadZone = page.getByText(
  559 |     'Add supporting evidence (optional) — PDF, Word, or image',
  560 |   ).first();
  561 |   await expect(uploadZone).toBeVisible({ timeout: 5_000 });
  562 | 
  563 |   /* 11 — First upload */
  564 |   const pdfPath = path.join(os.tmpdir(), 'e2e-evidence-reupload.pdf');
  565 |   fs.writeFileSync(pdfPath, '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n');
  566 | 
  567 |   const [chooser1] = await Promise.all([
  568 |     page.waitForEvent('filechooser'),
  569 |     uploadZone.click(),
  570 |   ]);
  571 |   await chooser1.setFiles(pdfPath);
  572 | 
  573 |   /* 12 — Wait for first AI-verified badge */
  574 |   await expect(page.getByText('Uploading…')).toBeVisible({ timeout: 5_000 });
  575 |   await expect(page.getByText('AI evaluation in progress…')).toBeVisible({ timeout: 10_000 });
  576 |   await expect(page.getByText('AI-verified ✓')).toBeVisible({ timeout: 10_000 });
  577 | 
  578 |   /* 13 — Click the remove (×) button */
  579 |   const removeBtn = page.getByRole('button', { name: /remove evidence/i }).first();
  580 |   await expect(removeBtn).toBeVisible({ timeout: 5_000 });
  581 |   await removeBtn.click();
  582 | 
  583 |   /* 14 — Upload zone reappears after removal */
  584 |   await expect(page.getByText(
  585 |     'Add supporting evidence (optional) — PDF, Word, or image',
  586 |   ).first()).toBeVisible({ timeout: 8_000 });
  587 | 
  588 |   /* 15 — Second upload (replacement file) */
  589 |   const replacementPath = path.join(os.tmpdir(), 'e2e-replacement.pdf');
  590 |   fs.writeFileSync(replacementPath, '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n');
  591 | 
  592 |   const uploadZone2 = page.getByText(
  593 |     'Add supporting evidence (optional) — PDF, Word, or image',
  594 |   ).first();
  595 | 
  596 |   const [chooser2] = await Promise.all([
  597 |     page.waitForEvent('filechooser'),
  598 |     uploadZone2.click(),
  599 |   ]);
  600 |   await chooser2.setFiles(replacementPath);
  601 | 
  602 |   /* 16 — AI-verified badge appears again for the replacement */
  603 |   await expect(page.getByText('Uploading…')).toBeVisible({ timeout: 5_000 });
  604 |   await expect(page.getByText('AI evaluation in progress…')).toBeVisible({ timeout: 10_000 });
  605 |   await expect(page.getByText('AI-verified ✓')).toBeVisible({ timeout: 10_000 });
  606 | 
  607 |   /* Cleanup */
  608 |   fs.unlinkSync(pdfPath);
  609 |   fs.unlinkSync(replacementPath);
  610 | });
  611 | 
  612 | /* ── Consultant-validated — remove button hidden ────────────────────────── */
  613 | 
  614 | const EVIDENCE_RECORD_CONSULTANT = {
  615 |   id: 10,
  616 |   segId: 'strategy',
  617 |   subSegId: 'strategy-align',
  618 |   subSegLabel: 'Strategic Alignment',
  619 |   originalFilename: 'consultant-validated.pdf',
  620 |   mimeType: 'application/pdf',
  621 |   confidenceTier: 'consultant_validated',
  622 |   aiEvaluation: null,
  623 |   createdAt: new Date().toISOString(),
  624 | };
  625 | 
  626 | test('remove button is absent when evidence is consultant-validated', async ({ page }) => {
  627 | 
  628 |   /* 1 — Catch-all first */
  629 |   await page.route('**/api/**', (route) =>
  630 |     route.fulfill({ status: 200, contentType: 'application/json',
  631 |       body: JSON.stringify({ ok: true }) }));
  632 | 
  633 |   /* 2 — Auth */
  634 |   await page.route('**/api/auth/me', (route) =>
  635 |     route.fulfill({ status: 200, contentType: 'application/json',
  636 |       body: JSON.stringify({ ok: true, user: MOCK_USER }) }));
  637 | 
  638 |   /* 3 — Snapshots */
  639 |   await page.route('**/api/maturity/snapshots', async (route) => {
  640 |     if (route.request().method() === 'POST') {
  641 |       return route.fulfill({ status: 201, contentType: 'application/json',
```