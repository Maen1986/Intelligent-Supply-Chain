/**
 * ChatWidget.mobile-overlap.test.tsx -- zero-overlap rule (owner, 23 Oct 2026).
 * On mobile (<768px) the chat launcher renders IN FLOW (a normal row at the end
 * of the page) so it can never cover content; on desktop the original floating
 * avatar button is unchanged. Real layout proof is the Playwright scan.
 */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';

const mobileState = { value: true };
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => mobileState.value }));
vi.mock('@/lib/LanguageContext', () => ({ useLanguage: () => ({ lang: 'en', setLang: vi.fn() }) }));
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, loading: false }),
}));
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: { cancel: vi.fn(), speak: vi.fn(), resume: vi.fn(), getVoices: () => [], paused: false, addEventListener: vi.fn(), removeEventListener: vi.fn() },
});
Element.prototype.scrollIntoView = () => {};
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      ...actual.motion,
      div: React.forwardRef(({ children, initial, animate, exit, transition, whileHover, whileTap, ...rest }: any, ref: any) => <div ref={ref} {...rest}>{children}</div>),
      button: React.forwardRef(({ children, initial, animate, exit, transition, whileHover, whileTap, ...rest }: any, ref: any) => <button ref={ref} {...rest}>{children}</button>),
    },
  };
});

import { ChatWidget } from './ChatWidget';

afterEach(cleanup);

describe('ChatWidget launcher -- zero overlap on mobile', () => {
  it('mobile: in-flow row, never fixed/absolute, labelled pill still opens chat', () => {
    mobileState.value = true;
    render(<ChatWidget />);
    const wrap = screen.getByTestId('chat-trigger-wrap');
    expect(wrap.getAttribute('data-mobile-inflow')).toBe('true');
    expect(wrap.className).not.toMatch(/\bfixed\b/);
    expect(wrap.className).not.toMatch(/\babsolute\b/);
    const btn = screen.getByRole('button', { name: /open chat with maen/i });
    expect(btn.textContent).toMatch(/Chat with Maen/);
  });

  it('desktop: original floating avatar button unchanged', () => {
    mobileState.value = false;
    render(<ChatWidget />);
    const wrap = screen.getByTestId('chat-trigger-wrap');
    expect(wrap.getAttribute('data-mobile-inflow')).toBe('false');
    expect(wrap.className).toBe('fixed bottom-6 right-6 z-50');
    const btn = screen.getByRole('button', { name: /open chat with maen/i });
    expect(btn.className).toContain('w-16 h-16 rounded-full');
  });
});
