/**
 * AIPlanPanel — saved-plan notice visibility regression tests (Task 242)
 *
 * Guards the `showSavedNotice` condition:
 *   !!savedPlan && !result && !loading && !error && !disabled
 *
 * The notice must stay hidden when `disabled` is true (form is empty / not
 * filled enough to generate a plan), and must appear once `disabled` is false.
 *
 * Simulates the fresh-sign-in scenario:
 *   1. User signs in → the component mounts with a savedPlan from the server
 *      but with an empty/unfilled form (disabled=true) → notice is hidden.
 *   2. User fills in at least one field → disabled becomes false → notice appears.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';

/* ── Module mocks ──────────────────────────────────────────────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

// Authenticated user — mirrors the post-sign-in state
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'testuser' },
    isAuthenticated: true,
    loading: false,
  }),
}));

// wouter navigate — not exercised here but imported by AIPlanPanel
vi.mock('wouter', () => ({
  useLocation: () => ['/maturity', vi.fn()],
}));

/* ── Component import (after mocks) ─────────────────────────────────────── */

import { AIPlanPanel } from '../AIPlanPanel';

/* ── Shared savedPlan fixture ─────────────────────────────────────────────── */

const SAVED_PLAN = {
  id: 'plan-123',
  toolKey: 'maturity',
  content: 'Prior maturity plan content',
  savedAt: new Date('2026-07-01T10:00:00Z').toISOString(),
};

/* ── Helper: find the saved-plan notice by its data-testid or text content ── */

function findSavedNotice(container: Element): Element | null {
  // The notice contains the "Last plan" text (English) or "آخر خطة" (Arabic)
  return (
    container.querySelector('[data-testid="saved-plan-notice"]') ??
    Array.from(container.querySelectorAll('div')).find(
      el =>
        el.textContent?.includes('Last plan') ||
        el.textContent?.includes('آخر خطة'),
    ) ??
    null
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Core visibility contract
══════════════════════════════════════════════════════════════════════════ */

describe('AIPlanPanel — saved-plan notice visibility', () => {
  beforeEach(() => {
    cleanup();
  });

  /* ── 1. Empty form (disabled=true) — notice must be hidden ── */

  it('hides the saved-plan notice when the form is empty (disabled=true)', () => {
    const { container } = render(
      <AIPlanPanel
        loading={false}
        result={null}
        error={null}
        onGenerate={vi.fn()}
        onReset={vi.fn()}
        buttonLabel="Generate Plan ✨"
        isAr={false}
        disabled={true}          // form is empty / unfilled
        savedPlan={SAVED_PLAN}
        onViewSaved={vi.fn()}
        onDeleteSaved={vi.fn()}
      />,
    );

    expect(findSavedNotice(container)).toBeNull();
  });

  /* ── 2. Filled form (disabled=false) — notice must be visible ── */

  it('shows the saved-plan notice once the form has data (disabled=false)', () => {
    const { container } = render(
      <AIPlanPanel
        loading={false}
        result={null}
        error={null}
        onGenerate={vi.fn()}
        onReset={vi.fn()}
        buttonLabel="Generate Plan ✨"
        isAr={false}
        disabled={false}         // form has enough data
        savedPlan={SAVED_PLAN}
        onViewSaved={vi.fn()}
        onDeleteSaved={vi.fn()}
      />,
    );

    expect(findSavedNotice(container)).not.toBeNull();
  });

  /* ── 3. Transition: disabled → enabled (re-render) ── */

  it('reveals the notice after re-render when disabled transitions from true to false', () => {
    const { container, rerender } = render(
      <AIPlanPanel
        loading={false}
        result={null}
        error={null}
        onGenerate={vi.fn()}
        onReset={vi.fn()}
        buttonLabel="Generate Plan ✨"
        isAr={false}
        disabled={true}
        savedPlan={SAVED_PLAN}
        onViewSaved={vi.fn()}
        onDeleteSaved={vi.fn()}
      />,
    );

    // Before the user fills the form: notice is absent
    expect(findSavedNotice(container)).toBeNull();

    // User fills in a field → parent re-renders with disabled=false
    rerender(
      <AIPlanPanel
        loading={false}
        result={null}
        error={null}
        onGenerate={vi.fn()}
        onReset={vi.fn()}
        buttonLabel="Generate Plan ✨"
        isAr={false}
        disabled={false}
        savedPlan={SAVED_PLAN}
        onViewSaved={vi.fn()}
        onDeleteSaved={vi.fn()}
      />,
    );

    // After the user fills the form: notice should appear
    expect(findSavedNotice(container)).not.toBeNull();
  });

  /* ── 4. No savedPlan at all → notice must never appear ── */

  it('never shows the notice when there is no savedPlan, even if form is filled', () => {
    const { container } = render(
      <AIPlanPanel
        loading={false}
        result={null}
        error={null}
        onGenerate={vi.fn()}
        onReset={vi.fn()}
        buttonLabel="Generate Plan ✨"
        isAr={false}
        disabled={false}
        savedPlan={null}         // no prior plan
        onViewSaved={vi.fn()}
        onDeleteSaved={vi.fn()}
      />,
    );

    expect(findSavedNotice(container)).toBeNull();
  });

  /* ── 5. savedPlan + disabled=true + no result/error → still hidden ── */

  it('keeps the notice hidden when disabled is true regardless of other idle state', () => {
    const { container } = render(
      <AIPlanPanel
        loading={false}
        result={null}
        error={null}
        onGenerate={vi.fn()}
        onReset={vi.fn()}
        buttonLabel="Generate Plan ✨"
        isAr={false}
        disabled={true}
        savedPlan={SAVED_PLAN}
        onViewSaved={vi.fn()}
        onDeleteSaved={vi.fn()}
      />,
    );

    expect(findSavedNotice(container)).toBeNull();
  });

  /* ── 6. savedPlan present but result already loaded → notice suppressed ── */

  it('hides the notice when a fresh result is already showing (result truthy)', () => {
    const { container } = render(
      <AIPlanPanel
        loading={false}
        result="Some freshly generated plan text"
        error={null}
        onGenerate={vi.fn()}
        onReset={vi.fn()}
        buttonLabel="Generate Plan ✨"
        isAr={false}
        disabled={false}
        savedPlan={SAVED_PLAN}
        onViewSaved={vi.fn()}
        onDeleteSaved={vi.fn()}
      />,
    );

    expect(findSavedNotice(container)).toBeNull();
  });

  /* ── 7. Arabic mode: notice is hidden on empty form, visible once filled ── */

  it('hides the Arabic saved-plan notice when disabled=true', () => {
    const { container } = render(
      <AIPlanPanel
        loading={false}
        result={null}
        error={null}
        onGenerate={vi.fn()}
        onReset={vi.fn()}
        buttonLabel="توليد الخطة ✨"
        isAr={true}
        disabled={true}
        savedPlan={SAVED_PLAN}
        onViewSaved={vi.fn()}
        onDeleteSaved={vi.fn()}
      />,
    );

    expect(findSavedNotice(container)).toBeNull();
  });

  it('shows the Arabic saved-plan notice when disabled=false', () => {
    const { container } = render(
      <AIPlanPanel
        loading={false}
        result={null}
        error={null}
        onGenerate={vi.fn()}
        onReset={vi.fn()}
        buttonLabel="توليد الخطة ✨"
        isAr={true}
        disabled={false}
        savedPlan={SAVED_PLAN}
        onViewSaved={vi.fn()}
        onDeleteSaved={vi.fn()}
      />,
    );

    expect(findSavedNotice(container)).not.toBeNull();
  });
});
