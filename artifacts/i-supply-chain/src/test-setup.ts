import '@testing-library/jest-dom/vitest';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Task 627 — Prevent stale DOM from leaking between test groups.
 *
 * vitest globals are off in this project, so @testing-library/react's
 * automatic cleanup-on-afterEach does not fire unless explicitly wired.
 * Running cleanup() here guarantees every rendered component is unmounted
 * after each test regardless of whether the individual test file remembers
 * to import and call it.
 */
afterEach(() => {
  cleanup();
});

/* ── jsdom doesn't ship ResizeObserver; stub it globally for recharts ───── */
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

/* ── Recharts logs "width(0) and height(0)" in jsdom because there is no   ──
   ── layout engine. Mock ResponsiveContainer to render children at a fixed  ──
   ── size so those warnings never appear in test output.                    ── */
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    ResponsiveContainer: ({
      children,
    }: {
      children: React.ReactNode | ((size: { width: number; height: number }) => React.ReactNode);
    }) => {
      const size = { width: 800, height: 400 };
      return React.createElement(
        'div',
        { style: { width: 800, height: 400 } },
        typeof children === 'function' ? children(size) : children,
      );
    },
  };
});
