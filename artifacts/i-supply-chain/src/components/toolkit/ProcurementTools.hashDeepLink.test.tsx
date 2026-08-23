/**
 * ProcurementToolsSection — hash-based tab deep-linking (#171 QA fix,
 * actionability dimension of the Decision Record 8.6 walkthrough)
 *
 * The Daily/Weekly Brief links to a saved TCO / Working Capital / Spend
 * Variance analysis with e.g. "/procurement-tools#tco" so the client lands
 * directly on the right tab instead of the unrelated default tab. This
 * covers that the component actually reads window.location.hash on mount
 * and falls back safely for an empty or unrecognized hash.
 */
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ProcurementToolsSection } from './ProcurementTools';

class ResizeObserverStub {
  observe()    {}
  unobserve()  {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverStub;

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

describe('ProcurementToolsSection — hash deep-link', () => {
  it('opens directly on the TCO tab when the URL hash is #tco', () => {
    window.location.hash = '#tco';
    render(<ProcurementToolsSection isAr={false} />);
    const tab = screen.getByRole('tab', { name: /TCO/i });
    expect(tab.getAttribute('aria-selected')).toBe('true');
  });

  it('opens directly on the Working Capital tab when the URL hash is #workingcapital', () => {
    window.location.hash = '#workingcapital';
    render(<ProcurementToolsSection isAr={false} />);
    const tab = screen.getByRole('tab', { name: /Working Capital/i });
    expect(tab.getAttribute('aria-selected')).toBe('true');
  });

  it('opens directly on the Spend Variance tab when the URL hash is #spendvariance', () => {
    window.location.hash = '#spendvariance';
    render(<ProcurementToolsSection isAr={false} />);
    const tab = screen.getByRole('tab', { name: /Spend Variance/i });
    expect(tab.getAttribute('aria-selected')).toBe('true');
  });

  it('falls back to the default Spend Analysis tab for an unrecognized hash, not a blank/broken state', () => {
    window.location.hash = '#not-a-real-tab';
    render(<ProcurementToolsSection isAr={false} />);
    const tab = screen.getByRole('tab', { name: /Spend Analysis/i });
    expect(tab.getAttribute('aria-selected')).toBe('true');
  });

  it('falls back to the default Spend Analysis tab when there is no hash at all', () => {
    render(<ProcurementToolsSection isAr={false} />);
    const tab = screen.getByRole('tab', { name: /Spend Analysis/i });
    expect(tab.getAttribute('aria-selected')).toBe('true');
  });
});
