/**
 * Zero-overlap rule: the floating Control Tower promo card is desktop-only.
 * On mobile (<768px) it must never render (a fixed card always covers content).
 */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';

const mobileState = { value: true };
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => mobileState.value }));
vi.mock('@/lib/LanguageContext', () => ({ useLanguage: () => ({ lang: 'en', setLang: vi.fn() }) }));
vi.mock('wouter', async () => {
  const actual = await vi.importActual<typeof import('wouter')>('wouter');
  return { ...actual, useLocation: () => ['/', vi.fn()] };
});
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: new Proxy({}, {
      get: (_t, tag: string) =>
        React.forwardRef(({ children, initial, animate, exit, transition, whileHover, whileTap, ...rest }: any, ref: any) =>
          React.createElement(tag, { ref, ...rest }, children)),
    }),
  };
});

import { CommandCentreFloat } from './CommandCentreFloat';

afterEach(() => { cleanup(); sessionStorage.clear(); vi.useRealTimers(); });

describe('CommandCentreFloat -- zero overlap on mobile', () => {
  it('mobile: renders nothing, even after the 5s reveal timer', () => {
    vi.useFakeTimers(); mobileState.value = true;
    const { container } = render(<CommandCentreFloat />);
    act(() => { vi.advanceTimersByTime(6000); });
    expect(container.innerHTML).toBe('');
  });

  it('desktop: card still appears after 5s (fixed, bottom-right)', () => {
    vi.useFakeTimers(); mobileState.value = false;
    const { container } = render(<CommandCentreFloat />);
    act(() => { vi.advanceTimersByTime(6000); });
    expect(container.querySelector('.fixed')).not.toBeNull();
  });
});
