import '@testing-library/jest-dom/vitest';

/* ── jsdom doesn't ship ResizeObserver; stub it globally for recharts ───── */
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
