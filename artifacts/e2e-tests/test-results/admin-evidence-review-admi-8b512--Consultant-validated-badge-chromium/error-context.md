# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-evidence-review.spec.ts >> admin validates an AI-evaluated record and sees Consultant-validated badge
- Location: tests/admin-evidence-review.spec.ts:65:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:18807/admin/evidence-review
Call log:
  - navigating to "http://localhost:18807/admin/evidence-review", waiting until "load"

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
  11  |  * handlers (registered after) take priority.
  12  |  *
  13  |  * Important: the page also renders a filter button labelled "Consultant-validated"
  14  |  * which matches /validate/i.  Always use exact text ('Validate ✓') or scope
  15  |  * locators to the table body when targeting the action button.
  16  |  */
  17  | 
  18  | import { test, expect } from '@playwright/test';
  19  | 
  20  | /* ── Fixtures ───────────────────────────────────────────────────────────────── */
  21  | 
  22  | const MOCK_ADMIN = {
  23  |   id: 2,
  24  |   email: 'admin@example.com',
  25  |   fullName: 'Administrator',
  26  |   role: 'admin',
  27  |   mobile: '+966500000002',
  28  |   designation: 'Administrator',
  29  |   company: 'I Supply Chain',
  30  | };
  31  | 
  32  | const AI_EVALUATED_RECORD = {
  33  |   id: 1,
  34  |   userId: 10,
  35  |   snapshotId: 42,
  36  |   segId: 'strategy',
  37  |   subSegId: 'strategy-sub-1',
  38  |   subSegLabel: 'Supply Chain Strategy Document',
  39  |   originalFilename: 'strategy-doc.pdf',
  40  |   mimeType: 'application/pdf',
  41  |   storagePath: '/objects/maturity-evidence/10/42/strategy/strategy-sub-1/uuid.pdf',
  42  |   confidenceTier: 'ai_evaluated',
  43  |   aiEvaluation: {
  44  |     plausible_support: true,
  45  |     confidence: 'high',
  46  |     flag_reason: null,
  47  |     summary: 'Document clearly evidences the claimed maturity level.',
  48  |   },
  49  |   consultantNotes: null,
  50  |   reviewedBy: null,
  51  |   reviewedAt: null,
  52  |   createdAt: new Date(Date.now() - 3600_000).toISOString(),
  53  | };
  54  | 
  55  | const VALIDATED_RECORD = {
  56  |   ...AI_EVALUATED_RECORD,
  57  |   confidenceTier: 'consultant_validated',
  58  |   consultantNotes: 'Reviewed and approved.',
  59  |   reviewedBy: 2,
  60  |   reviewedAt: new Date().toISOString(),
  61  | };
  62  | 
  63  | /* ── Test ───────────────────────────────────────────────────────────────────── */
  64  | 
  65  | test('admin validates an AI-evaluated record and sees Consultant-validated badge', async ({ page }) => {
  66  | 
  67  |   /* 1 — Catch-all first (registered first = lowest LIFO priority) */
  68  |   await page.route('**/api/**', (route) =>
  69  |     route.fulfill({ status: 200, contentType: 'application/json',
  70  |       body: JSON.stringify({ ok: true }) }));
  71  | 
  72  |   /* 2 — Auth: admin session */
  73  |   await page.route('**/api/auth/me', (route) =>
  74  |     route.fulfill({ status: 200, contentType: 'application/json',
  75  |       body: JSON.stringify({ ok: true, user: MOCK_ADMIN }) }));
  76  | 
  77  |   /* 3 — Single handler for all /admin/evidence-review* routes.
  78  |          Dispatching internally by method and path avoids any glob-overlap
  79  |          ambiguity between the list endpoint and the /:id PATCH endpoint.
  80  |          fetchCount tracks list GETs: first call returns AI-evaluated data,
  81  |          subsequent calls return the consultant-validated data.              */
  82  |   let fetchCount = 0;
  83  | 
  84  |   await page.route('**/api/admin/evidence-review**', async (route) => {
  85  |     const url    = route.request().url();
  86  |     const method = route.request().method();
  87  | 
  88  |     /* PATCH /admin/evidence-review/:id  — consultant validation decision */
  89  |     if (method === 'PATCH') {
  90  |       return route.fulfill({ status: 200, contentType: 'application/json',
  91  |         body: JSON.stringify({
  92  |           ok: true,
  93  |           id: VALIDATED_RECORD.id,
  94  |           confidence_tier: 'consultant_validated',
  95  |         }) });
  96  |     }
  97  | 
  98  |     /* GET /admin/evidence-review  — list (no numeric id segment after path) */
  99  |     if (method === 'GET' && !url.match(/\/admin\/evidence-review\/\d+/)) {
  100 |       fetchCount++;
  101 |       const records = fetchCount > 1 ? [VALIDATED_RECORD] : [AI_EVALUATED_RECORD];
  102 |       return route.fulfill({ status: 200, contentType: 'application/json',
  103 |         body: JSON.stringify({ ok: true, records, total: records.length }) });
  104 |     }
  105 | 
  106 |     return route.fulfill({ status: 200, contentType: 'application/json',
  107 |       body: JSON.stringify({ ok: true }) });
  108 |   });
  109 | 
  110 |   /* 4 — Navigate to the admin review queue */
> 111 |   await page.goto('/admin/evidence-review');
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:18807/admin/evidence-review
  112 | 
  113 |   /* 5 — Page header */
  114 |   await expect(page.getByText('Evidence Review Queue')).toBeVisible({ timeout: 10_000 });
  115 | 
  116 |   /* 6 — The AI-evaluated record row is present */
  117 |   await expect(page.getByText('strategy-doc.pdf')).toBeVisible({ timeout: 8_000 });
  118 | 
  119 |   /* 7 — Status badge shows "AI-evaluated" initially */
  120 |   await expect(page.getByText('AI-evaluated').first()).toBeVisible();
  121 | 
  122 |   /* 8 — Click the action "Validate ✓" button in the table row.
  123 |          Using exact text avoids matching the "Consultant-validated" filter
  124 |          button whose label also contains the substring "validate".          */
  125 |   const validateBtn = page.getByRole('button', { name: 'Validate ✓' }).first();
  126 |   await expect(validateBtn).toBeVisible();
  127 |   await validateBtn.click();
  128 | 
  129 |   /* 9 — After PATCH + re-fetch, the status badge changes to Consultant-validated
  130 |          in the STATUS column of the table row.                               */
  131 |   // Scope to the table to avoid matching the filter button of the same label
  132 |   await expect(
  133 |     page.locator('table').getByText('Consultant-validated').first()
  134 |   ).toBeVisible({ timeout: 10_000 });
  135 | 
  136 |   /* 10 — With confidenceTier = consultant_validated the action button is gone */
  137 |   await expect(page.getByRole('button', { name: 'Validate ✓' })).toHaveCount(0);
  138 | });
  139 | 
```