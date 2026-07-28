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

/** Alice with populated optional fields */
const ALICE_WITH_CONTACT: Record<string, unknown> = {
  id: 1, fullName: 'Alice', email: 'alice@example.com',
  mobile: '+1-555-0100', designation: 'Engineer', company: 'Acme', role: 'user',
};
/** Updated user returned by the server after a save */
const ALICE_UPDATED_CONTACT: Record<string, unknown> = {
  id: 1, fullName: 'Alice', email: 'alice@example.com',
  mobile: '+1-555-9999', designation: 'Senior Engineer', company: 'Acme', role: 'user',
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

/* ══════════════════════════════════════════════════════════════════════════
   mobile & designation pre-fill
══════════════════════════════════════════════════════════════════════════ */

describe('AccountSettings — mobile and designation input pre-fill', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  // ── 1. Initial pre-fill for mobile and designation ────────────────────
  it('pre-fills mobile and designation from the user object on mount', async () => {
    stubFetch({ meUser: ALICE_WITH_CONTACT, updatedUser: ALICE_UPDATED_CONTACT });
    renderAccountSettings();

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>(/Mobile/i).value).toBe('+1-555-0100');
      expect(screen.getByLabelText<HTMLInputElement>(/Job title/i).value).toBe('Engineer');
    });
  });

  // ── 2. mobile updates to server-returned value after save ─────────────
  it('updates the mobile input to the server-returned value after a successful save', async () => {
    stubFetch({ meUser: ALICE_WITH_CONTACT, updatedUser: ALICE_UPDATED_CONTACT });
    renderAccountSettings();

    // Wait for initial pre-fill
    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>(/Mobile/i).value).toBe('+1-555-0100');
    });

    // Edit the mobile field
    const mobileInput = screen.getByLabelText<HTMLInputElement>(/Mobile/i);
    fireEvent.change(mobileInput, { target: { value: '+1-555-9999' } });
    expect(mobileInput.value).toBe('+1-555-9999');

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));

    // After save, useEffect fires with server-returned user → mobile should be server value
    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>(/Mobile/i).value).toBe('+1-555-9999');
    });
  });

  // ── 3. designation updates to server-returned value after save ─────────
  it('updates the designation input to the server-returned value after a successful save', async () => {
    stubFetch({ meUser: ALICE_WITH_CONTACT, updatedUser: ALICE_UPDATED_CONTACT });
    renderAccountSettings();

    // Wait for initial pre-fill
    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>(/Job title/i).value).toBe('Engineer');
    });

    // Edit the designation field
    const designationInput = screen.getByLabelText<HTMLInputElement>(/Job title/i);
    fireEvent.change(designationInput, { target: { value: 'Senior Engineer' } });
    expect(designationInput.value).toBe('Senior Engineer');

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));

    // After save, useEffect fires with server-returned user → designation should be server value
    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>(/Job title/i).value).toBe('Senior Engineer');
    });
  });

  // ── 4. server-corrected mobile value overrides what the user typed ─────
  it('reflects the server-corrected mobile even when it differs from what the user typed', async () => {
    const serverCorrected = { ...ALICE_WITH_CONTACT, mobile: '+1-555-0000' };
    stubFetch({ meUser: ALICE_WITH_CONTACT, updatedUser: serverCorrected });
    renderAccountSettings();

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>(/Mobile/i).value).toBe('+1-555-0100');
    });

    const mobileInput = screen.getByLabelText<HTMLInputElement>(/Mobile/i);
    fireEvent.change(mobileInput, { target: { value: '+1-555-1234' } });
    fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));

    // Server returns '+1-555-0000' — input must reflect that, not the user's typed value
    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>(/Mobile/i).value).toBe('+1-555-0000');
    });
  });

  // ── 5. server-corrected designation value overrides what the user typed ─
  it('reflects the server-corrected designation even when it differs from what the user typed', async () => {
    const serverCorrected = { ...ALICE_WITH_CONTACT, designation: 'Principal Engineer' };
    stubFetch({ meUser: ALICE_WITH_CONTACT, updatedUser: serverCorrected });
    renderAccountSettings();

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>(/Job title/i).value).toBe('Engineer');
    });

    const designationInput = screen.getByLabelText<HTMLInputElement>(/Job title/i);
    fireEvent.change(designationInput, { target: { value: 'Staff Engineer' } });
    fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));

    // Server returns 'Principal Engineer' — input must reflect that
    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>(/Job title/i).value).toBe('Principal Engineer');
    });
  });

  // ── 6. null mobile from server clears the mobile input ────────────────
  it('clears the mobile input when the server returns null for mobile', async () => {
    const serverCleared = { ...ALICE_WITH_CONTACT, mobile: null };
    stubFetch({ meUser: ALICE_WITH_CONTACT, updatedUser: serverCleared });
    renderAccountSettings();

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>(/Mobile/i).value).toBe('+1-555-0100');
    });

    fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>(/Mobile/i).value).toBe('');
    });
  });
});
