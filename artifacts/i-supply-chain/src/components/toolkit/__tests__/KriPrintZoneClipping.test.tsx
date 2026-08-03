/**
 * Task 342 — Confirm the KRI print zone isn't clipped when printing from Safari on iOS
 *
 * iOS Safari has two quirks that cause absolutely-positioned print zones to be
 * clipped to their ancestor's bounds:
 *
 *   1. CSS transforms on an ancestor create a new containing block.  A
 *      position:absolute print zone inside a transformed element is clipped
 *      to that element's bounds rather than escaping to the full page.
 *
 *   2. -webkit-overflow-scrolling:touch isolates the element in a separate
 *      GPU compositor layer.  During print the layer is rendered
 *      independently, clipping any absolutely-positioned content that
 *      overflows the element.
 *
 * The index.css overflow-hidden clipping fix must therefore also reset
 * transforms and -webkit-overflow-scrolling on the common container classes
 * (.rounded-2xl, .rounded-xl, .overflow-hidden, .overflow-x-auto,
 * .overflow-y-auto) whenever a data-print attribute is set on the body.
 *
 * Covers:
 *  - print-zone-kri class is on the outermost element rendered by RiskToolsSection
 *  - Clicking Export PDF sets data-print="kri" on document.body
 *  - All six print zones are registered with visibility gates in index.css
 *  - The iOS Safari transform reset rule is present in index.css
 *  - The iOS Safari -webkit-overflow-scrolling reset rule is present in index.css
 *  - No inline transform on any ancestor of print-zone-kri in the rendered DOM
 *    (transforms on ancestors would create containing blocks that clip the zone)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { RiskToolsSection } from '../RiskTools';

/* ── Module mocks ──────────────────────────────────────────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, loading: false }),
}));

vi.mock('@/hooks/useAIPlan', () => ({
  useAIPlan: () => ({
    loading: false, result: null, error: null, rateLimited: false,
    generate: vi.fn(), reset: vi.fn(), savedPlan: null,
    viewSaved: vi.fn(), deleteSaved: vi.fn(),
  }),
}));

vi.mock('@/components/AIPlanPanel', () => ({ AIPlanPanel: () => null }));

/* ── window.print stub ────────────────────────────────────────────────── */

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

/* ── Setup / teardown ─────────────────────────────────────────────────── */

beforeEach(() => {
  printCalled = false;
  document.body.removeAttribute('data-print');
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  document.body.removeAttribute('data-print');
});

/* ── CSS source (read once at module level) ───────────────────────────── */

const cssPath = path.resolve(__dirname, '../../../index.css');
const cssSource = fs.readFileSync(cssPath, 'utf8');

