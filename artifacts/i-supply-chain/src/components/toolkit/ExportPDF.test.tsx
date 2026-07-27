/**
 * Task 118 — Confirm the Export PDF button appears and prints cleanly
 * for the Supplier Scorecard toolkit tool.
 *
 * NOTE: Export PDF was removed from KRIDashboard (RiskToolsSection) and
 * ContractHealthChecker (CLMTools) in a subsequent refactor. Only
 * SupplierScorecardTool retains Export PDF functionality.
 *
 * Covers:
 *  - "Export PDF" / "تصدير PDF" button renders in EN and AR for Supplier Scorecard
 *  - Clicking the button calls window.print() and sets data-print on document.body
 *  - data-print is the correct zone identifier ("scorecard")
 *  - Print-only header (title + export date) is present in the DOM
 *  - .no-print class applied to the button (CSS hides it in print output)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SupplierScorecardTool } from './SupplierScorecard';

/* ── Recharts needs ResizeObserver ── */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverStub;

/* ── localStorage stub ── */
const localStorageStub = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageStub });

/* ── window.print stub ── */
let printCalled = false;
Object.defineProperty(globalThis, 'window', {
  value: {
    ...globalThis.window,
    print: () => { printCalled = true; },
    addEventListener: globalThis.window?.addEventListener ?? (() => {}),
    removeEventListener: globalThis.window?.removeEventListener ?? (() => {}),
  },
  writable: true,
});

beforeEach(() => {
  printCalled = false;
  document.body.removeAttribute('data-print');
  localStorageStub.clear();
});

afterEach(() => {
  cleanup();
  document.body.removeAttribute('data-print');
});

// ─────────────────────────────────────────────────────────────────────────────
// Supplier Scorecard
// ─────────────────────────────────────────────────────────────────────────────
describe('SupplierScorecardTool — Export PDF', () => {
  it('renders Export PDF button in English', () => {
    render(<SupplierScorecardTool isAr={false} />);
    expect(screen.getByText('Export PDF')).toBeTruthy();
  });

  it('renders تصدير PDF button in Arabic', () => {
    render(<SupplierScorecardTool isAr={true} />);
    expect(screen.getByText('تصدير PDF')).toBeTruthy();
  });

  it('button has no-print class so it is hidden during printing', () => {
    render(<SupplierScorecardTool isAr={false} />);
    const btn = screen.getByText('Export PDF').closest('button');
    expect(btn?.className).toContain('no-print');
  });

  it('clicking Export PDF calls window.print() and sets data-print="scorecard"', () => {
    render(<SupplierScorecardTool isAr={false} />);
    fireEvent.click(screen.getByText('Export PDF'));
    expect(document.body.getAttribute('data-print')).toBe('scorecard');
    expect(printCalled).toBe(true);
  });

  it('print-only header contains tool title in English', () => {
    const { container } = render(<SupplierScorecardTool isAr={false} />);
    // The print-only header is always in the DOM (CSS hides it on screen)
    const printHeaders = container.querySelectorAll('.hidden');
    const headerTexts = Array.from(printHeaders).map(el => el.textContent ?? '');
    expect(headerTexts.some(t => t.includes('Supplier Scorecard'))).toBe(true);
  });

  it('print-only header contains tool title in Arabic', () => {
    const { container } = render(<SupplierScorecardTool isAr={true} />);
    const printHeaders = container.querySelectorAll('.hidden');
    const headerTexts = Array.from(printHeaders).map(el => el.textContent ?? '');
    expect(headerTexts.some(t => t.includes('بطاقة تقييم المورّد'))).toBe(true);
  });

  it('print-only header contains export date in English', () => {
    const { container } = render(<SupplierScorecardTool isAr={false} />);
    const printHeaders = container.querySelectorAll('.hidden');
    const headerTexts = Array.from(printHeaders).map(el => el.textContent ?? '');
    expect(headerTexts.some(t => t.includes('Exported:'))).toBe(true);
  });

  it('print-only header contains export date label in Arabic', () => {
    const { container } = render(<SupplierScorecardTool isAr={true} />);
    const printHeaders = container.querySelectorAll('.hidden');
    const headerTexts = Array.from(printHeaders).map(el => el.textContent ?? '');
    expect(headerTexts.some(t => t.includes('تاريخ التصدير'))).toBe(true);
  });

  it('root element has print-zone-scorecard class', () => {
    const { container } = render(<SupplierScorecardTool isAr={false} />);
    expect(container.querySelector('.print-zone-scorecard')).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Print zone isolation (scorecard only — KRI and CLM no longer have Export PDF)
// ─────────────────────────────────────────────────────────────────────────────
describe('Print zone isolation — data-print attribute', () => {
  it('scorecard zone is set to "scorecard" on click', () => {
    render(<SupplierScorecardTool isAr={false} />);
    fireEvent.click(screen.getByText('Export PDF'));
    expect(document.body.getAttribute('data-print')).toBe('scorecard');
    expect(document.body.getAttribute('data-print')).not.toBe('kri');
    expect(document.body.getAttribute('data-print')).not.toBe('clm');
  });
});
