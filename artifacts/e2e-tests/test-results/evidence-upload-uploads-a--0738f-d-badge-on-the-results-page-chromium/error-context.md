# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: evidence-upload.spec.ts >> uploads a PDF and sees the AI-verified badge on the results page
- Location: tests/evidence-upload.spec.ts:78:1

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
  47  | 
  48  | const MOCK_SNAPSHOT = {
  49  |   id: 42,
  50  |   userId: 1,
  51  |   overallScore: 3.0,
  52  |   overallLevel: 'Developing',
  53  |   segmentScores: [],
  54  |   createdAt: new Date().toISOString(),
  55  | };
  56  | 
  57  | const AI_EVALUATION = {
  58  |   plausible_support: true,
  59  |   confidence: 'high',
  60  |   flag_reason: null,
  61  |   summary: 'Document clearly supports the claimed maturity level.',
  62  | };
  63  | 
  64  | const EVIDENCE_RECORD = {
  65  |   id: 1,
  66  |   segId: 'strategy',
  67  |   subSegId: 'strategy-align',      // real subsegment ID from maturitySubSegData1to5
  68  |   subSegLabel: 'Strategic Alignment',
  69  |   originalFilename: 'strategy.pdf',
  70  |   mimeType: 'application/pdf',
  71  |   confidenceTier: 'ai_evaluated',
  72  |   aiEvaluation: AI_EVALUATION,
  73  |   createdAt: new Date().toISOString(),
  74  | };
  75  | 
  76  | /* ── Test ───────────────────────────────────────────────────────────────────── */
  77  | 
  78  | test('uploads a PDF and sees the AI-verified badge on the results page', async ({ page }) => {
  79  | 
  80  |   /* 1 — Catch-all first (registered first = lowest LIFO priority) */
  81  |   await page.route('**/api/**', (route) =>
  82  |     route.fulfill({ status: 200, contentType: 'application/json',
  83  |       body: JSON.stringify({ ok: true }) }));
  84  | 
  85  |   /* 2 — Specific handlers (registered after = higher priority) */
  86  | 
  87  |   await page.route('**/api/auth/me', (route) =>
  88  |     route.fulfill({ status: 200, contentType: 'application/json',
  89  |       body: JSON.stringify({ ok: true, user: MOCK_USER }) }));
  90  | 
  91  |   await page.route('**/api/maturity/snapshots', async (route) => {
  92  |     if (route.request().method() === 'POST') {
  93  |       // Component checks data.id (not data.snapshot.id) — see auto-save handler
  94  |       return route.fulfill({ status: 201, contentType: 'application/json',
  95  |         body: JSON.stringify({ ok: true, id: MOCK_SNAPSHOT.id }) });
  96  |     }
  97  |     return route.fulfill({ status: 200, contentType: 'application/json',
  98  |       body: JSON.stringify({ ok: true, snapshots: [MOCK_SNAPSHOT] }) });
  99  |   });
  100 | 
  101 |   /* Single handler for all /maturity/evidence* routes — dispatches by URL+method */
  102 |   let evidenceGetCount = 0;
  103 |   await page.route('**/api/maturity/evidence**', async (route) => {
  104 |     const url  = route.request().url();
  105 |     const meth = route.request().method();
  106 | 
  107 |     if (meth === 'POST' && url.includes('/confirm')) {
  108 |       // Pause 400 ms so the "AI evaluation in progress…" state is rendered long
  109 |       // enough for Playwright's 100 ms poll to catch it before transitioning to done.
  110 |       await new Promise(r => setTimeout(r, 400));
  111 |       return route.fulfill({ status: 200, contentType: 'application/json',
  112 |         body: JSON.stringify({ ok: true, confidence_tier: 'ai_evaluated',
  113 |           ai_evaluation: AI_EVALUATION }) });
  114 |     }
  115 |     if (meth === 'POST' && url.includes('/upload-url')) {
  116 |       return route.fulfill({ status: 201, contentType: 'application/json',
  117 |         body: JSON.stringify({ ok: true, evidence_id: 1,
  118 |           upload_url: 'https://storage.example.com/presigned-put' }) });
  119 |     }
  120 |     if (meth === 'GET') {
  121 |       evidenceGetCount++;
  122 |       const records = evidenceGetCount > 1 ? [EVIDENCE_RECORD] : [];
  123 |       return route.fulfill({ status: 200, contentType: 'application/json',
  124 |         body: JSON.stringify({ ok: true, evidence: records }) });
  125 |     }
  126 |     return route.fulfill({ status: 200, contentType: 'application/json',
  127 |       body: JSON.stringify({ ok: true }) });
  128 |   });
  129 | 
  130 |   /* GCS presigned PUT (external origin) */
  131 |   await page.route('https://storage.example.com/**', (route) =>
  132 |     route.fulfill({ status: 200 }));
  133 | 
  134 |   /* 3 — Seed localStorage before navigation
  135 |          industry='' prevents any extra industry module being added, keeping
  136 |          activeSegments = CORE_SEGMENTS (11).  Answers for indices 0-11
  137 |          ensure all segments are complete so the guard doesn't redirect.   */
  138 |   await page.addInitScript((draft: string) => {
  139 |     localStorage.setItem('maturity_draft_v2', draft);
  140 |   }, JSON.stringify({
  141 |     phase: 'results',
  142 |     answers: buildAnswers(),
  143 |     intakeData: { industry: '', companySize: 'enterprise' },
  144 |   }));
  145 | 
  146 |   /* 4 — Navigate */
> 147 |   await page.goto('/maturity');
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:18807/maturity
  148 | 
  149 |   /* 5 — Wait for the results container */
  150 |   await expect(page.locator('[data-testid="maturity-results"]')).toBeVisible({ timeout: 15_000 });
  151 | 
  152 |   /* 6 — Wait for and dismiss the feedback modal.
  153 |          The modal fires after a 2 500 ms setTimeout inside the results effect.
  154 |          It sets aria-hidden on the background, making the accordion invisible
  155 |          to Playwright.  We must wait for it to appear and then close it.    */
  156 |   const feedbackDialog = page.getByRole('dialog', { name: /how was your experience/i });
  157 |   try {
  158 |     await feedbackDialog.waitFor({ state: 'visible', timeout: 5_000 });
  159 |     await feedbackDialog.getByRole('button', { name: /not now/i }).click();
  160 |     await feedbackDialog.waitFor({ state: 'hidden', timeout: 3_000 });
  161 |   } catch {
  162 |     // Dialog did not appear — that is fine; proceed without dismissing.
  163 |   }
  164 | 
  165 |   /* 7 — Find and click the "Add supporting evidence" accordion
  166 |          (requires user ≠ null AND currentSnapshotId ≠ null — wait up to 10s
  167 |          for the auth + auto-save snapshot round-trip to complete)          */
  168 |   const accordionBtn = page.getByText('Add supporting evidence').first();
  169 |   await expect(accordionBtn).toBeVisible({ timeout: 10_000 });
  170 |   await accordionBtn.click();
  171 | 
  172 |   /* 8 — Upload zone text is now visible inside the open accordion */
  173 |   const uploadZone = page.getByText(
  174 |     'Add supporting evidence (optional) — PDF, Word, or image',
  175 |   ).first();
  176 |   await expect(uploadZone).toBeVisible({ timeout: 5_000 });
  177 | 
  178 |   /* 9 — Create a minimal valid-ish PDF in tmp */
  179 |   const pdfPath = path.join(os.tmpdir(), 'e2e-evidence.pdf');
  180 |   fs.writeFileSync(pdfPath, '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n');
  181 | 
  182 |   /* 10 — Trigger the hidden file input via the file chooser event */
  183 |   const [fileChooser] = await Promise.all([
  184 |     page.waitForEvent('filechooser'),
  185 |     uploadZone.click(),
  186 |   ]);
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
```