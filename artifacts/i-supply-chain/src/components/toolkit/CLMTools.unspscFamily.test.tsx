/**
 * Tests: UNSPSC Family-level select on Contract cards (registry #385
 * lowest-level import, 28 Aug 2026 -- see lib/unspscClassCommodity.ts).
 *
 * Covers:
 *   1. No Family select renders until a real (non-"other", non-empty)
 *      Segment is chosen.
 *   2. Choosing a Segment with sourced Family data (80 -- Management and
 *      Business Professional Services) reveals the Family select, populated
 *      with that segment's real families.
 *   3. Choosing "Other" as the Segment does not reveal a Family select.
 *   4. Picking a Family persists its value.
 *   5. Changing the Segment after a Family was picked clears the stale
 *      Family value (prevents an orphaned family/segment pairing).
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ContractHealthChecker } from './CLMTools';
import { getFamiliesForSegment } from '@/lib/unspscClassCommodity';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, loading: false }),
}));

vi.mock('@/hooks/useAIPlan', () => ({
  useAIPlan: () => ({
    loading: false, result: null, error: null, rateLimited: false,
    generate: vi.fn(), reset: vi.fn(), savedPlan: null,
    viewSaved: vi.fn(), deleteSaved: vi.fn(),
  }),
}));

vi.mock('@/components/AIPlanPanel', () => ({ AIPlanPanel: () => null }));

beforeEach(() => { localStorage.clear(); cleanup(); });

/** Adds a contract (Contract Inventory tab is the default) and expands its card. */
function addAndOpenContract() {
  render(<ContractHealthChecker isAr={false} />);
  fireEvent.click(screen.getByRole('button', { name: /Add Contract/i }));
  fireEvent.click(screen.getByText('(Contract name)'));
}

describe('UNSPSC Family select on Contract cards', () => {
  it('does not render a Family select before a Segment is chosen', () => {
    addAndOpenContract();
    expect(screen.queryByLabelText(/UNSPSC Family/i)).not.toBeInTheDocument();
  });

  it('reveals a populated Family select once a sourced Segment (80) is chosen', () => {
    addAndOpenContract();
    fireEvent.change(screen.getByLabelText(/UNSPSC Segment/i), { target: { value: '80' } });
    const familySelect = screen.getByLabelText(/UNSPSC Family/i) as HTMLSelectElement;
    expect(familySelect).toBeInTheDocument();
    const families = getFamiliesForSegment('80');
    // "Not specified" placeholder + one <option> per real family
    expect(familySelect.querySelectorAll('option').length).toBe(families.length + 1);
    expect(screen.getByText(`${families[0].code} -- ${families[0].title}`)).toBeInTheDocument();
  });

  it('does not reveal a Family select when Segment is "Other"', () => {
    addAndOpenContract();
    fireEvent.change(screen.getByLabelText(/UNSPSC Segment/i), { target: { value: 'other' } });
    expect(screen.queryByLabelText(/UNSPSC Family/i)).not.toBeInTheDocument();
  });

  it('persists the chosen Family value', () => {
    addAndOpenContract();
    fireEvent.change(screen.getByLabelText(/UNSPSC Segment/i), { target: { value: '80' } });
    const families = getFamiliesForSegment('80');
    const familySelect = screen.getByLabelText(/UNSPSC Family/i) as HTMLSelectElement;
    fireEvent.change(familySelect, { target: { value: families[0].code } });
    expect(familySelect.value).toBe(families[0].code);
  });

  it('clears a stale Family value when the Segment is changed', () => {
    addAndOpenContract();
    fireEvent.change(screen.getByLabelText(/UNSPSC Segment/i), { target: { value: '80' } });
    const families80 = getFamiliesForSegment('80');
    let familySelect = screen.getByLabelText(/UNSPSC Family/i) as HTMLSelectElement;
    fireEvent.change(familySelect, { target: { value: families80[0].code } });
    expect(familySelect.value).toBe(families80[0].code);

    // Switch to another sourced segment (81) -- the stale family value must not carry over.
    fireEvent.change(screen.getByLabelText(/UNSPSC Segment/i), { target: { value: '81' } });
    familySelect = screen.getByLabelText(/UNSPSC Family/i) as HTMLSelectElement;
    expect(familySelect.value).toBe('');
  });
});
