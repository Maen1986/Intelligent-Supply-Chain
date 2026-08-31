/**
 * SolutionDetail -- tool discoverability fix (31 Aug 2026, deep-scan follow-up).
 *
 * The deep-scan investigation found that ContractHealthChecker and
 * ProcurementToolsSection were NOT actually unreachable (an earlier draft
 * finding was wrong and was corrected): both already render live inside the
 * "Challenges" tab (index 4) of SolutionDetail, they were just undiscoverable
 * -- a visitor landing on the default "Overview" tab had no cue that an
 * interactive tool existed four tabs away. This test covers the fix: a hero
 * "Try it" CTA that jumps straight to the tool, and a badge dot on the
 * Challenges tab when a tool is present.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { Router, Route } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { SolutionDetail } from './SolutionDetail';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => ({ user: null, loading: false }) }));

const mockLang = { value: 'en' as 'en' | 'ar' };
vi.mock('@/lib/LanguageContext', () => ({ useLanguage: () => ({ lang: mockLang.value }) }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  mockLang.value = 'en';
});

function renderAt(path: string) {
  const { hook } = memoryLocation({ path, static: true });
  return render(
    <Router hook={hook}>
      <Route path="/solutions/:slug" component={SolutionDetail} />
    </Router>
  );
}

describe('SolutionDetail tool discoverability', () => {
  it('shows a "Try it" CTA in the hero for a slug with an embedded tool (Contract Lifecycle Management)', () => {
    renderAt('/solutions/contract-lifecycle-management');
    expect(screen.getByTestId('button-jump-to-tool')).toBeTruthy();
    expect(screen.getByText('Try it: Contract Health Checker')).toBeTruthy();
  });

  it('clicking the CTA jumps to the Challenges tab and renders the real Contract Health Checker tool', () => {
    renderAt('/solutions/contract-lifecycle-management');
    // Not visible on the default Overview tab.
    expect(screen.queryByText('Export PDF')).toBeNull();
    fireEvent.click(screen.getByTestId('button-jump-to-tool'));
    // The real toolkit component is now mounted and rendering its own UI.
    expect(screen.getByText('Export PDF')).toBeTruthy();
  });

  it('badges the Challenges tab with an "Interactive tool here" indicator when a tool is present', () => {
    renderAt('/solutions/contract-lifecycle-management');
    expect(screen.getByTitle('Interactive tool here')).toBeTruthy();
  });

  it('shows the equivalent CTA for Procurement Excellence, pointing at its own tool', () => {
    renderAt('/solutions/procurement-excellence');
    expect(screen.getByText('Try it: TCO & Spend Analysis Tool')).toBeTruthy();
  });
});
