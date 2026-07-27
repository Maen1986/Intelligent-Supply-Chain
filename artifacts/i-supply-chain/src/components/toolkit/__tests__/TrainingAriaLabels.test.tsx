/**
 * Training Assessment — score select aria-label regression tests
 *
 * Guards against a specific regression: when a member name input is cleared,
 * the score <select> aria-labels must NOT produce " — Domain" (leading
 * space) but must fall back to "Member N — Domain" (English) or
 * "عضو N — Domain" (Arabic).
 *
 * Scenarios:
 *   1. Default (non-empty) name  → uses the actual member name in the label
 *   2. Cleared name (empty string) → falls back to "Member N" / "عضو N"
 *   3. Whitespace-only name      → treated as empty; same fallback applies
 *   4. Arabic mode, all variants above
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';

/* ── Module mocks ──────────────────────────────────────────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, loading: false }),
}));

vi.mock('@/hooks/useAIPlan', () => ({
  useAIPlan: () => ({
    loading: false, result: null, error: null, rateLimited: false,
    generate: vi.fn(), reset: vi.fn(), savedPlan: null,
    viewSaved: vi.fn(), deleteSaved: vi.fn(),
    saveError: null, dismissSaveError: vi.fn(),
  }),
}));

vi.mock('@/components/AIPlanPanel', () => ({ AIPlanPanel: () => null }));

/* ── Component import (after mocks) ────────────────────────────────────── */

import { TrainingNeedsAssessment } from '../TrainingTools';

/* ── Helpers ────────────────────────────────────────────────────────────── */

/** Collect all aria-labels on score <select> elements in the rendered tree. */
function getScoreSelectLabels(container: Element): string[] {
  return Array.from(
    container.querySelectorAll<HTMLSelectElement>('select[id^="training-score-"]'),
  ).map(el => el.getAttribute('aria-label') ?? '');
}

/** Return the member-name <input> for the Nth member (0-based). */
function getMemberNameInput(container: Element, index: number): HTMLInputElement {
  const inputs = Array.from(
    container.querySelectorAll<HTMLInputElement>('input[id^="training-member-"]'),
  );
  return inputs[index];
}

