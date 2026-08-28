/**
 * Tests: UNSPSC Family-level select on Spend Analysis rows (registry #385
 * lowest-level import, 28 Aug 2026 -- see lib/unspscClassCommodity.ts).
 *
 * Mirrors CLMTools.unspscFamily.test.tsx but for the Spend Analysis table's
 * per-row UNSPSC Segment/Family fields (SpendRow, updateRow), which use a
 * different state-update helper and aria-label (not htmlFor) association.
 *
 * Covers:
 *   1. No Family select renders until a real (non-"other", non-empty)
 *      Segment is chosen for a row.
 *   2. Choosing a Segment with sourced Family data (80) reveals the Family
 *      select, populated with that segment's real families.
 *   3. Choosing "Other" as the Segment does not reveal a Family select.
 *   4. Picking a Family persists its value.
 *   5. Changing the Segment after a Family was picked clears the stale
 *      Family value.
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ProcurementToolsSection } from './ProcurementTools';
import { getFamiliesForSegment } from '@/lib/unspscClassCommodity';

class ResizeObserverStub {
  observe()    {}
  unobserve()  {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverStub;

beforeEach(() => {
  localStorage.clear();
  cleanup();
});

function segmentSelect() {
  return screen.getByLabelText(/Supplier: UNSPSC segment/i) as HTMLSelectElement;
}
function familySelect() {
  return screen.getByLabelText(/Supplier: UNSPSC family/i) as HTMLSelectElement;
}

describe('UNSPSC Family select on Spend Analysis rows', () => {
  it('does not render a Family select before a Segment is chosen', () => {
    render(<ProcurementToolsSection isAr={false} />);
    expect(screen.queryByLabelText(/UNSPSC family/i)).not.toBeInTheDocument();
  });

  it('reveals a populated Family select once a sourced Segment (80) is chosen', () => {
    render(<ProcurementToolsSection isAr={false} />);
    fireEvent.change(segmentSelect(), { target: { value: '80' } });
    const fam = familySelect();
    expect(fam).toBeInTheDocument();
    const families = getFamiliesForSegment('80');
    // "not specified" placeholder + one <option> per real family
    expect(fam.querySelectorAll('option').length).toBe(families.length + 1);
    expect(screen.getByText(`${families[0].code} -- ${families[0].title}`)).toBeInTheDocument();
  });

  it('does not reveal a Family select when Segment is "Other"', () => {
    render(<ProcurementToolsSection isAr={false} />);
    fireEvent.change(segmentSelect(), { target: { value: 'other' } });
    expect(screen.queryByLabelText(/UNSPSC family/i)).not.toBeInTheDocument();
  });

  it('persists the chosen Family value', () => {
    render(<ProcurementToolsSection isAr={false} />);
    fireEvent.change(segmentSelect(), { target: { value: '80' } });
    const families = getFamiliesForSegment('80');
    const fam = familySelect();
    fireEvent.change(fam, { target: { value: families[0].code } });
    expect(fam.value).toBe(families[0].code);
  });

  it('clears a stale Family value when the Segment is changed', () => {
    render(<ProcurementToolsSection isAr={false} />);
    fireEvent.change(segmentSelect(), { target: { value: '80' } });
    const families80 = getFamiliesForSegment('80');
    fireEvent.change(familySelect(), { target: { value: families80[0].code } });
    expect(familySelect().value).toBe(families80[0].code);

    fireEvent.change(segmentSelect(), { target: { value: '81' } });
    expect(familySelect().value).toBe('');
  });
});
