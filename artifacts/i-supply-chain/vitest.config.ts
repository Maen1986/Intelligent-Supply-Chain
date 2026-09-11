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
    // 368f09d -- was only added tonight).
    //
    // History of this setting tonight, each step forced by real evidence
    // from the next deploy, not guessed in advance:
    //   1. 5000ms default -> 275/4064 tests timed out on the suite's first-
    //      ever CI run (0baad12c raised it to 30000ms).
    //   2. At 30000ms with the default (unbounded) worker pool, the build
    //      log died silently mid-suite -- tests genuinely passing, then log
    //      output stopped completely with no error/summary line, followed
    //      by build_failed ~73s later. That silent-death shape is what an
    //      OOM kill looks like (SIGKILL gives no chance to flush output),
    //      not vitest reporting its own failure. isc-frontend's Render
    //      buildPlan is "starter" -- a small, shared-memory box -- and
    //      vitest sizes its pool off the container's *reported* CPU count,
    //      which on small/shared plans commonly overstates real available
    //      memory. Fixed (bf4bfd97) by explicitly capping the fork pool at
    //      2 workers. Confirmed working: the suite ran to real completion
    //      for the first time (Test Files 9 failed | 201 passed (210)).
    //   3. At 30000ms + 2 workers, several failures were purely the timeout:
    //      e.g. Header.mobile.test.tsx's simplest test (3 plain RTL
    //      interactions, application logic read and confirmed correct
    //      against Header.tsx:252) took 36499ms and failed on the 30s
    //      ceiling alone. Raised to 60000ms (d2ffac5f).
    //   4. At 60000ms + 2 workers, Header.mobile.test.tsx passed (confirming
    //      step 3's diagnosis) -- but SIX test files failed to even start:
    //      "[vitest-pool]: Failed to start forks worker for test files
    //      ...". That is a worker-process spawn failure, not a test
    //      failure or a timeout -- it means the box ran out of some OS
    //      resource (almost certainly memory) trying to keep 2 forked
    //      jsdom+RTL worker processes alive for the longer 60s window each
    //      test file is now allowed to hold one open. Longer per-test
    //      headroom raised peak concurrent memory again, the same dynamic
    //      that caused step 2's OOM, just manifesting differently this
    //      time (an explicit spawn error instead of a silent kill).
    //      Separately: the SET of failing tests also changed between the
    //      30s and 60s runs (e.g. EvAccordionScrollRestore passed at 60s
    //      but Maturity.coverage-badge, ProcurementTools.tco.analytics,
    //      SupplierScorecard.server-sync, SubmissionCardAccordion, and
    //      TabKeyboardNav newly failed) at essentially the same total
    //      failure count (32-33). That is the signature of resource-
    //      contention flakiness -- which specific tests lose the race for
    //      CPU/memory each run -- not a stable set of logic bugs.
    //   Conclusion: this box cannot reliably hold 2 concurrent worker
    //   processes for this suite's real memory footprint, regardless of
    //   the timeout ceiling. Dropping to a single, fully serial worker
    //   (maxForks/minForks: 1) below, trading significantly more wall-clock
    //   time for a memory footprint bounded by one worker instead of two.
    //   If the suite still can't complete cleanly serial, that is strong,
    //   disclosed evidence this box's plan (not the test suite or the app)
    //   needs a real upgrade -- an infrastructure/billing decision for the
    //   owner, not something to route around further from here.
    testTimeout: 60000,
    hookTimeout: 60000,
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 1,
        minForks: 1,
      },
    },
  },
});
