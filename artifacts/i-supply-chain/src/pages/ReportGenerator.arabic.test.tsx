/**
 * ReportGenerator — Arabic mode error paths (Task 711)
 *
 * The English error paths (401 and network failure) are confirmed in
 * ReportGenerator.flow.test.tsx. This file confirms that the same error
 * states are reachable and visible when the component is rendered in
 * Arabic mode (lang='ar'), ensuring the error banner is not accidentally
 * hidden or suppressed by the Arabic rendering path.
 *
 * Note: the 401 error message ("Please sign in again…") is always in
 * English because it is a hardcoded component string, not an API string.
 * This is the current designed behaviour — the test documents it.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor, act } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ReportGenerator } from '@/pages/ReportGenerator';

/* ── jsdom stubs ──────────────────────────────────────────────────────────── */
Element.prototype.scrollIntoView = () => {};

/* ── Shared mocks ─────────────────────────────────────────────────────────── */
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
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

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

/* ── Helpers ─────────────────────────────────────────────────────────────── */

/** Render in Arabic mode by pre-seeding the language in localStorage. */
function renderPageAr() {
  localStorage.setItem('isc-lang', 'ar');
  return render(
    <LanguageProvider>
      <ReportGenerator />
    </LanguageProvider>,
  );
}

/**
 * Fill all four required fields. The placeholder text and button labels are
 * the same regardless of language — the form uses hardcoded English strings.
 */
function fillRequiredFieldsAr() {
  fireEvent.change(screen.getByPlaceholderText('e.g. Ahmed Al-Rashidi'), { target: { value: 'أحمد' } });
  fireEvent.change(screen.getByPlaceholderText('e.g. Saudi Logistics Co.'), { target: { value: 'شركة اللوجستيات' } });
  // Industry and size are button-group selectors, same labels as in English mode
  fireEvent.click(screen.getByRole('button', { name: 'Manufacturing' }));
  fireEvent.click(screen.getByRole('button', { name: /SME — 50–250/i }));
}

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

/* ══════════════════════════════════════════════════════════════════════════
   Task 711 — Arabic mode error paths
══════════════════════════════════════════════════════════════════════════ */

describe('ReportGenerator — Arabic mode error paths (Task 711)', () => {
  it('E2-ar: 401 response shows the error banner in Arabic mode and returns to form phase', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    renderPageAr();
    fillRequiredFieldsAr();

    // The generate button label is always in English ("Generate My Report")
    const generateBtn = screen.getByRole('button', { name: /Generate My Report/i });
    await act(async () => { fireEvent.click(generateBtn); });

    // The error banner must appear (the "Generation failed" heading is currently English)
    await waitFor(() => {
      expect(screen.getByText(/Generation failed/i)).toBeInTheDocument();
    });

    // The sign-in-again message must be present
    expect(screen.getByText(/Please sign in again/i)).toBeInTheDocument();

    // Must be back on the form phase
    expect(screen.getByRole('button', { name: /Generate My Report/i })).toBeInTheDocument();
  });

  it('E3-ar: network failure shows the error banner in Arabic mode and returns to form phase', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    renderPageAr();
    fillRequiredFieldsAr();

    const generateBtn = screen.getByRole('button', { name: /Generate My Report/i });
    await act(async () => { fireEvent.click(generateBtn); });

    await waitFor(() => {
      expect(screen.getByText(/Generation failed/i)).toBeInTheDocument();
    });

    // The raw error message surfaces so the user knows it's a connectivity issue
    expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();

    // Must be back on the form phase (not stuck in generating)
    expect(screen.getByRole('button', { name: /Generate My Report/i })).toBeInTheDocument();
  });
});
