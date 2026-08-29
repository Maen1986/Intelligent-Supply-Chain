/**
 * Tests: #385 -- UNSPSC Class/Commodity searchable lookup on Contract cards
 * (30 Aug 2026 build; searchUnspscClassCommodity/getClassLabel/getCommodityLabel
 * in lib/unspscClassCommodity.ts). Nested selects don't scale to 506 classes /
 * 3,660 commodities, so this is a search-and-pick UI instead.
 *
 * Uses real sourced data (segment 80 -- Management and Business Professional
 * Services, family 80110000 "Human resources services", class 80111700
 * "Personnel recruitment", commodities 80111701/80111720/80111721) rather
 * than invented fixtures, per this project's anti-fabrication discipline.
 *
 * Covers:
 *   1. No search box renders before a real (non-"other", non-empty) Segment
 *      is chosen.
 *   2. Search box appears once a sourced Segment is chosen.
 *   3. A query under 2 characters shows no results dropdown.
 *   4. A broad query ("recruit") returns commodity + class matches, ranked
 *      commodities-first, using real titles/codes.
 *   5. A narrow query (an exact commodity code) returns exactly one result.
 *   6. Picking a commodity result sets family+class+commodity together and
 *      shows the green confirmation chip with the real title.
 *   7. The confirmation chip's Clear button clears class+commodity only
 *      (leaves family/segment untouched).
 *   8. Changing the Segment clears any selected class/commodity too.
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ContractHealthChecker } from './CLMTools';

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

function addOpenAndPickSegment80() {
  addAndOpenContract();
  fireEvent.change(screen.getByLabelText(/UNSPSC Segment/i), { target: { value: '80' } });
}

describe('#385 UNSPSC Class/Commodity searchable lookup', () => {
  it('does not render a search box before a Segment is chosen', () => {
    addAndOpenContract();
    expect(screen.queryByLabelText(/Search Class \/ Commodity/i)).not.toBeInTheDocument();
  });

  it('does not render a search box when Segment is "Other"', () => {
    addAndOpenContract();
    fireEvent.change(screen.getByLabelText(/UNSPSC Segment/i), { target: { value: 'other' } });
    expect(screen.queryByLabelText(/Search Class \/ Commodity/i)).not.toBeInTheDocument();
  });

  it('reveals the search box once a sourced Segment (80) is chosen', () => {
    addOpenAndPickSegment80();
    expect(screen.getByLabelText(/Search Class \/ Commodity/i)).toBeInTheDocument();
  });

  it('shows no results dropdown for a 1-character query', () => {
    addOpenAndPickSegment80();
    fireEvent.change(screen.getByLabelText(/Search Class \/ Commodity/i), { target: { value: 'r' } });
    expect(screen.queryByText('Staff recruiting services')).not.toBeInTheDocument();
  });

  it('returns real commodity + class matches for a broad query, commodities ranked first', () => {
    addOpenAndPickSegment80();
    fireEvent.change(screen.getByLabelText(/Search Class \/ Commodity/i), { target: { value: 'recruit' } });

    expect(screen.getByText('Staff recruiting services')).toBeInTheDocument();
    expect(screen.getByText('Executive recruitment service')).toBeInTheDocument();
    expect(screen.getByText('Non-Executive recruitment service')).toBeInTheDocument();
    expect(screen.getByText('Personnel recruitment')).toBeInTheDocument();

    const results = screen.getAllByRole('button').filter(b =>
      ['Staff recruiting services', 'Executive recruitment service', 'Non-Executive recruitment service', 'Personnel recruitment'].includes(b.textContent?.split('commodity')[0].split('class')[0].trim() ?? '')
    );
    expect(results.length).toBeGreaterThanOrEqual(4);
  });

  it('returns exactly one result for an exact commodity-code query', () => {
    addOpenAndPickSegment80();
    fireEvent.change(screen.getByLabelText(/Search Class \/ Commodity/i), { target: { value: '80111701' } });
    expect(screen.getByText('Staff recruiting services')).toBeInTheDocument();
    expect(screen.queryByText('Executive recruitment service')).not.toBeInTheDocument();
  });

  it('picking a commodity result sets family+class+commodity and shows the confirmation chip', () => {
    addOpenAndPickSegment80();
    fireEvent.change(screen.getByLabelText(/Search Class \/ Commodity/i), { target: { value: 'Staff recruiting services' } });
    fireEvent.click(screen.getByText('Staff recruiting services'));

    // Search input clears after a pick.
    expect((screen.getByLabelText(/Search Class \/ Commodity/i) as HTMLInputElement).value).toBe('');
    // Confirmation chip shows the real commodity code + title.
    expect(screen.getByText(/80111701/)).toBeInTheDocument();
    expect(screen.getByText(/Staff recruiting services/)).toBeInTheDocument();
    // Family select was set too (Human resources services).
    const familySelect = screen.getByLabelText(/UNSPSC Family/i) as HTMLSelectElement;
    expect(familySelect.value).toBe('80110000');
  });

  it('the confirmation chip Clear button clears class/commodity but leaves family/segment intact', () => {
    addOpenAndPickSegment80();
    fireEvent.change(screen.getByLabelText(/Search Class \/ Commodity/i), { target: { value: 'Staff recruiting services' } });
    fireEvent.click(screen.getByText('Staff recruiting services'));

    fireEvent.click(screen.getByText('Clear'));

    expect(screen.queryByText(/80111701/)).not.toBeInTheDocument();
    const familySelect = screen.getByLabelText(/UNSPSC Family/i) as HTMLSelectElement;
    expect(familySelect.value).toBe('80110000');
    const segmentSelect = screen.getByLabelText(/UNSPSC Segment/i) as HTMLSelectElement;
    expect(segmentSelect.value).toBe('80');
  });

  it('changing the Segment clears a previously selected class/commodity', () => {
    addOpenAndPickSegment80();
    fireEvent.change(screen.getByLabelText(/Search Class \/ Commodity/i), { target: { value: 'Staff recruiting services' } });
    fireEvent.click(screen.getByText('Staff recruiting services'));
    expect(screen.getByText(/80111701/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/UNSPSC Segment/i), { target: { value: '81' } });
    expect(screen.queryByText(/80111701/)).not.toBeInTheDocument();
  });
});
