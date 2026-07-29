# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: evidence-upload.spec.ts >> uploads a PDF and sees the Flagged badge — not AI-verified — when plausible_support is false
- Location: tests/evidence-upload.spec.ts:221:1

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
  187 |   await fileChooser.setFiles(pdfPath);
  188 | 
  189 |   /* 11 — Uploading → evaluating → done */
  190 |   await expect(page.getByText('Uploading…')).toBeVisible({ timeout: 5_000 });
  191 |   await expect(page.getByText('AI evaluation in progress…')).toBeVisible({ timeout: 10_000 });
  192 | 
  193 |   /* 12 — AI-verified badge appears once evidence is confirmed */
  194 |   await expect(page.getByText('AI-verified ✓')).toBeVisible({ timeout: 10_000 });
  195 | 
  196 |   /* Cleanup */
  197 |   fs.unlinkSync(pdfPath);
  198 | });
  199 | 
  200 | /* ── Flagged-evidence test ──────────────────────────────────────────────────── */
  201 | 
  202 | const AI_EVALUATION_FLAGGED = {
  203 |   plausible_support: false,
  204 |   confidence: 'low',
  205 |   flag_reason: 'generic_template',
  206 |   summary: 'Document appears to be an unmodified generic template.',
  207 | };
  208 | 
  209 | const EVIDENCE_RECORD_FLAGGED = {
  210 |   id: 2,
  211 |   segId: 'strategy',
  212 |   subSegId: 'strategy-align',
  213 |   subSegLabel: 'Strategic Alignment',
  214 |   originalFilename: 'flagged.pdf',
  215 |   mimeType: 'application/pdf',
  216 |   confidenceTier: 'ai_evaluated',
  217 |   aiEvaluation: AI_EVALUATION_FLAGGED,
  218 |   createdAt: new Date().toISOString(),
  219 | };
  220 | 
  221 | test('uploads a PDF and sees the Flagged badge — not AI-verified — when plausible_support is false', async ({ page }) => {
  222 | 
  223 |   /* 1 — Catch-all first */
  224 |   await page.route('**/api/**', (route) =>
  225 |     route.fulfill({ status: 200, contentType: 'application/json',
  226 |       body: JSON.stringify({ ok: true }) }));
  227 | 
  228 |   /* 2 — Specific handlers */
  229 | 
  230 |   await page.route('**/api/auth/me', (route) =>
  231 |     route.fulfill({ status: 200, contentType: 'application/json',
  232 |       body: JSON.stringify({ ok: true, user: MOCK_USER }) }));
  233 | 
  234 |   await page.route('**/api/maturity/snapshots', async (route) => {
  235 |     if (route.request().method() === 'POST') {
  236 |       return route.fulfill({ status: 201, contentType: 'application/json',
  237 |         body: JSON.stringify({ ok: true, id: MOCK_SNAPSHOT.id }) });
  238 |     }
  239 |     return route.fulfill({ status: 200, contentType: 'application/json',
  240 |       body: JSON.stringify({ ok: true, snapshots: [MOCK_SNAPSHOT] }) });
  241 |   });
  242 | 
  243 |   /* Evidence routes — confirm returns plausible_support: false */
  244 |   let evidenceGetCount = 0;
  245 |   await page.route('**/api/maturity/evidence**', async (route) => {
  246 |     const url  = route.request().url();
  247 |     const meth = route.request().method();
  248 | 
  249 |     if (meth === 'POST' && url.includes('/confirm')) {
  250 |       await new Promise(r => setTimeout(r, 400));
  251 |       return route.fulfill({ status: 200, contentType: 'application/json',
  252 |         body: JSON.stringify({
  253 |           ok: true,
  254 |           confidence_tier: 'ai_evaluated',
  255 |           ai_evaluation: AI_EVALUATION_FLAGGED,
  256 |         }) });
  257 |     }
  258 |     if (meth === 'POST' && url.includes('/upload-url')) {
  259 |       return route.fulfill({ status: 201, contentType: 'application/json',
  260 |         body: JSON.stringify({ ok: true, evidence_id: 2,
  261 |           upload_url: 'https://storage.example.com/presigned-put' }) });
  262 |     }
  263 |     if (meth === 'GET') {
  264 |       evidenceGetCount++;
  265 |       const records = evidenceGetCount > 1 ? [EVIDENCE_RECORD_FLAGGED] : [];
  266 |       return route.fulfill({ status: 200, contentType: 'application/json',
  267 |         body: JSON.stringify({ ok: true, evidence: records }) });
  268 |     }
  269 |     return route.fulfill({ status: 200, contentType: 'application/json',
  270 |       body: JSON.stringify({ ok: true }) });
  271 |   });
  272 | 
  273 |   /* GCS presigned PUT */
  274 |   await page.route('https://storage.example.com/**', (route) =>
  275 |     route.fulfill({ status: 200 }));
  276 | 
  277 |   /* 3 — Seed localStorage */
  278 |   await page.addInitScript((draft: string) => {
  279 |     localStorage.setItem('maturity_draft_v2', draft);
  280 |   }, JSON.stringify({
  281 |     phase: 'results',
  282 |     answers: buildAnswers(),
  283 |     intakeData: { industry: '', companySize: 'enterprise' },
  284 |   }));
  285 | 
  286 |   /* 4 — Navigate */
> 287 |   await page.goto('/maturity');
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:18807/maturity
  288 | 
  289 |   /* 5 — Wait for results */
  290 |   await expect(page.locator('[data-testid="maturity-results"]')).toBeVisible({ timeout: 15_000 });
  291 | 
  292 |   /* 6 — Dismiss feedback modal if it appears */
  293 |   const feedbackDialog = page.getByRole('dialog', { name: /how was your experience/i });
  294 |   try {
  295 |     await feedbackDialog.waitFor({ state: 'visible', timeout: 5_000 });
  296 |     await feedbackDialog.getByRole('button', { name: /not now/i }).click();
  297 |     await feedbackDialog.waitFor({ state: 'hidden', timeout: 3_000 });
  298 |   } catch {
  299 |     // Dialog did not appear — proceed.
  300 |   }
  301 | 
  302 |   /* 7 — Open accordion */
  303 |   const accordionBtn = page.getByText('Add supporting evidence').first();
  304 |   await expect(accordionBtn).toBeVisible({ timeout: 10_000 });
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
```