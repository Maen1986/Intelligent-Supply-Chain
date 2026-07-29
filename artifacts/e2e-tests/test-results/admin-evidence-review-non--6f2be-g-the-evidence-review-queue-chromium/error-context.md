# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-evidence-review.spec.ts >> non-admin user is blocked from seeing the evidence review queue
- Location: tests/admin-evidence-review.spec.ts:77:1

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
  1   | /**
  2   |  * E2E — Admin evidence review queue.
  3   |  *
  4   |  * Scenario:
  5   |  *   An admin navigates to /admin/evidence-review, sees an AI-evaluated record
  6   |  *   in the queue, clicks "Validate ✓", and confirms the status badge updates
  7   |  *   to "Consultant-validated".
  8   |  *
  9   |  * All API calls are intercepted via page.route().
  10  |  * Route ordering: Playwright is LIFO — register catch-all first so specific
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
  63  | /* ── Fixtures (non-admin) ───────────────────────────────────────────────────── */
  64  | 
  65  | const MOCK_REGULAR_USER = {
  66  |   id: 5,
  67  |   email: 'user@example.com',
  68  |   fullName: 'Regular User',
  69  |   role: 'user',
  70  |   mobile: '+966500000005',
  71  |   designation: 'Analyst',
  72  |   company: 'I Supply Chain',
  73  | };
  74  | 
  75  | /* ── Tests ──────────────────────────────────────────────────────────────────── */
  76  | 
  77  | test('non-admin user is blocked from seeing the evidence review queue', async ({ page }) => {
  78  | 
  79  |   /* 1 — Catch-all for any stray API calls */
  80  |   await page.route('**/api/**', (route) =>
  81  |     route.fulfill({ status: 200, contentType: 'application/json',
  82  |       body: JSON.stringify({ ok: true }) }));
  83  | 
  84  |   /* 2 — Auth: regular (non-admin) session */
  85  |   await page.route('**/api/auth/me', (route) =>
  86  |     route.fulfill({ status: 200, contentType: 'application/json',
  87  |       body: JSON.stringify({ ok: true, user: MOCK_REGULAR_USER }) }));
  88  | 
  89  |   /* 3 — Navigate to the admin review queue */
> 90  |   await page.goto('/admin/evidence-review');
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:18807/admin/evidence-review
  91  | 
  92  |   /* 4 — The "Evidence Review Queue" heading must NOT be visible */
  93  |   await expect(page.getByText('Evidence Review Queue')).not.toBeVisible({ timeout: 10_000 });
  94  | 
  95  |   /* 5 — An access-denied message is shown instead */
  96  |   await expect(
  97  |     page.getByText(/administrators only|للمديرين فقط/i)
  98  |   ).toBeVisible({ timeout: 10_000 });
  99  | });
  100 | 
  101 | test('admin validates an AI-evaluated record and sees Consultant-validated badge', async ({ page }) => {
  102 | 
  103 |   /* 1 — Catch-all first (registered first = lowest LIFO priority) */
  104 |   await page.route('**/api/**', (route) =>
  105 |     route.fulfill({ status: 200, contentType: 'application/json',
  106 |       body: JSON.stringify({ ok: true }) }));
  107 | 
  108 |   /* 2 — Auth: admin session */
  109 |   await page.route('**/api/auth/me', (route) =>
  110 |     route.fulfill({ status: 200, contentType: 'application/json',
  111 |       body: JSON.stringify({ ok: true, user: MOCK_ADMIN }) }));
  112 | 
  113 |   /* 3 — Single handler for all /admin/evidence-review* routes.
  114 |          Dispatching internally by method and path avoids any glob-overlap
  115 |          ambiguity between the list endpoint and the /:id PATCH endpoint.
  116 |          fetchCount tracks list GETs: first call returns AI-evaluated data,
  117 |          subsequent calls return the consultant-validated data.              */
  118 |   let fetchCount = 0;
  119 | 
  120 |   await page.route('**/api/admin/evidence-review**', async (route) => {
  121 |     const url    = route.request().url();
  122 |     const method = route.request().method();
  123 | 
  124 |     /* PATCH /admin/evidence-review/:id  — consultant validation decision */
  125 |     if (method === 'PATCH') {
  126 |       return route.fulfill({ status: 200, contentType: 'application/json',
  127 |         body: JSON.stringify({
  128 |           ok: true,
  129 |           id: VALIDATED_RECORD.id,
  130 |           confidence_tier: 'consultant_validated',
  131 |         }) });
  132 |     }
  133 | 
  134 |     /* GET /admin/evidence-review  — list (no numeric id segment after path) */
  135 |     if (method === 'GET' && !url.match(/\/admin\/evidence-review\/\d+/)) {
  136 |       fetchCount++;
  137 |       const records = fetchCount > 1 ? [VALIDATED_RECORD] : [AI_EVALUATED_RECORD];
  138 |       return route.fulfill({ status: 200, contentType: 'application/json',
  139 |         body: JSON.stringify({ ok: true, records, total: records.length }) });
  140 |     }
  141 | 
  142 |     return route.fulfill({ status: 200, contentType: 'application/json',
  143 |       body: JSON.stringify({ ok: true }) });
  144 |   });
  145 | 
  146 |   /* 4 — Navigate to the admin review queue */
  147 |   await page.goto('/admin/evidence-review');
  148 | 
  149 |   /* 5 — Page header */
  150 |   await expect(page.getByText('Evidence Review Queue')).toBeVisible({ timeout: 10_000 });
  151 | 
  152 |   /* 6 — The AI-evaluated record row is present */
  153 |   await expect(page.getByText('strategy-doc.pdf')).toBeVisible({ timeout: 8_000 });
  154 | 
  155 |   /* 7 — Status badge shows "AI-evaluated" initially */
  156 |   await expect(page.getByText('AI-evaluated').first()).toBeVisible();
  157 | 
  158 |   /* 8 — Click the action "Validate ✓" button in the table row.
  159 |          Using exact text avoids matching the "Consultant-validated" filter
  160 |          button whose label also contains the substring "validate".          */
  161 |   const validateBtn = page.getByRole('button', { name: 'Validate ✓' }).first();
  162 |   await expect(validateBtn).toBeVisible();
  163 |   await validateBtn.click();
  164 | 
  165 |   /* 9 — After PATCH + re-fetch, the status badge changes to Consultant-validated
  166 |          in the STATUS column of the table row.                               */
  167 |   // Scope to the table to avoid matching the filter button of the same label
  168 |   await expect(
  169 |     page.locator('table').getByText('Consultant-validated').first()
  170 |   ).toBeVisible({ timeout: 10_000 });
  171 | 
  172 |   /* 10 — With confidenceTier = consultant_validated the action button is gone */
  173 |   await expect(page.getByRole('button', { name: 'Validate ✓' })).toHaveCount(0);
  174 | });
  175 | 
  176 | test('evidence review queue disappears when the session expires mid-visit', async ({ page }) => {
  177 | 
  178 |   /* 1 — Catch-all for any stray API calls */
  179 |   await page.route('**/api/**', (route) =>
  180 |     route.fulfill({ status: 200, contentType: 'application/json',
  181 |       body: JSON.stringify({ ok: true }) }));
  182 | 
  183 |   /* 2 — Start with a valid admin session */
  184 |   await page.route('**/api/auth/me', (route) =>
  185 |     route.fulfill({ status: 200, contentType: 'application/json',
  186 |       body: JSON.stringify({ ok: true, user: MOCK_ADMIN }) }));
  187 | 
  188 |   /* 3 — Initial queue load returns the AI-evaluated record */
  189 |   let sessionExpired = false;
  190 | 
```