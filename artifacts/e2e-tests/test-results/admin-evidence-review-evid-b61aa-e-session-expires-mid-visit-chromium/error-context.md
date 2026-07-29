# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-evidence-review.spec.ts >> evidence review queue disappears when the session expires mid-visit
- Location: tests/admin-evidence-review.spec.ts:176:1

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
  191 |   await page.route('**/api/admin/evidence-review**', (route) => {
  192 |     if (sessionExpired) {
  193 |       /* Once the session has "expired", the backend rejects the request */
  194 |       return route.fulfill({
  195 |         status: 401,
  196 |         contentType: 'application/json',
  197 |         body: JSON.stringify({ ok: false, error: 'Session expired' }),
  198 |       });
  199 |     }
  200 |     return route.fulfill({
  201 |       status: 200,
  202 |       contentType: 'application/json',
  203 |       body: JSON.stringify({ ok: true, records: [AI_EVALUATED_RECORD], total: 1 }),
  204 |     });
  205 |   });
  206 | 
  207 |   /* 4 — Navigate to the admin review queue */
> 208 |   await page.goto('/admin/evidence-review');
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:18807/admin/evidence-review
  209 | 
  210 |   /* 5 — The queue is visible while the session is valid */
  211 |   await expect(page.getByText('Evidence Review Queue')).toBeVisible({ timeout: 10_000 });
  212 |   await expect(page.getByText('strategy-doc.pdf')).toBeVisible({ timeout: 8_000 });
  213 | 
  214 |   /* 6 — Simulate session expiry: /api/auth/me now returns a non-admin user
  215 |           and the evidence-review API will start returning 401               */
  216 |   sessionExpired = true;
  217 |   await page.unroute('**/api/auth/me');
  218 |   await page.route('**/api/auth/me', (route) =>
  219 |     route.fulfill({ status: 200, contentType: 'application/json',
  220 |       body: JSON.stringify({ ok: true, user: MOCK_REGULAR_USER }) }));
  221 | 
  222 |   /* 7 — Click Refresh to trigger a re-fetch with the expired session */
  223 |   const refreshBtn = page.getByRole('button', { name: /refresh|تحديث/i });
  224 |   await expect(refreshBtn).toBeVisible();
  225 |   await refreshBtn.click();
  226 | 
  227 |   /* 8 — The evidence queue table / file row must no longer be visible */
  228 |   await expect(page.getByText('strategy-doc.pdf')).not.toBeVisible({ timeout: 10_000 });
  229 | 
  230 |   /* 9 — Either an access-denied message or a fetch error is shown instead —
  231 |           both indicate the page correctly blocked the stale/expired session  */
  232 |   const accessDenied = page.getByText(/administrators only|للمديرين فقط/i);
  233 |   const fetchError   = page.getByText(/session expired|fetch failed|unknown error/i);
  234 |   const eitherVisible = await Promise.race([
  235 |     accessDenied.isVisible().then(v => v),
  236 |     fetchError.isVisible().then(v => v),
  237 |   ]);
  238 |   // Poll briefly if neither is immediately true
  239 |   if (!eitherVisible) {
  240 |     await expect(accessDenied.or(fetchError)).toBeVisible({ timeout: 10_000 });
  241 |   }
  242 | });
  243 | 
```