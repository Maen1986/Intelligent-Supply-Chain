import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

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
