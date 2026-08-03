/**
 * Task 336 — Confirm the sign-up countdown message appears correctly in Arabic
 * when the register endpoint is rate-limited.
 *
 * Coverage:
 *  - Arabic mode: shows localised countdown with correct minute count
 *  - English mode: shows English countdown with correct minute count
 *  - Singular vs plural ("~1 minute" not "~1 minutes")
 *  - retryAfterSeconds absent: falls back to generic error, not countdown
 */

import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent, act } from '@testing-library/react';

/* ── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test/api' }));

// Allow per-test lang override
let mockLang: 'en' | 'ar' = 'en';
vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: mockLang, ar: mockLang === 'ar', t: (k: string) => k }),
}));

const mockRegister = vi.fn();
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
    login: vi.fn(),
    isAuthenticated: false,
    loading: false,
  }),
}));

vi.mock('wouter', () => ({
  Link:        ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
  useLocation: () => ['/', vi.fn()],
  useSearch:   () => '',
}));

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      ...actual.motion,
      div: React.forwardRef(
        ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>, ref: React.Ref<HTMLDivElement>) =>
          <div ref={ref} {...rest}>{children}</div>,
      ),
    },
  };
});

import { Login } from '@/pages/Login';

/* ── Helpers ─────────────────────────────────────────────────────────────── */

/** Fill every registration field so the form validation passes */
function fillRegisterFormEn() {
  fireEvent.change(screen.getByPlaceholderText('e.g. Ahmed Al-Rashid'), { target: { value: 'Jane Doe' } });
  fireEvent.change(screen.getAllByPlaceholderText('you@company.com')[0], { target: { value: 'jane@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'password123' } });
  fireEvent.change(screen.getByPlaceholderText('+966 5XX XXX XXXX'), { target: { value: '+1234567890' } });
  fireEvent.change(screen.getByPlaceholderText('e.g. Supply Chain Manager'), { target: { value: 'Manager' } });
  fireEvent.change(screen.getByPlaceholderText('e.g. Saudi Aramco'), { target: { value: 'ACME Corp' } });
}

/** Fill every registration field in Arabic mode (placeholders differ) */
function fillRegisterFormAr() {
  document.querySelectorAll('input').forEach(input => {
    if (input.type === 'email')
      fireEvent.change(input, { target: { value: 'test@example.com' } });
    else if (input.type === 'text' || input.type === 'password' || input.type === 'tel')
      fireEvent.change(input, { target: { value: 'testvalue' } });
  });
}

/** Make register() throw with retryAfterSeconds attached */
function mockRateLimit(retryAfterSeconds: number) {
  const err = Object.assign(new Error('Too many attempts'), { retryAfterSeconds });
  mockRegister.mockRejectedValue(err);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  mockRegister.mockReset();
  mockLang = 'en';
});

/* ── Tests ────────────────────────────────────────────────────────────────── */

describe('Sign-up rate-limit countdown (Task 336)', () => {
  it('shows the English countdown when register returns a 429-style error', async () => {
    mockRateLimit(120); // 2 minutes

    render(<Login />);
    fillRegisterFormEn();

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /Create Account & Continue/i }));
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Too many attempts — try again in ~2 minutes/i),
      ).toBeInTheDocument();
    });
  });

  it('shows the Arabic countdown with the correct minute count in Arabic mode', async () => {
    mockLang = 'ar';
    mockRateLimit(60); // 1 minute → ceil(60/60) = 1

    render(<Login />);
    fillRegisterFormAr();

    await act(async () => {
      fireEvent.submit(document.querySelector('form') as HTMLFormElement);
    });

    await waitFor(() => {
      // Arabic message must contain the rate-limit phrase and the digit "1"
      const el = screen.getByText(
        (txt) => txt.includes('محاولات كثيرة جداً') && txt.includes('1') && txt.includes('دقيقة'),
      );
      expect(el).toBeInTheDocument();
    });
  });

  it('uses singular "~1 minute" (not "~1 minutes") when retryAfterSeconds is 59', async () => {
    mockRateLimit(59); // ceil(59/60) = 1

    render(<Login />);
    fillRegisterFormEn();

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /Create Account & Continue/i }));
    });

    await waitFor(() => {
      // Must match "~1 minute" but NOT "~1 minutes"
      expect(screen.getByText(/~1 minute[^s]/i)).toBeInTheDocument();
    });
  });

  it('rounds up partial minutes (e.g. 121 s → "~3 minutes")', async () => {
    mockRateLimit(121); // ceil(121/60) = 3

    render(<Login />);
    fillRegisterFormEn();

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /Create Account & Continue/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/~3 minutes/i)).toBeInTheDocument();
    });
  });

  it('shows a generic error (not countdown) when no retryAfterSeconds is present', async () => {
    mockRegister.mockRejectedValue(new Error('Server error'));

    render(<Login />);
    fillRegisterFormEn();

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /Create Account & Continue/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Server error/i)).toBeInTheDocument();
      expect(screen.queryByText(/try again in/i)).not.toBeInTheDocument();
    });
  });
});