/* ══════════════════════════════════════════════════════════════════════════
   English mode
══════════════════════════════════════════════════════════════════════════ */
describe('TrainingTools — score select aria-labels (English)', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it('includes the member name in every aria-label when the name is non-empty', () => {
    const { container } = render(<TrainingNeedsAssessment isAr={false} />);

    // Default member name is "Team Member 1"
    const labels = getScoreSelectLabels(container);
    expect(labels.length).toBeGreaterThan(0);

    // Every label should start with "Team Member 1"
    labels.forEach(label => {
      expect(label).toMatch(/^Team Member 1/);
    });
  });

  it('falls back to "Member 1" when the member name is cleared', () => {
    const { container } = render(<TrainingNeedsAssessment isAr={false} />);

    // Clear the first member's name input
    const nameInput = getMemberNameInput(container, 0);
    fireEvent.change(nameInput, { target: { value: '' } });

    const labels = getScoreSelectLabels(container);
    expect(labels.length).toBeGreaterThan(0);

    // Every label must NOT start with " —" (a leading-space regression)
    labels.forEach(label => {
      expect(label).not.toMatch(/^\s+—/);
    });

    // Every label must start with "Member 1" fallback
    labels.forEach(label => {
      expect(label).toMatch(/^Member 1 —/);
    });
  });

  it('falls back to "Member 1" when the member name is whitespace-only', () => {
    const { container } = render(<TrainingNeedsAssessment isAr={false} />);

    const nameInput = getMemberNameInput(container, 0);
    fireEvent.change(nameInput, { target: { value: '   ' } });

    const labels = getScoreSelectLabels(container);
    expect(labels.length).toBeGreaterThan(0);

    labels.forEach(label => {
      expect(label).not.toMatch(/^\s+—/);
      expect(label).toMatch(/^Member 1 —/);
    });
  });

  it('aria-labels include the domain name after the separator', () => {
    const { container } = render(<TrainingNeedsAssessment isAr={false} />);

    const labels = getScoreSelectLabels(container);

    // At least one label should contain "Strategy & Planning"
    const hasStrategyDomain = labels.some(l => l.includes('Strategy & Planning'));
    expect(hasStrategyDomain).toBe(true);

    // At least one label should contain "Data & Analytics"
    const hasAnalyticsDomain = labels.some(l => l.includes('Data & Analytics'));
    expect(hasAnalyticsDomain).toBe(true);
  });

  it('includes the correct member name when a member was renamed before clearing', () => {
    const { container } = render(<TrainingNeedsAssessment isAr={false} />);

    // Rename to something then clear it
    const nameInput = getMemberNameInput(container, 0);
    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    fireEvent.change(nameInput, { target: { value: '' } });

    const labels = getScoreSelectLabels(container);
    labels.forEach(label => {
      expect(label).toMatch(/^Member 1 —/);
    });
  });

  it('uses updated name in aria-labels after renaming', () => {
    const { container } = render(<TrainingNeedsAssessment isAr={false} />);

    const nameInput = getMemberNameInput(container, 0);
    fireEvent.change(nameInput, { target: { value: 'Alice' } });

    const labels = getScoreSelectLabels(container);
    expect(labels.length).toBeGreaterThan(0);
    labels.forEach(label => {
      expect(label).toMatch(/^Alice —/);
    });
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Arabic mode
══════════════════════════════════════════════════════════════════════════ */
describe('TrainingTools — score select aria-labels (Arabic)', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it('includes the member name in every aria-label when the name is non-empty', () => {
    const { container } = render(<TrainingNeedsAssessment isAr={true} />);

    // Default member name is "Team Member 1" (the component always initialises
    // with this English string; it is a user-editable value, not translated)
    const labels = getScoreSelectLabels(container);
    expect(labels.length).toBeGreaterThan(0);

    labels.forEach(label => {
      expect(label).toMatch(/^Team Member 1/);
    });
  });

  it('falls back to Arabic "عضو 1" when the member name is cleared', () => {
    const { container } = render(<TrainingNeedsAssessment isAr={true} />);

    const nameInput = getMemberNameInput(container, 0);
    fireEvent.change(nameInput, { target: { value: '' } });

    const labels = getScoreSelectLabels(container);
    expect(labels.length).toBeGreaterThan(0);

    // Must NOT start with " —" (leading-space regression)
    labels.forEach(label => {
      expect(label).not.toMatch(/^\s+—/);
    });

    // Must start with Arabic fallback "عضو 1"
    labels.forEach(label => {
      expect(label).toMatch(/^عضو 1 —/);
    });
  });

  it('falls back to Arabic "عضو 1" when the member name is whitespace-only', () => {
    const { container } = render(<TrainingNeedsAssessment isAr={true} />);

    const nameInput = getMemberNameInput(container, 0);
    fireEvent.change(nameInput, { target: { value: '   ' } });

    const labels = getScoreSelectLabels(container);
    expect(labels.length).toBeGreaterThan(0);

    labels.forEach(label => {
      expect(label).not.toMatch(/^\s+—/);
      expect(label).toMatch(/^عضو 1 —/);
    });
  });

  it('aria-labels include the Arabic domain name after the separator', () => {
    const { container } = render(<TrainingNeedsAssessment isAr={true} />);

    const labels = getScoreSelectLabels(container);

    // Should include Arabic labels for the domains
    const hasStrategyAr = labels.some(l => l.includes('الاستراتيجية والتخطيط'));
    expect(hasStrategyAr).toBe(true);

    const hasAnalyticsAr = labels.some(l => l.includes('البيانات والتحليلات'));
    expect(hasAnalyticsAr).toBe(true);
  });

  it('uses Arabic fallback for the second member index when cleared', () => {
    // Add a second member first, then clear its name
    const { container } = render(<TrainingNeedsAssessment isAr={true} />);

    // Click "Add Member" to get a second member
    const addBtn = Array.from(
      container.querySelectorAll<HTMLButtonElement>('button'),
    ).find(b => /إضافة عضو/.test(b.textContent ?? ''));
    expect(addBtn).toBeDefined();
    fireEvent.click(addBtn!);

    // Clear the second member's name
    const secondNameInput = getMemberNameInput(container, 1);
    fireEvent.change(secondNameInput, { target: { value: '' } });

    // Collect only selects for the second member (column index 1)
    const selects = Array.from(
      container.querySelectorAll<HTMLSelectElement>('select[id^="training-score-1-"]'),
    );
    expect(selects.length).toBeGreaterThan(0);

    selects.forEach(sel => {
      const label = sel.getAttribute('aria-label') ?? '';
      expect(label).not.toMatch(/^\s+—/);
      expect(label).toMatch(/^عضو 2 —/);
    });
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Multi-member: independent fallback per member
══════════════════════════════════════════════════════════════════════════ */
describe('TrainingTools — aria-label fallback is per-member (English)', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it('only the cleared member uses the fallback; other members retain their names', () => {
    const { container } = render(<TrainingNeedsAssessment isAr={false} />);

    // Add a second member
    const addBtn = Array.from(
      container.querySelectorAll<HTMLButtonElement>('button'),
    ).find(b => /Add Member/.test(b.textContent ?? ''));
    expect(addBtn).toBeDefined();
    fireEvent.click(addBtn!);

    // Clear only the SECOND member's name
    const secondNameInput = getMemberNameInput(container, 1);
    fireEvent.change(secondNameInput, { target: { value: '' } });

    // First-member selects (column 0) should still use the default name
    const firstSelects = Array.from(
      container.querySelectorAll<HTMLSelectElement>('select[id^="training-score-0-"]'),
    );
    firstSelects.forEach(sel => {
      const label = sel.getAttribute('aria-label') ?? '';
      expect(label).toMatch(/^Team Member 1 —/);
    });

    // Second-member selects (column 1) should use "Member 2" fallback
    const secondSelects = Array.from(
      container.querySelectorAll<HTMLSelectElement>('select[id^="training-score-1-"]'),
    );
    expect(secondSelects.length).toBeGreaterThan(0);
    secondSelects.forEach(sel => {
      const label = sel.getAttribute('aria-label') ?? '';
      expect(label).not.toMatch(/^\s+—/);
      expect(label).toMatch(/^Member 2 —/);
    });
  });
});
