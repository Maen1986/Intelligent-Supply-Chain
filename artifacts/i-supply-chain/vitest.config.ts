import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test-setup.ts'],
    // Render's build container is far slower/more CPU-constrained than a dev
    // machine, and this is the first time this whole suite has ever run in
    // that environment (the CI gate that wires `test` into `build` -- commit
    // 368f09d -- was only added tonight). At vitest's 5000ms default, 275 of
    // this suite's tests timed out on their very first CI run, spread across
    // dozens of totally unrelated files, not 275 real regressions appearing
    // at once.
    //
    // Raised once already to 30000ms (commit 0baad12c). That surfaced a
    // second, separate problem (silent mid-suite death, fixed in bf4bfd97 by
    // capping the fork pool at 2 workers) -- and once that stability fix let
    // the suite run to real completion, it also showed 30s is STILL not
    // enough headroom on this box: e.g. Header.mobile.test.tsx's simplest
    // test ("renders an Admin Dashboard link...") -- three RTL interactions,
    // application logic read and confirmed correct against the test's own
    // mock (Header.tsx:252 `user.role === 'admin'`, matching the mock's
    // `role: 'admin'` exactly) -- still took 36499ms and failed purely on
    // the 30s ceiling. Raising again to 60000ms for the same reason as
    // before: this is CI-box slowness under a 2-worker cap, not 33 new
    // regressions appearing at once from an unrelated infra commit.
    //
    // Also: several failing files show a suspicious pattern worth tracking
    // as a *possible* real bug in the test suite's own hygiene rather than
    // application code -- FeedbackModal.maturity.test.tsx's first 3 tests
    // ran 40-53s each (over the old 30s ceiling) and then its remaining 8
    // tests in the SAME file failed near-instantly (3-701ms), which reads
    // like cascading failure from shared/module-level mock state not being
    // reset after an abrupt timeout-triggered teardown, not 8 independent
    // new bugs. Raising the ceiling here also removes that as a confound --
    // if a file still shows the same "slow first test(s), fast-cascading
    // failures after" shape at 60s, that points at the shared-state theory
    // specifically and should be investigated as a test-suite bug, not
    // application logic.
    testTimeout: 60000,
    hookTimeout: 60000,
    // Second, separate problem found on the deploy right after the first
    // testTimeout raise (commit 0baad12c): the build log stopped mid-suite
    // -- tests were genuinely passing, then log output simply stopped for
    // ~73s with zero error/stack-trace/summary line, followed by Render
    // marking the whole build build_failed. A real assertion failure or
    // thrown error always produces log text; a silent, abrupt stop with no
    // final "Test Files"/"FAIL" summary line is the signature of the OS
    // killing the process outright (most consistent with an OOM kill), not
    // of vitest reporting a failure on its own. isc-frontend's Render build
    // plan is "starter" -- a small, shared-memory box -- and vitest's
    // default pool sizing (off the container's *reported* CPU count) can
    // overshoot what a small/shared plan actually has, spinning up more
    // concurrent jsdom+RTL worker processes than the box can hold. Fixed
    // (commit bf4bfd97) by capping the fork pool explicitly instead of
    // trusting the reported CPU count -- confirmed working: the very next
    // deploy ran the full 4064-test suite to real completion (Test Files 9
    // failed | 201 passed (210), Tests 33 failed | 4031 passed (4064)) with
    // no more silent deaths.
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 2,
        minForks: 1,
      },
    },
  },
});
