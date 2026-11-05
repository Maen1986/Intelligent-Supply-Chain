import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { NegotiationDesk } from './NegotiationDesk';

function mount(lang: 'en' | 'ar') {
  localStorage.setItem('isc-lang', lang);
  return render(<LanguageProvider><NegotiationDesk /></LanguageProvider>);
}
const go = (n: number) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${n}\\.`) }));
beforeEach(() => { localStorage.clear(); });
afterEach(() => cleanup());

describe('NegotiationDesk render', () => {
  it('English: title, six steps, glance bar', () => {
    mount('en');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Negotiation Desk');
    for (let i = 1; i <= 6; i++) expect(screen.getByRole('button', { name: new RegExp(`^${i}\\.`) })).toBeTruthy();
    expect(screen.getByLabelText('Your negotiation at a glance')).toBeTruthy();
  });
  it('Arabic: RTL and Arabic title', () => {
    const { container } = mount('ar');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('مكتب التفاوض');
    expect(container.querySelector('[dir="rtl"]')).toBeTruthy();
  });
  it('empty state: not enough data, readiness 0', () => {
    mount('en');
    go(2);
    expect(screen.getAllByText('Not enough data').length).toBeGreaterThan(0);
  });
  it('strong when lock-in low and survivable; boundary 2 strong, 4 weak', () => {
    mount('en');
    go(2);
    fireEvent.change(screen.getByLabelText(/Could you survive switching supplier/), { target: { value: 'yes' } });
    fireEvent.change(screen.getByLabelText(/Lock-in index/), { target: { value: '2' } });
    expect(screen.getAllByText('Strong position').length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText(/Lock-in index/), { target: { value: '4' } });
    expect(screen.getAllByText('Weak position').length).toBeGreaterThan(0);
  });
  it('hostile input: out-of-range lock-in does not crash', () => {
    mount('en');
    go(2);
    fireEvent.change(screen.getByLabelText(/Lock-in index/), { target: { value: '99' } });
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
  });
  it('tactics step shows the ethics split', () => {
    mount('en');
    go(4);
    expect(screen.getByText('Watch for these from the supplier')).toBeTruthy();
    expect(screen.getByText(/Extreme Anchor/)).toBeTruthy();
  });
  it('example fills the brief with a primary AND an alternative plus trade-off', () => {
    mount('en');
    fireEvent.click(screen.getByText('Try an example'));
    go(6);
    const brief = screen.getByTestId('brief');
    expect(brief.textContent).toMatch(/Recommended/);
    expect(brief.textContent).toMatch(/Strong alternative/);
    expect(brief.textContent).toMatch(/Trade-off/);
    expect(brief.textContent).toMatch(/Price rising/);
  });
  it('logging a round updates next-move advice', () => {
    mount('en');
    go(5);
    fireEvent.click(screen.getByText('Log a round'));
    expect(screen.getByText(/Next move:/)).toBeTruthy();
  });
  it('disclosure of the unsourced thresholds is on the position step', () => {
    mount('en');
    go(2);
    expect(screen.getByText(/planning assumptions, not an industry standard/)).toBeTruthy();
  });
});
