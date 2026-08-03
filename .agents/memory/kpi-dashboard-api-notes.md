---
name: KPI Dashboard and import test conventions
description: Non-obvious facts about calcKpisFromInputs API, Arabic label differences in tests, and the CsvImportErrors confirm stub.
---

## `calcKpisFromInputs` return shape (updated Task 423)
The function now returns `{ values, log, count, failedKpis: KpiDef[] }`. `failedKpis` contains any KPI whose `calculate()` returned NaN (e.g. division by zero via `pct(_, 0)`). Callers that only destructure `values/log/count` still compile fine — `failedKpis` is additive.

**Why:** Task 423 — failed-calculation KPIs need click-to-jump in the import log, so they must be surfaced to the component layer alongside the existing `manualKpis` pattern.

**How to apply:** Any test or component that destructures `calcKpisFromInputs` should be aware of the extra field. Tests verifying NaN handling should assert `failedKpis.length > 0` and log lines starting with `⚠️`.

## Arabic label for the CSV import file input
In `SupplierScorecardTool` when `isAr={true}`, the hidden file `<input>` has `aria-label="استيراد ملف CSV"` (not "Import CSV file"). Tests that call `getByLabelText('Import CSV file')` will fail in Arabic mode.

**Why:** The component translates the aria-label with `isAr ? 'استيراد ملف CSV' : 'Import CSV file'`.

**How to apply:** The `fireImportFile(csv, ar)` helper in `CsvImportErrors.test.tsx` accepts an `ar` boolean to pick the right label. Pass `true` when rendering with `isAr={true}`.

## `CsvImportErrors.test.tsx` — global `confirm` stub is false
The file's `beforeEach` stubs `window.confirm` to `() => false`. This means any test that needs an exact-name-match supplier to be MERGED (not skipped) must override with `vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))` in a local `beforeEach`. Otherwise the supplier is silently skipped and "Imported 0" is reported.

**Why:** The shared stub prevents accidental overwrite noise in most tests; it can't be changed globally without breaking the skip-on-duplicate tests.

**How to apply:** Add a nested `beforeEach` inside the describe block for merge-path tests. The shared `afterEach(() => vi.unstubAllGlobals())` will restore the original afterward.
