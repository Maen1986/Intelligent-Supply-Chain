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
