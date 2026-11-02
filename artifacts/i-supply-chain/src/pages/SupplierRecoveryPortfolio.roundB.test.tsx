/**
 * Round B (Nov 2026) page-level regression tests for SI Module 07.
 * Covers (not individually proven to fail on the old page):
 *  - the demo-data leak (My Portfolio showed demo spend/cost numbers),
 *  - no import path, no audience views, no primary+alternative decision view.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => ({ isAuthenticated: false, user: null, loading: false }) }));
vi.mock('recharts', async () => {
  const R = await vi.importActual<typeof import('recharts')>('recharts');
  return { ...R, ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div style={{ width: 400, height: 300 }}>{children}</div> };
});

import { SupplierRecoveryPortfolio } from './SupplierRecoveryPortfolio';
import { LanguageProvider } from '@/lib/LanguageContext';

const KEY = 'isc-supplier-recovery-portfolio-v1';
const renderPage = () => render(<LanguageProvider><SupplierRecoveryPortfolio /></LanguageProvider>);

const mine = (over: Record<string, unknown> = {}) => ({
  supplierId: 'u1', name: 'My Own Supplier', category: 'Widgets', quadrant: 'leverage', quadrantPriorQuarter: null,
  scoreHistory12mo: [95, 92, 89, 86, 83, 80, 77, 74], cars: [], ...over,
});

beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); localStorage.clear(); });

async function openMine() {
  fireEvent.click(screen.getByRole('button', { name: /My Portfolio|محفظتي/ }));
}

describe('demo-data leak is closed', () => {
  it('My Portfolio with zero suppliers shows NO demo supplier, no demo SAR figures', async () => {
    renderPage();
    await openMine();
    expect(screen.queryByText('Al-Rawabi Manufacturing')).toBeNull();
    expect(screen.queryByText('Zamil Steel Co.')).toBeNull();
    expect(screen.queryByText(/SAR \d/)).toBeNull();
    expect(screen.getByText(/No suppliers yet/)).toBeTruthy();
  });

  it('a user supplier without spend shows "insufficient data", never a mock number', async () => {
    localStorage.setItem(KEY, JSON.stringify([mine()]));
    renderPage();
    await openMine();
    fireEvent.click(screen.getByRole('button', { name: /Detailed analysis/ }));
    // exposure figure must be unknown, not derived from the demo category table
    expect(screen.queryByText(/SAR \d/)).toBeNull();
    expect(screen.queryByText(/SIMULATED \/ MOCK DATA/)).toBeNull();
    expect(screen.getAllByText(/insufficient data|no annual spend entered/i).length).toBeGreaterThan(0);
  });

  it('a user supplier WITH spend shows that exact figure and says it is the user\'s own', async () => {
    localStorage.setItem(KEY, JSON.stringify([mine({ annualSpendSAR: 2500000 })]));
    renderPage();
    await openMine();
    fireEvent.click(screen.getByRole('button', { name: /Detailed analysis/ }));
    expect(screen.getAllByText(/SAR 2\.5M/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/annual spend you entered/).length).toBeGreaterThan(0);
  });

  it('demo mode still works and says plainly it is demo data', () => {
    renderPage();
    expect(screen.getByText(/Demo data: these figures are the Al-Rawabi worked example/)).toBeTruthy();
  });
});

describe('B2: category-manager view gives a primary AND an alternative with a trade-off', () => {
  it('shows recommended, strong alternative and trade-off for an escalated supplier', async () => {
    localStorage.setItem(KEY, JSON.stringify([mine()]));
    renderPage();
    await openMine();
    expect(screen.getAllByText('Recommended').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Strong alternative').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Trade-off:/).length).toBeGreaterThan(0);
    expect(screen.getByText(/This week's actions/)).toBeTruthy();
  });

  it('owner field is a real, labelled input that keeps focus while typing', async () => {
    localStorage.setItem(KEY, JSON.stringify([mine()]));
    renderPage();
    await openMine();
    const input = screen.getAllByLabelText(/Owner: My Own Supplier/)[0] as HTMLInputElement;
    input.focus();
    fireEvent.change(input, { target: { value: 'Sara' } });
    const again = screen.getAllByLabelText(/Owner: My Own Supplier/)[0] as HTMLInputElement;
    expect(again.value).toBe('Sara');
    expect(document.activeElement).toBe(again);
  });
});

describe('B3: summary and client pack', () => {
  it('summary view shows data confidence beside the headline', async () => {
    localStorage.setItem(KEY, JSON.stringify([mine({ cars: [{ id: 'C1', supplierId: 'u1', category: 'delivery', scorecardDimension: 'delivery', rootCause: 'x', status: 'open', createdAt: '2026-10-01', closedAt: null }] })]));
    renderPage();
    await openMine();
    fireEvent.click(screen.getByRole('button', { name: /Procurement head/ }));
    expect(screen.getByText(/Portfolio summary/, { selector: 'h2' })).toBeTruthy();
    expect(screen.getByText('Data confidence')).toBeTruthy();
    expect(screen.getByText(/\(CARs\) with a cost/)).toBeTruthy();
    expect(screen.getByText(/No ESG score is produced/)).toBeTruthy();
  });

  it('client pack names its own data source and has print + CSV buttons', async () => {
    localStorage.setItem(KEY, JSON.stringify([mine()]));
    renderPage();
    await openMine();
    fireEvent.click(screen.getByRole('button', { name: /Consultant/ }));
    expect(screen.getByText(/User data \(entered\/imported\)/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Print \/ save as PDF/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Download CSV/ })).toBeTruthy();
  });
});

describe('B1: CSV import', () => {
  it('uploads a scores file, shows the report, applies only after the user presses Apply', async () => {
    renderPage();
    await openMine();
    const csv = 'supplier,category,quadrant,period,score\nImported Co,Packaging,leverage,2026-01,90\nImported Co,Packaging,leverage,2026-02,85\nImported Co,Packaging,leverage,2026-03,x\n';
    const file = new File([csv], 'scores.csv', { type: 'text/csv' });
    const input = screen.getByLabelText('Scores file') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByText(/rows accepted/)).toBeTruthy());
    expect(screen.getByText(/Score "x" is not a number/)).toBeTruthy();
    // not applied yet
    expect(screen.queryByText('Imported Co')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Apply import/ }));
    await waitFor(() => expect(screen.getByText(/1 supplier\(s\) added/)).toBeTruthy());
    expect(JSON.parse(localStorage.getItem(KEY)!)[0].name).toBe('Imported Co');
    expect(JSON.parse(localStorage.getItem(KEY)!)[0].dataSource).toBe('imported-file');
  });

  it('a bad file is reported as fatal and Apply stays disabled', async () => {
    renderPage();
    await openMine();
    const file = new File(['foo,bar\n1,2\n'], 'bad.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByLabelText('Scores file'), { target: { files: [file] } });
    await waitFor(() => expect(screen.getByText(/Missing required column/)).toBeTruthy());
    expect((screen.getByRole('button', { name: /Apply import/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('Arabic / RTL', () => {
  it('renders Arabic labels and RTL container; no English leakage in the new controls', async () => {
    localStorage.setItem('isc-lang', 'ar');
    localStorage.setItem(KEY, JSON.stringify([mine()]));
    const { container } = renderPage();
    expect(container.querySelector('.rtl')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'محفظتي' }));
    expect(screen.getByText('استيراد من ملف CSV')).toBeTruthy();
    expect(screen.getByRole('button', { name: /مدير الفئة/ })).toBeTruthy();
    expect(screen.getAllByText('الموصى به').length).toBeGreaterThan(0);
    expect(screen.getAllByText('البديل القوي').length).toBeGreaterThan(0);
    expect(screen.queryByText('Strong alternative')).toBeNull();
  });
});
