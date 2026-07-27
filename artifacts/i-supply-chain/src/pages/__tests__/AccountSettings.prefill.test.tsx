/**
 * AccountSettings — profile form pre-fill after a successful save
 *
 * Confirms that the useEffect on `user` (lines 43-50 in AccountSettings.tsx)
 * keeps the fullName input in sync with the user object returned by the server.
 *
 * Flow:
 *  1. AuthProvider mounts, fetches /auth/me → returns user with fullName "Alice".
 *  2. AccountSettings renders; the fullName input pre-fills with "Alice".
 *  3. User edits the field to "Bob" and submits the form.
 *  4. POST /auth/update-profile returns { ok: true, user: { fullName: "Bob", … } }.
 *  5. AuthContext.updateProfile calls setUser(data.user).
 *  6. The useEffect in AccountSettings fires → setFullName("Bob").
 *  7. The input now shows "Bob".
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';

/* ── Stable mocks (module-level, set before any import of the SUT) ──────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test/api' }));

vi.mock('wouter', () => ({
  useLocation: () => ['/', vi.fn()],
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/LanguageContext', () => ({
  useLanguage:    () => ({ lang: 'en', setLang: vi.fn() }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/SavedPlansSection', () => ({
  SavedPlansSection: () => <div data-testid="saved-plans-stub" />,
}));

/* ── Import real modules AFTER mocks are declared ───────────────────────── */
import { AuthProvider } from '@/lib/AuthContext';
import { AccountSettings } from '@/pages/AccountSettings';

/* ── Shared user fixtures ────────────────────────────────────────────────── */
const ALICE: Record<string, unknown> = {
  id: 1, fullName: 'Alice', email: 'alice@example.com',
  mobile: null, designation: null, company: null, role: 'user',
};
const BOB: Record<string, unknown> = {
  id: 1, fullName: 'Bob', email: 'alice@example.com',
  mobile: null, designation: null, company: null, role: 'user',
};

/* ── Fetch helpers ───────────────────────────────────────────────────────── */

/**
 * Sets up global fetch so that:
 *  - GET  /auth/me             → ALICE
 *  - POST /auth/update-profile → BOB
 *  - everything else           → generic ok
 */
function stubFetch(opts: { meUser?: Record<string, unknown>; updatedUser?: Record<string, unknown> } = {}) {
  const meUser      = opts.meUser      ?? ALICE;
  const updatedUser = opts.updatedUser ?? BOB;

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const method = (init?.method ?? 'GET').toUpperCase();

      if (method === 'GET' && (url as string).includes('/auth/me')) {
        return Promise.resolve({
          ok:   true,
          json: async () => ({ ok: true, user: meUser }),
        });
      }

      if (method === 'POST' && (url as string).includes('/auth/update-profile')) {
        return Promise.resolve({
          ok:   true,
          json: async () => ({ ok: true, user: updatedUser }),
        });
      }

      // Catch-all (e.g. GET /plans/*, visibility-change re-validation)
      return Promise.resolve({
        ok:   true,
        json: async () => ({ ok: true, user: meUser }),
      });
    }),
  );
}

/* ── Render helper ───────────────────────────────────────────────────────── */

function renderAccountSettings() {
  return render(
    <AuthProvider>
      <AccountSettings />
    </AuthProvider>,
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Tests
══════════════════════════════════════════════════════════════════════════ */

describe('AccountSettings — fullName input pre-fill', () => {
  beforeEach(() => {
    stubFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  // ── 1. Initial pre-fill ────────────────────────────────────────────────
  it('pre-fills the fullName input with the current user name on mount', async () => {
    renderAccountSettings();

    // Wait for the auth/me fetch to resolve and the form to populate
    await waitFor(() => {
      const input = screen.getByLabelText<HTMLInputElement>(/Full name/i);
      expect(input.value).toBe('Alice');
    });
  });

  // ── 2. Pre-fill updates after a successful save ────────────────────────
  it('updates the fullName input to the server-returned name after a successful save', async () => {
    renderAccountSettings();

    // Wait for initial pre-fill
    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>(/Full name/i).value).toBe('Alice');
    });

    // Edit the name field
    const input = screen.getByLabelText<HTMLInputElement>(/Full name/i);
    fireEvent.change(input, { target: { value: 'Bob' } });
    expect(input.value).toBe('Bob');

    // Submit the profile form
    fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));

    // After updateProfile resolves, setUser(data.user) fires, triggering the
    // useEffect which calls setFullName(user.fullName).
    await waitFor(() => {
      const updatedInput = screen.getByLabelText<HTMLInputElement>(/Full name/i);
      expect(updatedInput.value).toBe('Bob');
    });
  });

  // ── 3. Form still shows new name if user navigates away and back ───────
  it('keeps the new name in the input after the success banner appears', async () => {
    renderAccountSettings();

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>(/Full name/i).value).toBe('Alice');
    });

    const input = screen.getByLabelText<HTMLInputElement>(/Full name/i);
    fireEvent.change(input, { target: { value: 'Bob' } });
    fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));

    // Success banner should appear
    await waitFor(() => {
      expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument();
    });

    // Input value must still be the server-confirmed name
    expect(screen.getByLabelText<HTMLInputElement>(/Full name/i).value).toBe('Bob');
  });

  // ── 4. Input reflects server response even if server corrects the value ─
  it('reflects the server-normalised name even when it differs from what the user typed', async () => {
    // Server normalises "  bob  " → "Bob" (trimmed + capitalised)
    const serverNormalised = { ...BOB, fullName: 'Bobby' };
    stubFetch({ updatedUser: serverNormalised });

    renderAccountSettings();

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>(/Full name/i).value).toBe('Alice');
    });

    const input = screen.getByLabelText<HTMLInputElement>(/Full name/i);
    // User types something slightly different from what the server will return
    fireEvent.change(input, { target: { value: 'Bobby Junior' } });
    fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));

    // Server returns "Bobby" — the input should show that, not "Bobby Junior"
    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>(/Full name/i).value).toBe('Bobby');
    });
  });
});
