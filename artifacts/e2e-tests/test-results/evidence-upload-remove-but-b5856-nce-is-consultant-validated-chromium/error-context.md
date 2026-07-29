# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: evidence-upload.spec.ts >> remove button is absent when evidence is consultant-validated
- Location: tests/evidence-upload.spec.ts:626:1

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
  642 |         body: JSON.stringify({ ok: true, id: MOCK_SNAPSHOT.id }) });
  643 |     }
  644 |     return route.fulfill({ status: 200, contentType: 'application/json',
  645 |       body: JSON.stringify({ ok: true, snapshots: [MOCK_SNAPSHOT] }) });
  646 |   });
  647 | 
  648 |   /* 4 — Evidence: always return the consultant-validated record */
  649 |   await page.route('**/api/maturity/evidence**', async (route) => {
  650 |     const meth = route.request().method();
  651 |     if (meth === 'GET') {
  652 |       return route.fulfill({ status: 200, contentType: 'application/json',
  653 |         body: JSON.stringify({ ok: true, evidence: [EVIDENCE_RECORD_CONSULTANT] }) });
  654 |     }
  655 |     return route.fulfill({ status: 200, contentType: 'application/json',
  656 |       body: JSON.stringify({ ok: true }) });
  657 |   });
  658 | 
  659 |   /* 5 — Seed localStorage */
  660 |   await page.addInitScript((draft: string) => {
  661 |     localStorage.setItem('maturity_draft_v2', draft);
  662 |   }, JSON.stringify({
  663 |     phase: 'results',
  664 |     answers: buildAnswers(),
  665 |     intakeData: { industry: '', companySize: 'enterprise' },
  666 |   }));
  667 | 
  668 |   /* 6 — Navigate and wait for results */
> 669 |   await page.goto('/maturity');
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:18807/maturity
  670 |   await expect(page.locator('[data-testid="maturity-results"]')).toBeVisible({ timeout: 15_000 });
  671 | 
  672 |   /* 7 — Dismiss feedback modal if it appears */
  673 |   const feedbackDialog = page.getByRole('dialog', { name: /how was your experience/i });
  674 |   try {
  675 |     await feedbackDialog.waitFor({ state: 'visible', timeout: 5_000 });
  676 |     await feedbackDialog.getByRole('button', { name: /not now/i }).click();
  677 |     await feedbackDialog.waitFor({ state: 'hidden', timeout: 3_000 });
  678 |   } catch { /* did not appear */ }
  679 | 
  680 |   /* 8 — Open evidence accordion */
  681 |   const accordionBtn = page.getByText('Add supporting evidence').first();
  682 |   await expect(accordionBtn).toBeVisible({ timeout: 10_000 });
  683 |   await accordionBtn.click();
  684 | 
  685 |   /* 9 — Consultant-validated badge must appear */
  686 |   await expect(page.getByText('Consultant-validated')).toBeVisible({ timeout: 8_000 });
  687 | 
  688 |   /* 10 — Remove button must NOT be in the DOM */
  689 |   await expect(page.getByRole('button', { name: /remove evidence/i })).not.toBeAttached();
  690 | });
  691 | 
  692 | /* ── Parameterised flag_reason badge test ───────────────────────────────────── */
  693 | 
  694 | const FLAG_REASON_CASES: Array<{
  695 |   flag_reason: 'blank_or_irrelevant' | 'generic_template' | 'contradicts_claimed_level';
  696 |   expectedBadge: string;
  697 | }> = [
  698 |   { flag_reason: 'blank_or_irrelevant',        expectedBadge: 'Flagged — blank or irrelevant'        },
  699 |   { flag_reason: 'generic_template',            expectedBadge: 'Flagged — generic template'            },
  700 |   { flag_reason: 'contradicts_claimed_level',   expectedBadge: 'Flagged — contradicts claimed level'  },
  701 | ];
  702 | 
  703 | for (const { flag_reason, expectedBadge } of FLAG_REASON_CASES) {
  704 |   test(`badge shows correct flag reason label for flag_reason="${flag_reason}"`, async ({ page }) => {
  705 | 
  706 |     const AI_EVAL_FLAGGED_VARIANT = {
  707 |       plausible_support: false,
  708 |       confidence: 'low' as const,
  709 |       flag_reason,
  710 |       summary: `Document flagged: ${flag_reason.replace(/_/g, ' ')}.`,
  711 |     };
  712 | 
  713 |     const EVIDENCE_RECORD_FLAGGED_VARIANT = {
  714 |       id: 10,
  715 |       segId: 'strategy',
  716 |       subSegId: 'strategy-align',
  717 |       subSegLabel: 'Strategic Alignment',
  718 |       originalFilename: `flagged-${flag_reason}.pdf`,
  719 |       mimeType: 'application/pdf',
  720 |       confidenceTier: 'ai_evaluated',
  721 |       aiEvaluation: AI_EVAL_FLAGGED_VARIANT,
  722 |       createdAt: new Date().toISOString(),
  723 |     };
  724 | 
  725 |     /* 1 — Catch-all */
  726 |     await page.route('**/api/**', (route) =>
  727 |       route.fulfill({ status: 200, contentType: 'application/json',
  728 |         body: JSON.stringify({ ok: true }) }));
  729 | 
  730 |     /* 2 — Specific handlers */
  731 |     await page.route('**/api/auth/me', (route) =>
  732 |       route.fulfill({ status: 200, contentType: 'application/json',
  733 |         body: JSON.stringify({ ok: true, user: MOCK_USER }) }));
  734 | 
  735 |     await page.route('**/api/maturity/snapshots', async (route) => {
  736 |       if (route.request().method() === 'POST') {
  737 |         return route.fulfill({ status: 201, contentType: 'application/json',
  738 |           body: JSON.stringify({ ok: true, id: MOCK_SNAPSHOT.id }) });
  739 |       }
  740 |       return route.fulfill({ status: 200, contentType: 'application/json',
  741 |         body: JSON.stringify({ ok: true, snapshots: [MOCK_SNAPSHOT] }) });
  742 |     });
  743 | 
  744 |     let evidenceGetCount = 0;
  745 |     await page.route('**/api/maturity/evidence**', async (route) => {
  746 |       const url  = route.request().url();
  747 |       const meth = route.request().method();
  748 | 
  749 |       if (meth === 'POST' && url.includes('/confirm')) {
  750 |         await new Promise(r => setTimeout(r, 400));
  751 |         return route.fulfill({ status: 200, contentType: 'application/json',
  752 |           body: JSON.stringify({
  753 |             ok: true,
  754 |             confidence_tier: 'ai_evaluated',
  755 |             ai_evaluation: AI_EVAL_FLAGGED_VARIANT,
  756 |           }) });
  757 |       }
  758 |       if (meth === 'POST' && url.includes('/upload-url')) {
  759 |         return route.fulfill({ status: 201, contentType: 'application/json',
  760 |           body: JSON.stringify({ ok: true, evidence_id: 10,
  761 |             upload_url: 'https://storage.example.com/presigned-put' }) });
  762 |       }
  763 |       if (meth === 'GET') {
  764 |         evidenceGetCount++;
  765 |         const records = evidenceGetCount > 1 ? [EVIDENCE_RECORD_FLAGGED_VARIANT] : [];
  766 |         return route.fulfill({ status: 200, contentType: 'application/json',
  767 |           body: JSON.stringify({ ok: true, evidence: records }) });
  768 |       }
  769 |       return route.fulfill({ status: 200, contentType: 'application/json',
```