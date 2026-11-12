/**
 * Risk Management page: honesty fixes (backlog #862, audit findings F1, F6, F7).
 * - the toolkit says its data is saved in this browser only (not "your account");
 * - the four headline figures carry an "illustrative, no source yet" caption;
 * - the Risk Register tab labels its rows as sample data.
 * Arabic strings never contain the Latin brand "ISC".
 */
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

let mockAr = false;
vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: mockAr ? 'ar' : 'en', ar: mockAr, t: (k: string) => k }),
}));
vi.mock('wouter', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
  useLocation: () => ['/', vi.fn()],
}));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_t, tag: string) =>
      ({ children, initial, animate, whileInView, viewport, transition, variants, ...rest }: any) =>
        React.createElement(tag, rest, children),
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/KPIDashboard', () => ({ KPIDashboard: () => <div /> }));
vi.mock('@/components/toolkit/RiskTools', () => ({ RiskToolsSection: (p: { initialTab?: string }) => <div data-testid="toolkit-stub" data-start={p.initialTab ?? ''} /> }));

import { RiskManagement } from '../RiskManagement';

afterEach(() => cleanup());

describe('Risk Management page honesty fixes', () => {
  it('Overview: the four figures are captioned as illustrative (EN)', () => {
    mockAr = false;
    render(<RiskManagement />);
    const cap = screen.getByTestId('risk-stats-illustrative');
    expect(cap.textContent).toMatch(/Illustrative figures/);
    expect(cap.textContent).toMatch(/No source is published/);
  });

  it('Overview: the caption is Arabic without the Latin brand (AR)', () => {
    mockAr = true;
    render(<RiskManagement />);
    const cap = screen.getByTestId('risk-stats-illustrative');
    expect(cap.textContent).toMatch(/[؀-ۿ]/);
    expect(cap.textContent).not.toMatch(/ISC/);
  });

  it('Risk Register tab: rows are labelled sample data (EN and AR)', () => {
    mockAr = false;
    render(<RiskManagement />);
    fireEvent.click(screen.getByRole('button', { name: 'Sample Register' }));
    expect(screen.getByTestId('risk-register-sample-badge').textContent).toBe('Sample data (illustrative)');
    cleanup();
    mockAr = true;
    render(<RiskManagement />);
    fireEvent.click(screen.getByRole('button', { name: 'سجلّ تجريبي' }));
    const ar = screen.getByTestId('risk-register-sample-badge').textContent || '';
    expect(ar).toMatch(/[؀-ۿ]/);
    expect(ar).not.toMatch(/ISC/);
  });

  it('Toolkit tab: register is saved to the account only when signed in; indicators and alerts stay in this browser', () => {
    mockAr = false;
    render(<RiskManagement />);
    fireEvent.click(screen.getByRole('button', { name: 'Your Risk Toolkit' }));
    expect(screen.getByText(/risk register is saved to your account/)).toBeTruthy();
    expect(document.body.textContent).toMatch(/indicator values and alert settings stay in this browser only/);
    expect(document.body.textContent).toMatch(/for guests everything stays in this browser only/);
    cleanup();
    mockAr = true;
    render(<RiskManagement />);
    fireEvent.click(screen.getByRole('button', { name: 'أدواتك التفاعلية' }));
    expect(document.body.textContent).toMatch(/يُحفظ سجلّ المخاطر في حسابك/);
    expect(document.body.textContent).toMatch(/فتبقى على هذا المتصفح فقط/);
    expect(document.body.textContent).not.toMatch(/ISC/);
  });

  it('the sample tab is named Sample Register and links straight to My Risk Register (EN and AR)', () => {
    mockAr = false;
    render(<RiskManagement />);
    expect(screen.queryByRole('button', { name: 'Risk Register' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Sample Register' }));
    fireEvent.click(screen.getByTestId('open-my-register'));
    expect(screen.getByTestId('toolkit-stub').getAttribute('data-start')).toBe('register');
    cleanup();
    mockAr = true;
    render(<RiskManagement />);
    fireEvent.click(screen.getByRole('button', { name: 'سجلّ تجريبي' }));
    expect(screen.getByTestId('open-my-register').textContent).toMatch(/سجل المخاطر الخاص بي/);
    expect(document.body.textContent).not.toMatch(/ISC/);
  });

  it('opening Your Risk Toolkit from the top bar still starts on the first sub-tab', () => {
    mockAr = false;
    render(<RiskManagement />);
    fireEvent.click(screen.getByRole('button', { name: 'Your Risk Toolkit' }));
    expect(screen.getByTestId('toolkit-stub').getAttribute('data-start')).toBe('kri');
  });
});
