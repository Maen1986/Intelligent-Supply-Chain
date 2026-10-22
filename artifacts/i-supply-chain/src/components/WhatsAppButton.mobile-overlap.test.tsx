/**
 * WhatsAppButton.mobile-overlap.test.tsx -- Backlog #451 (zero overlap on mobile).
 *
 * Owner rule: the WhatsApp button must never overlap page content. A
 * position: fixed button always sits over scrolling content, so on mobile
 * (<768px) the component renders IN FLOW (a normal row at the end of the
 * page, below the footer) -- no fixed/absolute positioning -- while desktop
 * keeps the original floating button byte-for-byte.
 * jsdom has no layout engine; the real-browser proof is the Playwright
 * screenshot taken against the dev server (see FIX-451 report).
 */
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { WhatsAppButton } from './WhatsAppButton';

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  // useIsMobile reads window.matchMedia(`(max-width: 767px)`) and then
  // immediately re-derives from window.innerWidth in its own onChange/initial
  // call -- so a faithful matchMedia stub just needs `.matches` to agree with
  // the innerWidth we're setting, matching how a real browser would resolve it.
  window.matchMedia = ((query: string) => {
    const widthMatch = /\(max-width:\s*(\d+)px\)/.exec(query);
    const maxWidth = widthMatch ? parseInt(widthMatch[1], 10) : Infinity;
    return {
      matches: width <= maxWidth,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
  window.dispatchEvent(new Event('resize'));
}


function renderButton() {
  return render(<LanguageProvider><WhatsAppButton /></LanguageProvider>);
}

describe('WhatsAppButton -- zero overlap on mobile (Backlog #451)', () => {
  const originalMatchMedia = window.matchMedia;
  afterEach(() => { cleanup(); localStorage.removeItem('isc-lang'); window.matchMedia = originalMatchMedia; });

  it('mobile (375px): renders in-flow, never fixed or absolute, link still works', () => {
    setViewportWidth(375);
    const { getByTestId, container } = renderButton();
    const box = getByTestId('whatsapp-button-container');
    expect(box.getAttribute('data-mobile-inflow')).toBe('true');
    expect(container.innerHTML).not.toMatch(/\bfixed\b/);
    expect(container.innerHTML).not.toMatch(/\babsolute\b/);
    const a = container.querySelector('a')!;
    expect(a.getAttribute('href')).toContain('https://wa.me/966549479722');
    expect(a.getAttribute('aria-label')).toBeTruthy();
  });

  it('mobile Arabic label is real Arabic', () => {
    setViewportWidth(375);
    localStorage.setItem('isc-lang', 'ar');
    const { container } = renderButton();
    expect(container.textContent).toMatch(/[\u0600-\u06FF]/);
  });

  it('desktop (1280px): original floating button, unchanged classes', () => {
    setViewportWidth(1280);
    const { getByTestId, container } = renderButton();
    const box = getByTestId('whatsapp-button-container');
    expect(box.getAttribute('data-mobile-inflow')).toBe('false');
    expect(box.className).toBe('fixed bottom-24 left-5 z-40 flex items-center gap-3');
    expect(container.querySelector('a')!.className).toBe('w-14 h-14 rounded-full flex items-center justify-center shadow-xl');
  });
});
