# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: evidence-upload.spec.ts >> badge shows correct flag reason label for flag_reason="blank_or_irrelevant"
- Location: tests/evidence-upload.spec.ts:704:3

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
  770 |         body: JSON.stringify({ ok: true }) });
  771 |     });
  772 | 
  773 |     await page.route('https://storage.example.com/**', (route) =>
  774 |       route.fulfill({ status: 200 }));
  775 | 
  776 |     /* 3 — Seed localStorage */
  777 |     await page.addInitScript((draft: string) => {
  778 |       localStorage.setItem('maturity_draft_v2', draft);
  779 |     }, JSON.stringify({
  780 |       phase: 'results',
  781 |       answers: buildAnswers(),
  782 |       intakeData: { industry: '', companySize: 'enterprise' },
  783 |     }));
  784 | 
  785 |     /* 4 — Navigate */
> 786 |     await page.goto('/maturity');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:18807/maturity
  787 | 
  788 |     /* 5 — Wait for results */
  789 |     await expect(page.locator('[data-testid="maturity-results"]')).toBeVisible({ timeout: 15_000 });
  790 | 
  791 |     /* 6 — Dismiss feedback modal if it appears */
  792 |     const feedbackDialog = page.getByRole('dialog', { name: /how was your experience/i });
  793 |     try {
  794 |       await feedbackDialog.waitFor({ state: 'visible', timeout: 5_000 });
  795 |       await feedbackDialog.getByRole('button', { name: /not now/i }).click();
  796 |       await feedbackDialog.waitFor({ state: 'hidden', timeout: 3_000 });
  797 |     } catch {
  798 |       // Dialog did not appear — proceed.
  799 |     }
  800 | 
  801 |     /* 7 — Open evidence accordion */
  802 |     const accordionBtn = page.getByText('Add supporting evidence').first();
  803 |     await expect(accordionBtn).toBeVisible({ timeout: 10_000 });
  804 |     await accordionBtn.click();
  805 | 
  806 |     /* 8 — Upload zone visible */
  807 |     const uploadZone = page.getByText(
  808 |       'Add supporting evidence (optional) — PDF, Word, or image',
  809 |     ).first();
  810 |     await expect(uploadZone).toBeVisible({ timeout: 5_000 });
  811 | 
  812 |     /* 9 — Create a minimal PDF */
  813 |     const pdfPath = path.join(os.tmpdir(), `e2e-flagged-${flag_reason}.pdf`);
  814 |     fs.writeFileSync(pdfPath, '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n');
  815 | 
  816 |     /* 10 — Trigger upload */
  817 |     const [fileChooser] = await Promise.all([
  818 |       page.waitForEvent('filechooser'),
  819 |       uploadZone.click(),
  820 |     ]);
  821 |     await fileChooser.setFiles(pdfPath);
  822 | 
  823 |     /* 11 — Progress states */
  824 |     await expect(page.getByText('Uploading…')).toBeVisible({ timeout: 5_000 });
  825 |     await expect(page.getByText('AI evaluation in progress…')).toBeVisible({ timeout: 10_000 });
  826 | 
  827 |     /* 12 — Exact badge label must match the flag_reason with underscores replaced by spaces */
  828 |     await expect(page.getByText(expectedBadge)).toBeVisible({ timeout: 10_000 });
  829 | 
  830 |     /* 13 — AI-verified badge must NOT appear */
  831 |     await expect(page.getByText('AI-verified ✓')).not.toBeVisible();
  832 | 
  833 |     /* Cleanup */
  834 |     fs.unlinkSync(pdfPath);
  835 |   });
  836 | }
  837 | 
```