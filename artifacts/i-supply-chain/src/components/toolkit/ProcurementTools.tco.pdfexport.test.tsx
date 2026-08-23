/**
 * ProcurementToolsSection — TCO Engine PDF export (#167, "TCO reporting:
 * PDF/print export of a TCO analysis", 2026-08-23).
 *
 * Reuses the platform's established print-zone pattern (data-print attribute
 * + window.print(), same as SupplierScorecard/RiskTools/DecisionLab). Covers
 * both the single-analysis report and the Portfolio comparison report.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ProcurementToolsSection } from './ProcurementTools';

class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
(globalThis as any).ResizeObserver = ResizeObserverStub;

beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); document.body.removeAttribute('data-print'); });

function goToTco() {
  fireEvent.click(screen.getByRole('tab', { name: /TCO Engine/i }));
}

describe('ProcurementToolsSection — TCO single-analysis PDF export', () => {
  it('sets data-print="tco" and calls window.print() when Export PDF is clicked', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<ProcurementToolsSection isAr={false} />);
    goToTco();

    fireEvent.click(screen.getByRole('button', { name: /Export PDF/i }));

    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(document.body.getAttribute('data-print')).toBe('tco');
  });

  it('renders a print-only header with the analysis name and item', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    fireEvent.change(screen.getByLabelText(/^Item name$/i), { target: { value: 'Bearing 6205-ZZ' } });

    expect(screen.getByText(/Total Cost of Ownership Report/i)).toBeInTheDocument();
    expect(screen.getByText(/New analysis -- Bearing 6205-ZZ/i)).toBeInTheDocument();
  });
});

describe('ProcurementToolsSection — TCO Portfolio PDF export', () => {
  it('sets data-print="tco-portfolio" and calls window.print() when Export PDF is clicked', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    fireEvent.click(screen.getByRole('button', { name: /Portfolio comparison/i }));

    fireEvent.click(screen.getByRole('button', { name: /Export PDF/i }));

    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(document.body.getAttribute('data-print')).toBe('tco-portfolio');
  });

  it('renders a print-only header for the portfolio report', () => {
    render(<ProcurementToolsSection isAr={false} />);
    goToTco();
    fireEvent.click(screen.getByRole('button', { name: /Portfolio comparison/i }));
    expect(screen.getByText(/TCO Portfolio Comparison Report/i)).toBeInTheDocument();
  });
});
