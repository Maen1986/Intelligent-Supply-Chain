/**
 * ControlTowerBand -- in-page replacement for the old floating promo card.
 * Must be in normal flow (never fixed/absolute), bilingual, dismissible for
 * the session, keyboard-operable, and hidden on /command-center.
 */
import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, cleanup, screen, fireEvent } from '@testing-library/react';

const langState = { value: 'en' };
const locState = { value: '/pricing' };
vi.mock('@/lib/LanguageContext', () => ({ useLanguage: () => ({ lang: langState.value, setLang: vi.fn() }) }));
vi.mock('wouter', async () => {
  const actual = await vi.importActual<typeof import('wouter')>('wouter');
  return { ...actual, useLocation: () => [locState.value, vi.fn()] };
});

import { ControlTowerBand, CONTROL_TOWER_DISMISS_KEY } from './ControlTowerBand';

beforeEach(() => { sessionStorage.clear(); langState.value = 'en'; locState.value = '/pricing'; });
afterEach(cleanup);

describe('ControlTowerBand', () => {
  it('renders in normal flow with all four deliverables and the facts', () => {
    render(<ControlTowerBand />);
    const band = screen.getByTestId('control-tower-band');
    expect(band.className).not.toMatch(/\b(fixed|absolute|sticky)\b/);
    for (const t of ['Peer benchmarks', 'Savings model', 'Risk score', '90-day plan']) expect(screen.getByText(t)).toBeTruthy();
    expect(band.textContent).toMatch(/5-7 minutes/);
    expect(band.textContent).toMatch(/SAR 250/);
    const cta = screen.getByRole('link', { name: /explore control tower/i });
    expect(cta.getAttribute('href')).toBe('/command-center');
  });

  it('Arabic: real Arabic copy, no English leakage in headline/CTA', () => {
    langState.value = 'ar';
    render(<ControlTowerBand />);
    const band = screen.getByTestId('control-tower-band');
    expect(band.textContent).toMatch(/[؀-ۿ]{3,}/);
    expect(screen.getByRole('link', { name: 'استكشف برج التحكم' })).toBeTruthy();
    expect(band.textContent).not.toMatch(/Explore Control Tower|Dismiss/);
  });

  it('dismiss button hides it and remembers for the session', () => {
    const { unmount } = render(<ControlTowerBand />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByTestId('control-tower-band')).toBeNull();
    expect(sessionStorage.getItem(CONTROL_TOWER_DISMISS_KEY)).toBe('1');
    unmount();
    render(<ControlTowerBand />);
    expect(screen.queryByTestId('control-tower-band')).toBeNull();
  });

  it('not shown on the Control Tower page itself', () => {
    locState.value = '/command-center';
    render(<ControlTowerBand />);
    expect(screen.queryByTestId('control-tower-band')).toBeNull();
  });
});
