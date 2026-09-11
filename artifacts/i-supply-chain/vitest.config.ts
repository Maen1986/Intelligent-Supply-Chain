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
  },
});