/* ══════════════════════════════════════════════════════════════════════════
   Suite 1 — KRI zone DOM structure
══════════════════════════════════════════════════════════════════════════ */
describe('KRI print zone — DOM structure', () => {
  it('outermost element of RiskToolsSection carries the print-zone-kri class', () => {
    const { container } = render(<RiskToolsSection isAr={false} />);
    // The component's root div must be the print zone so it is positioned
    // correctly by the @media print rule (position:absolute, top:0, left:0).
    expect(container.firstElementChild?.classList.contains('print-zone-kri')).toBe(true);
  });

  it('clicking Export PDF sets data-print="kri" on document.body', () => {
    render(<RiskToolsSection isAr={false} />);
    const btn = document.querySelector<HTMLButtonElement>('button.no-print');
    expect(btn).toBeTruthy();
    fireEvent.click(btn!);
    expect(document.body.getAttribute('data-print')).toBe('kri');
  });

  it('clicking Export PDF also calls window.print()', () => {
    render(<RiskToolsSection isAr={false} />);
    const btn = document.querySelector<HTMLButtonElement>('button.no-print');
    fireEvent.click(btn!);
    expect(printCalled).toBe(true);
  });

  it('no ancestor of print-zone-kri in the rendered DOM has an inline transform', () => {
    // An inline CSS transform on an ancestor would create a new containing
    // block on iOS Safari, clipping the absolutely-positioned print zone.
    // The only legitimate transform in the component is the Likelihood-axis
    // label (rotate(180deg)) which is a *descendant* of the print zone, not
    // an ancestor, so it cannot cause clipping.
    const { container } = render(<RiskToolsSection isAr={false} />);
    const zone = container.querySelector('.print-zone-kri') as HTMLElement | null;
    expect(zone).toBeTruthy();

    // Walk up from zone to container root, checking inline style.transform
    let el: HTMLElement | null = zone!.parentElement;
    while (el && el !== container) {
      expect(el.style.transform).toBeFalsy();
      el = el.parentElement;
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 2 — index.css: all six print zone visibility gates
══════════════════════════════════════════════════════════════════════════ */
describe('index.css — all six print zone visibility gates are registered', () => {
  const PRINT_ZONES = [
    'scorecard',
    'kri',
    'clm',
    'checklist',
    'alert-config',
    'weekly-review',
  ] as const;

  for (const zone of PRINT_ZONES) {
    it(`has a data-print="${zone}" visibility gate for .print-zone-${zone}`, () => {
      // Every zone must have: body[data-print="<zone>"] .print-zone-<zone>
      expect(cssSource).toContain(`body[data-print="${zone}"] .print-zone-${zone}`);
    });

    it(`print-zone-${zone} gate makes the zone and its children visible`, () => {
      // The rule must cover both the zone itself and its descendants (*)
      const zoneRule = `body[data-print="${zone}"] .print-zone-${zone}`;
      const childRule = `body[data-print="${zone}"] .print-zone-${zone} *`;
      expect(cssSource).toContain(zoneRule);
      expect(cssSource).toContain(childRule);
    });
  }
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 3 — index.css: iOS Safari overflow-hidden clipping fix
══════════════════════════════════════════════════════════════════════════ */
describe('index.css — iOS Safari clipping fixes', () => {
  it('overflow fix covers .rounded-2xl (outer card wrapper)', () => {
    expect(cssSource).toContain('body[data-print] .rounded-2xl');
  });

  it('overflow fix covers .rounded-xl (inner card wrapper)', () => {
    expect(cssSource).toContain('body[data-print] .rounded-xl');
  });

  it('overflow fix covers .overflow-hidden', () => {
    expect(cssSource).toContain('body[data-print] .overflow-hidden');
  });

  it('overflow fix covers .overflow-x-auto (tab bar scroll container)', () => {
    expect(cssSource).toContain('body[data-print] .overflow-x-auto');
  });

  it('overflow fix covers .overflow-y-auto', () => {
    expect(cssSource).toContain('body[data-print] .overflow-y-auto');
  });

  it('overflow fix resets -webkit-transform (iOS Safari containing-block fix)', () => {
    // iOS Safari: a transform on an ancestor creates a new containing block,
    // trapping position:absolute print zones inside the element's bounds.
    expect(cssSource).toContain('-webkit-transform: none !important');
  });

  it('overflow fix resets transform (cross-browser containing-block fix)', () => {
    expect(cssSource).toContain('transform: none !important');
  });

  it('resets -webkit-overflow-scrolling to auto when printing (iOS GPU layer fix)', () => {
    // -webkit-overflow-scrolling:touch creates a separate GPU compositor
    // layer; during print this layer clips absolutely-positioned print zones.
    expect(cssSource).toContain('-webkit-overflow-scrolling: auto !important');
  });

  it('the -webkit-overflow-scrolling reset applies under body[data-print]', () => {
    // Must be scoped to printing so it never affects interactive behaviour.
    // Find the block that contains the reset and verify it is inside the
    // @media print rule and guarded by body[data-print].
    const printMediaStart = cssSource.indexOf('@media print');
    expect(printMediaStart).toBeGreaterThan(-1);
    const resetIdx = cssSource.indexOf('-webkit-overflow-scrolling: auto !important');
    expect(resetIdx).toBeGreaterThan(printMediaStart);
    // The reset selector must be body[data-print] *
    expect(cssSource).toContain('body[data-print] *');
  });
});
