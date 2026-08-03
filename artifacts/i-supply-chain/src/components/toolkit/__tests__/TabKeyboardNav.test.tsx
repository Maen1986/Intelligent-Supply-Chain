/**
 * Keyboard navigation tests — tab bars in Risk, Training, and Maturity toolkits
 *
 * Verifies that each toolkit tab bar:
 *   • carries role="tablist" / role="tab"
 *   • ArrowRight moves focus forward to the next tab and activates it
 *   • ArrowLeft wraps from the first tab to the last tab
 *   • ArrowRight wraps from the last tab back to the first tab
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';

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
    saveError: null, dismissSaveError: vi.fn(),
  }),
}));

vi.mock('@/components/AIPlanPanel', () => ({ AIPlanPanel: () => null }));

/* ── Component imports ─────────────────────────────────────────────────── */

import { RiskToolsSection }        from '../RiskTools';
import { TrainingNeedsAssessment } from '../TrainingTools';
import { MaturityAssessmentTool }  from '../MaturityTools';

/* ── ResizeObserver stub ───────────────────────────────────────────────── */
class ResizeObserverStub {
  observe()    {}
  unobserve()  {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverStub;

/* ── Helper ────────────────────────────────────────────────────────────── */

function arrowRight(el: Element) {
  fireEvent.keyDown(el, { key: 'ArrowRight', code: 'ArrowRight', bubbles: true });
}
function arrowLeft(el: Element) {
  fireEvent.keyDown(el, { key: 'ArrowLeft', code: 'ArrowLeft', bubbles: true });
}

/* ══════════════════════════════════════════════════════════════════════════
   RiskTools — RiskToolsSection
   Tab order: KRI Monitor | Risk Register | Heat Map | Mitigation Plans |
              BCP & Templates | Supplier Alerts | AI Risk Brief  (7 tabs)
══════════════════════════════════════════════════════════════════════════ */
describe('RiskToolsSection — tab-bar keyboard navigation', () => {
  beforeEach(() => { localStorage.clear(); cleanup(); });

  it('renders a tablist with role="tablist"', () => {
    render(<RiskToolsSection isAr={false} />);
    expect(screen.getByRole('tablist')).toBeTruthy();
  });

  it('all tab buttons carry role="tab"', () => {
    render(<RiskToolsSection isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(7);
  });

  it('first tab is selected and focusable (tabIndex 0) on mount', () => {
    render(<RiskToolsSection isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('tabIndex', '0');
    tabs.slice(1).forEach(t => expect(t).toHaveAttribute('tabIndex', '-1'));
  });

  it('ArrowRight from first tab activates the second tab', () => {
    render(<RiskToolsSection isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    arrowRight(tabs[0]);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowRight from last tab wraps to first tab', () => {
    render(<RiskToolsSection isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    // Navigate to the last tab first
    fireEvent.click(tabs[tabs.length - 1]);
    arrowRight(tabs[tabs.length - 1]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowLeft from first tab wraps to last tab', () => {
    render(<RiskToolsSection isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    arrowLeft(tabs[0]);
    expect(tabs[tabs.length - 1]).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowLeft from second tab moves to first tab', () => {
    render(<RiskToolsSection isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]);
    arrowLeft(tabs[1]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowRight and ArrowLeft work in Arabic mode', () => {
    render(<RiskToolsSection isAr={true} />);
    const tabs = screen.getAllByRole('tab');
    arrowRight(tabs[0]);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    arrowLeft(tabs[1]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   TrainingNeedsAssessment — tab-bar keyboard navigation
   Tab order: Assessment Matrix | Skill-Gap Radar | Development Actions |
              AI Learning Plan  (4 tabs)
══════════════════════════════════════════════════════════════════════════ */
describe('TrainingNeedsAssessment — tab-bar keyboard navigation', () => {
  beforeEach(() => { localStorage.clear(); cleanup(); });

  it('renders a tablist with role="tablist"', () => {
    render(<TrainingNeedsAssessment isAr={false} />);
    expect(screen.getByRole('tablist')).toBeTruthy();
  });

  it('all tab buttons carry role="tab"', () => {
    render(<TrainingNeedsAssessment isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(4);
  });

  it('first tab (Assessment Matrix) is selected on mount', () => {
    render(<TrainingNeedsAssessment isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('tabIndex', '0');
    tabs.slice(1).forEach(t => expect(t).toHaveAttribute('tabIndex', '-1'));
  });

  it('ArrowRight from first tab activates Skill-Gap Radar tab', () => {
    render(<TrainingNeedsAssessment isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    arrowRight(tabs[0]);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowRight from last tab wraps to first tab', () => {
    render(<TrainingNeedsAssessment isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[tabs.length - 1]);
    arrowRight(tabs[tabs.length - 1]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowLeft from first tab wraps to last tab', () => {
    render(<TrainingNeedsAssessment isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    arrowLeft(tabs[0]);
    expect(tabs[tabs.length - 1]).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowLeft from second tab moves to first tab', () => {
    render(<TrainingNeedsAssessment isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]);
    arrowLeft(tabs[1]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('clicking a tab activates it', () => {
    render(<TrainingNeedsAssessment isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[2]);
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
  });

  it('keyboard navigation works in Arabic mode', () => {
    render(<TrainingNeedsAssessment isAr={true} />);
    const tabs = screen.getAllByRole('tab');
    arrowRight(tabs[0]);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    arrowLeft(tabs[1]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   MaturityAssessmentTool — tab-bar keyboard navigation
   Tab order: Assessment | Gap Analysis | AI Roadmap  (3 tabs)
══════════════════════════════════════════════════════════════════════════ */
describe('MaturityAssessmentTool — tab-bar keyboard navigation', () => {
  beforeEach(() => { localStorage.clear(); cleanup(); });

  it('renders a tablist with role="tablist"', () => {
    render(<MaturityAssessmentTool isAr={false} />);
    expect(screen.getByRole('tablist')).toBeTruthy();
  });

  it('all tab buttons carry role="tab"', () => {
    render(<MaturityAssessmentTool isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(3);
  });

  it('first tab (Assessment) is selected on mount', () => {
    render(<MaturityAssessmentTool isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('tabIndex', '0');
    tabs.slice(1).forEach(t => expect(t).toHaveAttribute('tabIndex', '-1'));
  });

  it('ArrowRight from Assessment tab activates Gap Analysis tab', () => {
    render(<MaturityAssessmentTool isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    arrowRight(tabs[0]);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowRight from last tab wraps to first tab', () => {
    render(<MaturityAssessmentTool isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[2]);
    arrowRight(tabs[2]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowLeft from first tab wraps to last tab', () => {
    render(<MaturityAssessmentTool isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    arrowLeft(tabs[0]);
    expect(tabs[tabs.length - 1]).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowLeft from second tab moves to first tab', () => {
    render(<MaturityAssessmentTool isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]);
    arrowLeft(tabs[1]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('works for slug="resiliency"', () => {
    render(<MaturityAssessmentTool slug="resiliency" isAr={false} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(3);
    arrowRight(tabs[0]);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    arrowRight(tabs[1]);
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    arrowRight(tabs[2]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('keyboard navigation works in Arabic mode', () => {
    render(<MaturityAssessmentTool isAr={true} />);
    const tabs = screen.getAllByRole('tab');
    arrowRight(tabs[0]);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    arrowLeft(tabs[0]);
    expect(tabs[tabs.length - 1]).toHaveAttribute('aria-selected', 'true');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   TrainingNeedsAssessment — score persistence across tab switches
   Entering scores on Assessment Matrix → switch to AI Learning Plan → back
   → scores must still be visible in the matrix selects
══════════════════════════════════════════════════════════════════════════ */
describe('TrainingNeedsAssessment — scores preserved when switching tabs', () => {
  beforeEach(() => { localStorage.clear(); cleanup(); });

  it('self score entered on Matrix tab is still present after switching to AI tab and back', () => {
    render(<TrainingNeedsAssessment isAr={false} />);
    const tabs = screen.getAllByRole('tab');

    // ── We start on the Assessment Matrix tab ──
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

    // Enter a self-score of 3 for "Team Member 1 — Strategy & Planning"
    const selfSelect = screen.getByRole('combobox', {
      name: 'Team Member 1 — Strategy & Planning — Self',
    }) as HTMLSelectElement;
    fireEvent.change(selfSelect, { target: { value: '3' } });
    expect(selfSelect.value).toBe('3');

    // ── Switch to AI Learning Plan tab (index 3) ──
    fireEvent.click(tabs[3]);
    expect(tabs[3]).toHaveAttribute('aria-selected', 'true');
    // The matrix panel is no longer rendered
    expect(screen.queryByRole('combobox', {
      name: 'Team Member 1 — Strategy & Planning — Self',
    })).toBeNull();

    // ── Switch back to Assessment Matrix tab ──
    fireEvent.click(tabs[0]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

    // The select must still show the previously entered value
    const selfSelectAfter = screen.getByRole('combobox', {
      name: 'Team Member 1 — Strategy & Planning — Self',
    }) as HTMLSelectElement;
    expect(selfSelectAfter.value).toBe('3');
  });

  it('manager score survives a Matrix → Radar → Matrix round-trip', () => {
    render(<TrainingNeedsAssessment isAr={false} />);
    const tabs = screen.getAllByRole('tab');

    // Enter a manager score of 4 for the first domain
    const mgrSelect = screen.getByRole('combobox', {
      name: 'Team Member 1 — Strategy & Planning — Manager',
    }) as HTMLSelectElement;
    fireEvent.change(mgrSelect, { target: { value: '4' } });
    expect(mgrSelect.value).toBe('4');

    // Switch to Skill-Gap Radar tab (index 1) then back
    fireEvent.click(tabs[1]);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(tabs[0]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

    const mgrSelectAfter = screen.getByRole('combobox', {
      name: 'Team Member 1 — Strategy & Planning — Manager',
    }) as HTMLSelectElement;
    expect(mgrSelectAfter.value).toBe('4');
  });

  it('multiple domain scores all survive the tab round-trip', () => {
    render(<TrainingNeedsAssessment isAr={false} />);
    const tabs = screen.getAllByRole('tab');

    const pairs: [string, string][] = [
      ['Team Member 1 — Strategy & Planning — Self', '2'],
      ['Team Member 1 — Procurement & Sourcing — Self', '5'],
      ['Team Member 1 — Risk Management — Self', '1'],
    ];

    // Set scores
    for (const [label, value] of pairs) {
      fireEvent.change(
        screen.getByRole('combobox', { name: label }) as HTMLSelectElement,
        { target: { value } },
      );
    }

    // Tab away to Development Actions (index 2) and back
    fireEvent.click(tabs[2]);
    fireEvent.click(tabs[0]);

    // All scores intact
    for (const [label, value] of pairs) {
      const el = screen.getByRole('combobox', { name: label }) as HTMLSelectElement;
      expect(el.value).toBe(value);
    }
  }, 15000);
});

/* ══════════════════════════════════════════════════════════════════════════
   TrainingNeedsAssessment — localStorage persistence across a page reload
   Scores written to localStorage during one mount must be restored when the
   component is unmounted and remounted (localStorage is NOT cleared between
   the two renders, simulating a browser hard-reload).
══════════════════════════════════════════════════════════════════════════ */
describe('TrainingNeedsAssessment — scores restored from localStorage after remount', () => {
  beforeEach(() => { localStorage.clear(); cleanup(); });

  it('a self-score entered before unmount is shown after remount', () => {
    // ── First mount ──────────────────────────────────────────────────────
    render(<TrainingNeedsAssessment isAr={false} />);

    const selfSelect = screen.getByRole('combobox', {
      name: 'Team Member 1 — Strategy & Planning — Self',
    }) as HTMLSelectElement;
    fireEvent.change(selfSelect, { target: { value: '3' } });
    expect(selfSelect.value).toBe('3');

    // Unmount — localStorage is preserved; this simulates the page unloading
    cleanup();

    // ── Second mount (simulated reload) ─────────────────────────────────
    render(<TrainingNeedsAssessment isAr={false} />);

    const selfSelectAfter = screen.getByRole('combobox', {
      name: 'Team Member 1 — Strategy & Planning — Self',
    }) as HTMLSelectElement;
    expect(selfSelectAfter.value).toBe('3');
  });

  it('a manager score entered before unmount is shown after remount', () => {
    render(<TrainingNeedsAssessment isAr={false} />);

    const mgrSelect = screen.getByRole('combobox', {
      name: 'Team Member 1 — Procurement & Sourcing — Manager',
    }) as HTMLSelectElement;
    fireEvent.change(mgrSelect, { target: { value: '5' } });
    expect(mgrSelect.value).toBe('5');

    cleanup();

    render(<TrainingNeedsAssessment isAr={false} />);

    const mgrSelectAfter = screen.getByRole('combobox', {
      name: 'Team Member 1 — Procurement & Sourcing — Manager',
    }) as HTMLSelectElement;
    expect(mgrSelectAfter.value).toBe('5');
  });

  it('scores across multiple domains all survive remount', () => {
    render(<TrainingNeedsAssessment isAr={false} />);

    const pairs: [string, string][] = [
      ['Team Member 1 — Strategy & Planning — Self', '2'],
      ['Team Member 1 — Risk Management — Self', '4'],
      ['Team Member 1 — Data & Analytics — Manager', '1'],
    ];

    for (const [label, value] of pairs) {
      fireEvent.change(
        screen.getByRole('combobox', { name: label }) as HTMLSelectElement,
        { target: { value } },
      );
    }

    cleanup();

    render(<TrainingNeedsAssessment isAr={false} />);

    for (const [label, value] of pairs) {
      const el = screen.getByRole('combobox', { name: label }) as HTMLSelectElement;
      expect(el.value).toBe(value);
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   MaturityAssessmentTool — rating persistence across tab switches
   Rate dimensions on Assessment tab → switch to Gap Analysis → back →
   ratings must still be reflected in the button aria-pressed state
══════════════════════════════════════════════════════════════════════════ */
describe('MaturityAssessmentTool — ratings preserved when switching tabs', () => {
  beforeEach(() => { localStorage.clear(); cleanup(); });

  it('a dimension rating survives Assessment → Gap Analysis → Assessment', () => {
    render(<MaturityAssessmentTool isAr={false} />);
    const tabs = screen.getAllByRole('tab');

    // We start on the Assessment tab
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

    // Click level-3 button for "Strategy & Planning"
    const btn3 = screen.getByRole('button', {
      name: 'Strategy & Planning: Competent (3)',
    });
    fireEvent.click(btn3);
    expect(btn3).toHaveAttribute('aria-pressed', 'true');

    // Switch to Gap Analysis tab (index 1)
    fireEvent.click(tabs[1]);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');

    // Switch back to Assessment tab
    fireEvent.click(tabs[0]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

    // Level-3 button must still be pressed
    const btn3After = screen.getByRole('button', {
      name: 'Strategy & Planning: Competent (3)',
    });
    expect(btn3After).toHaveAttribute('aria-pressed', 'true');
    // Level-4 button must NOT be pressed
    const btn4After = screen.getByRole('button', {
      name: 'Strategy & Planning: Advanced (4)',
    });
    expect(btn4After).toHaveAttribute('aria-pressed', 'false');
  });

  it('ratings for multiple dimensions survive Assessment → AI Roadmap → Assessment', () => {
    render(<MaturityAssessmentTool isAr={false} />);
    const tabs = screen.getAllByRole('tab');

    // Rate two dimensions
    fireEvent.click(screen.getByRole('button', { name: 'Strategy & Planning: Advanced (4)' }));
    fireEvent.click(screen.getByRole('button', { name: 'People & Capability: Developing (2)' }));

    // Switch to AI Roadmap (index 2) and back
    fireEvent.click(tabs[2]);
    fireEvent.click(tabs[0]);

    // Both pressed states must be intact (fill-up: val>=l is pressed)
    expect(screen.getByRole('button', { name: 'Strategy & Planning: Advanced (4)' }))
      .toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'People & Capability: Developing (2)' }))
      .toHaveAttribute('aria-pressed', 'true');

    // Levels ABOVE the selected value must NOT be pressed
    expect(screen.getByRole('button', { name: 'Strategy & Planning: World Class (5)' }))
      .toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'People & Capability: Competent (3)' }))
      .toHaveAttribute('aria-pressed', 'false');
  });

  it('works for a slug-specific assessment (resiliency)', () => {
    render(<MaturityAssessmentTool slug="resiliency" isAr={false} />);
    const tabs = screen.getAllByRole('tab');

    // Rate "BCP Maturity" dimension at level 2
    fireEvent.click(screen.getByRole('button', { name: 'BCP Maturity: Developing (2)' }));

    // Tab to Gap Analysis and back
    fireEvent.click(tabs[1]);
    fireEvent.click(tabs[0]);

    expect(screen.getByRole('button', { name: 'BCP Maturity: Developing (2)' }))
      .toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'BCP Maturity: Competent (3)' }))
      .toHaveAttribute('aria-pressed', 'false');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Tasks 586 / 640 — MaturityAssessmentTool dimension ratings survive a
   simulated page reload (component unmount + remount with localStorage intact)
══════════════════════════════════════════════════════════════════════════ */
describe('MaturityAssessmentTool — dimension ratings restored from localStorage after remount (Tasks 586 & 640)', () => {
  beforeEach(() => { localStorage.clear(); cleanup(); });

  it('a single dimension rating entered before unmount is shown after remount', () => {
    // ── First mount ───────────────────────────────────────────────────────
    render(<MaturityAssessmentTool isAr={false} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Strategy & Planning: Competent (3)' }),
    );
    expect(
      screen.getByRole('button', { name: 'Strategy & Planning: Competent (3)' }),
    ).toHaveAttribute('aria-pressed', 'true');

    // Unmount — localStorage is preserved; simulates the page unloading
    cleanup();

    // ── Second mount (simulated reload) ──────────────────────────────────
    render(<MaturityAssessmentTool isAr={false} />);
    expect(
      screen.getByRole('button', { name: 'Strategy & Planning: Competent (3)' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Strategy & Planning: Advanced (4)' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('ratings for two dimensions both survive remount', () => {
    render(<MaturityAssessmentTool isAr={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Strategy & Planning: Advanced (4)' }));
    fireEvent.click(screen.getByRole('button', { name: 'People & Capability: Developing (2)' }));
    cleanup();

    render(<MaturityAssessmentTool isAr={false} />);
    expect(
      screen.getByRole('button', { name: 'Strategy & Planning: Advanced (4)' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'People & Capability: Developing (2)' }),
    ).toHaveAttribute('aria-pressed', 'true');
    // Levels above the saved value must not be pressed
    expect(
      screen.getByRole('button', { name: 'Strategy & Planning: World Class (5)' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('slug-scoped storage is independent — resiliency rating does not bleed into default slug', () => {
    // Rate "BCP Maturity" on the resiliency slug
    render(<MaturityAssessmentTool slug="resiliency" isAr={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'BCP Maturity: Advanced (4)' }));
    cleanup();

    // Remount with default slug — resiliency data must not appear
    render(<MaturityAssessmentTool isAr={false} />);
    // "BCP Maturity" is a resiliency-specific dimension — it should not even render here
    expect(
      screen.queryByRole('button', { name: 'BCP Maturity: Advanced (4)' }),
    ).toBeNull();
  });
});
