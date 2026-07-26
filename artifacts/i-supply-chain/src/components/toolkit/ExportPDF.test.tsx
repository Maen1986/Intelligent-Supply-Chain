/**
 * Task 118 — Confirm the Export PDF button appears and prints cleanly
 * for each toolkit tool (Supplier Scorecard, KRI Dashboard, Contract Health Checker).
 *
 * Covers:
 *  - "Export PDF" / "تصدير PDF" button renders in EN and AR for all three tools
 *  - Clicking the button calls window.print() and sets data-print on document.body
 *  - data-print is the correct zone identifier for each tool
 *  - Print-only header (title + export date) is present in the DOM for each tool
 *  - .no-print class applied to the button (CSS hides it in print output)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SupplierScorecardTool } from './SupplierScorecard';
import { RiskToolsSection } from './RiskTools';
import { ContractHealthChecker } from './CLMTools';

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
// KRI Dashboard (inside RiskToolsSection)
// ─────────────────────────────────────────────────────────────────────────────
describe('KRIDashboard — Export PDF', () => {
  it('renders Export PDF button in English', () => {
    render(<RiskToolsSection isAr={false} />);
    expect(screen.getByText('Export PDF')).toBeTruthy();
  });

  it('renders تصدير PDF button in Arabic', () => {
    render(<RiskToolsSection isAr={true} />);
    expect(screen.getByText('تصدير PDF')).toBeTruthy();
  });

  it('button has no-print class', () => {
    render(<RiskToolsSection isAr={false} />);
    const btn = screen.getByText('Export PDF').closest('button');
    expect(btn?.className).toContain('no-print');
  });

  it('clicking Export PDF calls window.print() and sets data-print="kri"', () => {
    render(<RiskToolsSection isAr={false} />);
    fireEvent.click(screen.getByText('Export PDF'));
    expect(document.body.getAttribute('data-print')).toBe('kri');
    expect(printCalled).toBe(true);
  });

  it('print-only header contains KRI tool title in English', () => {
    const { container } = render(<RiskToolsSection isAr={false} />);
    const printHeaders = container.querySelectorAll('.hidden');
    const headerTexts = Array.from(printHeaders).map(el => el.textContent ?? '');
    expect(headerTexts.some(t => t.includes('Key Risk Indicator'))).toBe(true);
  });

  it('print-only header contains KRI tool title in Arabic', () => {
    const { container } = render(<RiskToolsSection isAr={true} />);
    const printHeaders = container.querySelectorAll('.hidden');
    const headerTexts = Array.from(printHeaders).map(el => el.textContent ?? '');
    expect(headerTexts.some(t => t.includes('مؤشرات المخاطر الرئيسية'))).toBe(true);
  });

  it('print-only header contains export date in English', () => {
    const { container } = render(<RiskToolsSection isAr={false} />);
    const printHeaders = container.querySelectorAll('.hidden');
    const headerTexts = Array.from(printHeaders).map(el => el.textContent ?? '');
    expect(headerTexts.some(t => t.includes('Exported:'))).toBe(true);
  });

  it('print-only header contains export date label in Arabic', () => {
    const { container } = render(<RiskToolsSection isAr={true} />);
    const printHeaders = container.querySelectorAll('.hidden');
    const headerTexts = Array.from(printHeaders).map(el => el.textContent ?? '');
    expect(headerTexts.some(t => t.includes('تاريخ التصدير'))).toBe(true);
  });

  it('KRI dashboard root has print-zone-kri class', () => {
    const { container } = render(<RiskToolsSection isAr={false} />);
    expect(container.querySelector('.print-zone-kri')).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract Health Checker
// ─────────────────────────────────────────────────────────────────────────────
describe('ContractHealthChecker — Export PDF', () => {
  it('renders Export PDF button in English', () => {
    render(<ContractHealthChecker isAr={false} />);
    expect(screen.getByText('Export PDF')).toBeTruthy();
  });

  it('renders تصدير PDF button in Arabic', () => {
    render(<ContractHealthChecker isAr={true} />);
    expect(screen.getByText('تصدير PDF')).toBeTruthy();
  });

  it('button has no-print class', () => {
    render(<ContractHealthChecker isAr={false} />);
    const btn = screen.getByText('Export PDF').closest('button');
    expect(btn?.className).toContain('no-print');
  });

  it('clicking Export PDF calls window.print() and sets data-print="clm"', () => {
    render(<ContractHealthChecker isAr={false} />);
    fireEvent.click(screen.getByText('Export PDF'));
    expect(document.body.getAttribute('data-print')).toBe('clm');
    expect(printCalled).toBe(true);
  });

  it('print-only header contains tool title in English', () => {
    const { container } = render(<ContractHealthChecker isAr={false} />);
    const printHeaders = container.querySelectorAll('.hidden');
    const headerTexts = Array.from(printHeaders).map(el => el.textContent ?? '');
    expect(headerTexts.some(t => t.includes('Contract Health Checker'))).toBe(true);
  });

  it('print-only header contains tool title in Arabic', () => {
    const { container } = render(<ContractHealthChecker isAr={true} />);
    const printHeaders = container.querySelectorAll('.hidden');
    const headerTexts = Array.from(printHeaders).map(el => el.textContent ?? '');
    expect(headerTexts.some(t => t.includes('فاحص صحة العقود'))).toBe(true);
  });

  it('print-only header contains export date in English', () => {
    const { container } = render(<ContractHealthChecker isAr={false} />);
    const printHeaders = container.querySelectorAll('.hidden');
    const headerTexts = Array.from(printHeaders).map(el => el.textContent ?? '');
    expect(headerTexts.some(t => t.includes('Exported:'))).toBe(true);
  });

  it('print-only header contains export date label in Arabic', () => {
    const { container } = render(<ContractHealthChecker isAr={true} />);
    const printHeaders = container.querySelectorAll('.hidden');
    const headerTexts = Array.from(printHeaders).map(el => el.textContent ?? '');
    expect(headerTexts.some(t => t.includes('تاريخ التصدير'))).toBe(true);
  });

  it('root element has print-zone-clm class', () => {
    const { container } = render(<ContractHealthChecker isAr={false} />);
    expect(container.querySelector('.print-zone-clm')).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CSS print zone isolation (structural check)
// ─────────────────────────────────────────────────────────────────────────────
describe('Print zone isolation — data-print attribute', () => {
  it('scorecard zone is distinct from kri and clm zones', () => {
    render(<SupplierScorecardTool isAr={false} />);
    fireEvent.click(screen.getByText('Export PDF'));
    expect(document.body.getAttribute('data-print')).toBe('scorecard');
    expect(document.body.getAttribute('data-print')).not.toBe('kri');
    expect(document.body.getAttribute('data-print')).not.toBe('clm');
  });

  it('kri zone is distinct from scorecard and clm zones', () => {
    render(<RiskToolsSection isAr={false} />);
    fireEvent.click(screen.getByText('Export PDF'));
    expect(document.body.getAttribute('data-print')).toBe('kri');
    expect(document.body.getAttribute('data-print')).not.toBe('scorecard');
    expect(document.body.getAttribute('data-print')).not.toBe('clm');
  });

  it('clm zone is distinct from scorecard and kri zones', () => {
    render(<ContractHealthChecker isAr={false} />);
    fireEvent.click(screen.getByText('Export PDF'));
    expect(document.body.getAttribute('data-print')).toBe('clm');
    expect(document.body.getAttribute('data-print')).not.toBe('scorecard');
    expect(document.body.getAttribute('data-print')).not.toBe('kri');
  });
});
