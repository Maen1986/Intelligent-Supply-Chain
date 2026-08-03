/**
 * Task 336 — Sign-up form: Arabic rate-limit countdown message
 * Task 337 — Forgot-password form: friendly countdown when 429 is hit
 *
 * Both forms share the same pattern:
 *   - A 429 response (or thrown error with retryAfterSeconds) triggers
 *     a friendly "try again in ~N minutes" message.
 *   - English and Arabic variants are asserted separately.
 */

import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent, act } from '@testing-library/react';

/* ── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test/api' }));

let mockLang: { lang: 'en' | 'ar' } = { lang: 'en' };
vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ ...mockLang, ar: mockLang.lang === 'ar', t: (k: string) => k }),
}));

const mockRegister = vi.fn();
const mockLogin    = vi.fn();
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ register: mockRegister, login: mockLogin, isAuthenticated: false, loading: false }),
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

/** Fill in all registration fields with valid English-placeholder data */
function fillRegisterForm() {
  fireEvent.change(screen.getByPlaceholderText('e.g. Ahmed Al-Rashid'), { target: { value: 'Jane Doe' } });
  fireEvent.change(screen.getAllByPlaceholderText('you@company.com')[0], { target: { value: 'jane@example.com' } });
  // password — find by placeholder
  fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'password123' } });
  fireEvent.change(screen.getByPlaceholderText('+966 5XX XXX XXXX'), { target: { value: '+1234567890' } });
  fireEvent.change(screen.getByPlaceholderText('e.g. Supply Chain Manager'), { target: { value: 'Manager' } });
  fireEvent.change(screen.getByPlaceholderText('e.g. Saudi Aramco'), { target: { value: 'ACME' } });
}

/** Switch to login mode then click "Forgot password?" to enter forgot-password flow */
function openForgotForm() {
  // Start in register mode — switch to login tab first
  const signInTab = screen.getByRole('button', { name: /Sign In/i });
  fireEvent.click(signInTab);
  // Now in login mode: click the "Forgot password?" link
  const forgotBtn = screen.getByText(/Forgot password\?/i);
  fireEvent.click(forgotBtn);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  mockRegister.mockReset();
  mockLogin.mockReset();
  mockLang = { lang: 'en' };
});

/* ════════════════════════════════════════════════════════════════════════════
   Task 336 — Sign-up countdown: Arabic and English
════════════════════════════════════════════════════════════════════════════ */

describe('Login — sign-up rate-limit countdown message (Task 336)', () => {
  it('shows the English countdown message when sign-up returns a 429-style error', async () => {
    // register() throws with retryAfterSeconds (mirrors how AuthContext handles 429)
    const err = Object.assign(new Error('Too many attempts'), { retryAfterSeconds: 120 });
    mockRegister.mockRejectedValue(err);

    render(<Login />);
    fillRegisterForm();

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /Create Account & Continue/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Too many attempts — try again in ~2 minutes/i)).toBeInTheDocument();
    });
  });

  it('shows the Arabic countdown message when sign-up returns a 429-style error in Arabic mode (Task 336)', async () => {
    mockLang = { lang: 'ar' };
    const err = Object.assign(new Error('rate limited'), { retryAfterSeconds: 60 });
    mockRegister.mockRejectedValue(err);

    render(<Login />);

    // In Arabic mode, fill the form with whatever is available (email + password minimum)
    const allInputs = document.querySelectorAll('input');
    allInputs.forEach(input => {
      if (input.type === 'email') fireEvent.change(input, { target: { value: 'test@example.com' } });
      else if (input.type === 'text' || input.type === 'password' || input.type === 'tel')
        fireEvent.change(input, { target: { value: 'testvalue' } });
    });

    await act(async () => {
      fireEvent.submit(document.querySelector('form') as HTMLFormElement);
    });

    await waitFor(() => {
      expect(
        screen.getByText((txt) => txt.includes('محاولات كثيرة جداً') && txt.includes('دقيقة')),
      ).toBeInTheDocument();
    });
  });

  it('shows "~1 minute" (not "~1 minutes") when retryAfterSeconds is 59', async () => {
    const err = Object.assign(new Error('rate limited'), { retryAfterSeconds: 59 });
    mockRegister.mockRejectedValue(err);

    render(<Login />);
    fillRegisterForm();

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /Create Account & Continue/i }));
    });

    await waitFor(() => {
      // ceil(59/60) = 1 → "~1 minute" not "~1 minutes"
      expect(screen.getByText(/~1 minute[^s]/i)).toBeInTheDocument();
    });
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Task 337 — Forgot-password countdown: English and Arabic
════════════════════════════════════════════════════════════════════════════ */

describe('Login — forgot-password rate-limit countdown message (Task 337)', () => {
  it('shows the English countdown message when forgot-password returns 429', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok:     false,
        status: 429,
        json:   async () => ({ retryAfterSeconds: 300 }),
      }),
    );

    render(<Login />);
    openForgotForm();

    // Enter email
    const emailInput = screen.getByPlaceholderText('you@company.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    await act(async () => {
      fireEvent.submit(document.querySelector('form') as HTMLFormElement);
    });

    await waitFor(() => {
      expect(screen.getByText(/Too many attempts — try again in ~5 minutes/i)).toBeInTheDocument();
    });
  });

  it('shows the Arabic countdown message when forgot-password returns 429 in Arabic mode (Task 337)', async () => {
    mockLang = { lang: 'ar' };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok:     false,
        status: 429,
        json:   async () => ({ retryAfterSeconds: 900 }),
      }),
    );

    render(<Login />);

    // In Arabic mode — switch to login then forgot
    const signInTab = screen.getByRole('button', { name: /تسجيل الدخول/i });
    fireEvent.click(signInTab);
    const forgotBtn = screen.getByText(/هل نسيت كلمة المرور/i);
    fireEvent.click(forgotBtn);

    const emailInput = screen.getByPlaceholderText('you@company.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    await act(async () => {
      fireEvent.submit(document.querySelector('form') as HTMLFormElement);
    });

    await waitFor(() => {
      expect(
        screen.getByText((txt) => txt.includes('محاولات كثيرة جداً') && txt.includes('دقيقة')),
      ).toBeInTheDocument();
    });
  });

  it('falls back to generic error when 429 response has no retryAfterSeconds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok:     false,
        status: 429,
        json:   async () => ({ error: 'Rate limited' }),
      }),
    );

    render(<Login />);
    openForgotForm();

    const emailInput = screen.getByPlaceholderText('you@company.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    await act(async () => {
      fireEvent.submit(document.querySelector('form') as HTMLFormElement);
    });

    // Falls through to the generic error handler (throws with data.error)
    await waitFor(() => {
      expect(screen.getByText(/Rate limited/i)).toBeInTheDocument();
    });
  });
});
