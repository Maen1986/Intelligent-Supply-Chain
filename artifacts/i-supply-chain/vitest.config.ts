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
    // dozens of totally unrelated files (CLM Tools, TCO analytics, KPI
    // Dashboard, Maturity, FeedbackModal, ChatWidget, ...) with no thematic
    // connection to the two narrow changes (AuthContext.tsx, api-server's
    // typecheck script) in that same commit or the one that followed it --
    // strong evidence this is CI-box slowness hitting a timeout tuned for a
    // developer laptop, not 275 real regressions appearing at once. Raised
    // generously rather than fixing individual tests' timeout args one at a
    // time, since the pattern is global, not per-test.
    testTimeout: 30000,
    hookTimeout: 30000,
    // Second, separate problem found on the very next deploy (commit
    // 0baad12c, the one that added the timeouts above): the build log
    // stopped mid-suite -- tests were genuinely passing (Login,
    // AIPlanPanel, ResiliencyTools, ...), then log output simply stopped
    // for ~73s with zero error/stack-trace/summary line, followed by
    // Render marking the whole build build_failed. A real assertion
    // failure or thrown error always produces log text; a silent,
    // abrupt stop with no final "Test Files"/"FAIL" summary line is the
    // signature of the OS killing the process outright (most consistent
    // with an OOM kill), not of vitest reporting a failure on its own.
    // isc-frontend's Render build plan is "starter" -- a small, shared-
    // memory box -- and by default vitest sizes its worker-process pool
    // off the container's *reported* CPU count, which on small/shared
    // Render plans commonly overstates real available cores/memory,
    // so the default pool can spin up more concurrent jsdom+RTL worker
    // processes than the box can actually hold in memory. That risk grew
    // worse, not better, from the testTimeout fix above: tests that
    // previously aborted fast (5s timeout) now run to real completion
    // (up to 30s), holding each worker's memory (jsdom heap + React
    // Testing Library + fake timers) for longer, which raises peak
    // concurrent memory rather than lowering it.
    // Fix: explicitly cap the fork pool at 2 concurrent workers instead of
    // trusting the box's reported CPU count, trading some wall-clock time
    // for a bounded, predictable memory footprint. This is a reasoned
    // diagnosis from the log's failure *shape* (silent truncation, no
    // error text), not a confirmed OOM read from an explicit Render log
    // line -- Render's build logs did not surface one. If this build still
    // fails the same way, the next, more conservative step is
    // maxForks: 1 (fully serial) to isolate whether concurrency is really
    // the cause.
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 2,
        minForks: 1,
      },
    },
  },
});
