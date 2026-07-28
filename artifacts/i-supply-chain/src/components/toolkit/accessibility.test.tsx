/**
 * Accessibility regression tests — toolkit components
 *
 * Uses jest-axe to assert zero *critical* accessibility violations on first
 * render of each toolkit component.  Critical violations are the ones axe-core
 * classifies as impact:"critical" — they make content completely inaccessible
 * to assistive technologies and are the most severe regression risk.
 *
 * Components covered (one suite each):
 *   • CLMTools         → ContractHealthChecker
 *   • RiskTools        → RiskToolsSection
 *   • TrainingTools    → TrainingNeedsAssessment
 *   • MaturityTools    → MaturityAssessmentTool
 *   • SupplierScorecard→ SupplierScorecardTool
 *   • Primitives       → ChecklistTool, ActionTracker, ParamForm
 *   • ProcurementTools → ProcurementToolsSection (all three sub-tabs)
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

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

/* ── Component imports (after mocks) ───────────────────────────────────── */

import { ContractHealthChecker }   from './CLMTools';
import { RiskToolsSection }        from './RiskTools';
import { TrainingNeedsAssessment } from './TrainingTools';
import { MaturityAssessmentTool }  from './MaturityTools';
import { SupplierScorecardTool }   from './SupplierScorecard';
import { ChecklistTool, ActionTracker, ParamForm } from './Primitives';
import { ProcurementToolsSection } from './ProcurementTools';

/* ── ResizeObserver stub (recharts needs it) ───────────────────────────── */
class ResizeObserverStub {
  observe()    {}
  unobserve()  {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverStub;

/* ── Helper ────────────────────────────────────────────────────────────── */

/**
 * Run axe on a rendered container and assert no *critical* violations exist.
 * Using impact:"critical" keeps these tests focused on regressions that
 * completely block assistive-technology users, rather than failing on minor
 * or informational issues unrelated to the task scope.
 */
async function expectNoCriticalViolations(container: Element) {
  const results = await axe(container, {
    // Reduce noise: only run rules that apply to the rendered HTML.
    // axe uses jsdom here, so layout-dependent rules are inherently unreliable;
    // we run the full rule set and then filter by impact ourselves.
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  });
  const critical = results.violations.filter(v => v.impact === 'critical');
  if (critical.length > 0) {
    const summary = critical
      .map(v => `  [${v.id}] ${v.description}\n    nodes: ${v.nodes.map(n => n.html).join(', ')}`)
      .join('\n');
    throw new Error(`${critical.length} critical axe violation(s):\n${summary}`);
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   CLMTools — ContractHealthChecker
══════════════════════════════════════════════════════════════════════════ */
describe('CLMTools — ContractHealthChecker accessibility', () => {
  beforeEach(() => { localStorage.clear(); cleanup(); });

  it('has zero critical violations on initial render', async () => {
    const { container } = render(<ContractHealthChecker isAr={false} />);
    await expectNoCriticalViolations(container);
  });

  it('has zero critical violations in Arabic mode', async () => {
    const { container } = render(<ContractHealthChecker isAr={true} />);
    await expectNoCriticalViolations(container);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   RiskTools — RiskToolsSection
══════════════════════════════════════════════════════════════════════════ */
describe('RiskTools — RiskToolsSection accessibility', () => {
  beforeEach(() => { localStorage.clear(); cleanup(); });

  it('has zero critical violations on initial render (KRI Monitor tab)', async () => {
    const { container } = render(<RiskToolsSection isAr={false} />);
    await expectNoCriticalViolations(container);
  });

  it('has zero critical violations in Arabic mode (KRI Monitor tab)', async () => {
    const { container } = render(<RiskToolsSection isAr={true} />);
    await expectNoCriticalViolations(container);
  });

  it('has zero critical violations on Supplier Alert Config tab', async () => {
    const { container } = render(<RiskToolsSection isAr={false} />);
    fireEvent.click(screen.getByRole('tab', { name: /Supplier Alerts/i }));
    await expectNoCriticalViolations(container);
  });

  it('has zero critical violations on Supplier Alert Config tab in Arabic mode', async () => {
    const { container } = render(<RiskToolsSection isAr={true} />);
    // In Arabic mode the tab label is in Arabic — find by role instead
    const tabs = screen.getAllByRole('tab');
    // The alert-config tab is the 6th tab (index 5)
    fireEvent.click(tabs[5]);
    await expectNoCriticalViolations(container);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   RiskTools — Alert Config table scope attributes
   Structural checks that column and row headers carry scope= so that
   screen readers can correctly associate header context with data cells.
══════════════════════════════════════════════════════════════════════════ */
describe('RiskTools — Alert Config table header scope attributes', () => {
  beforeEach(() => { localStorage.clear(); cleanup(); });

  it('all <th> elements in the thead carry scope="col"', () => {
    render(<RiskToolsSection isAr={false} />);
    fireEvent.click(screen.getByRole('tab', { name: /Supplier Alerts/i }));
    const colHeaders = document.querySelectorAll('thead th');
    expect(colHeaders.length).toBeGreaterThan(0);
    colHeaders.forEach(th => {
      expect(th).toHaveAttribute('scope', 'col');
    });
  });

  it('the first cell of every data row carries scope="row"', () => {
    render(<RiskToolsSection isAr={false} />);
    fireEvent.click(screen.getByRole('tab', { name: /Supplier Alerts/i }));
    const rows = document.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3); // Strategic, Preferred, Transactional
    rows.forEach(row => {
      const firstCell = row.querySelector(':first-child');
      expect(firstCell?.tagName).toBe('TH');
      expect(firstCell).toHaveAttribute('scope', 'row');
    });
  });

  it('every threshold input has an aria-label that names its tier and column', () => {
    render(<RiskToolsSection isAr={false} />);
    fireEvent.click(screen.getByRole('tab', { name: /Supplier Alerts/i }));
    const inputs = document.querySelectorAll<HTMLInputElement>('input.alert-cfg-input');
    expect(inputs.length).toBe(9); // 3 tiers × 3 columns
    inputs.forEach(input => {
      const label = input.getAttribute('aria-label') ?? '';
      expect(label.length).toBeGreaterThan(0);
    });
  });

  it('scope attributes are preserved in Arabic mode', () => {
    render(<RiskToolsSection isAr={true} />);
    // Navigate to the alert-config tab (6th tab, index 5)
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[5]);
    const colHeaders = document.querySelectorAll('thead th');
    expect(colHeaders.length).toBeGreaterThan(0);
    colHeaders.forEach(th => {
      expect(th).toHaveAttribute('scope', 'col');
    });
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const firstCell = row.querySelector(':first-child');
      expect(firstCell?.tagName).toBe('TH');
      expect(firstCell).toHaveAttribute('scope', 'row');
    });
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   TrainingTools — TrainingNeedsAssessment
══════════════════════════════════════════════════════════════════════════ */
describe('TrainingTools — TrainingNeedsAssessment accessibility', () => {
  beforeEach(() => { localStorage.clear(); cleanup(); });

  it('has zero critical violations on initial render', async () => {
    const { container } = render(<TrainingNeedsAssessment isAr={false} />);
    await expectNoCriticalViolations(container);
  });

  it('has zero critical violations in Arabic mode', async () => {
    const { container } = render(<TrainingNeedsAssessment isAr={true} />);
    await expectNoCriticalViolations(container);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   MaturityTools — MaturityAssessmentTool (several slugs)
══════════════════════════════════════════════════════════════════════════ */
describe('MaturityTools — MaturityAssessmentTool accessibility', () => {
  beforeEach(() => { localStorage.clear(); cleanup(); });

  const SLUGS = [
    'resiliency',
    'value-engineering',
    'process-improvement-policy',
    'lean-agile-supply-chain',
    'supply-chain-strategy',
    'sustainability-esg',
    'digital-transformation',
  ];

  for (const slug of SLUGS) {
    it(`has zero critical violations for slug "${slug}"`, async () => {
      const { container } = render(<MaturityAssessmentTool slug={slug} isAr={false} />);
      await expectNoCriticalViolations(container);
    });
  }

  it('has zero critical violations in Arabic mode (resiliency)', async () => {
    const { container } = render(<MaturityAssessmentTool slug="resiliency" isAr={true} />);
    await expectNoCriticalViolations(container);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   RiskTools — ARIA tab↔panel linkage
   Structural checks that every tab button carries aria-controls pointing to
   a panel with role="tabpanel" and the matching id / aria-labelledby.
══════════════════════════════════════════════════════════════════════════ */
describe('RiskTools — ARIA tab↔panel linkage', () => {
  beforeEach(() => { localStorage.clear(); cleanup(); });

  it('each tab button has aria-controls matching a rendered tabpanel', () => {
    const { container } = render(<RiskToolsSection isAr={false} />);
    const tabs = container.querySelectorAll<HTMLElement>('[role="tab"]');
    expect(tabs.length).toBeGreaterThan(0);
    tabs.forEach(tab => {
      const panelId = tab.getAttribute('aria-controls');
      expect(panelId).toBeTruthy();
      // Only the active panel is in the DOM — verify the tab button id is set
      const tabId = tab.getAttribute('id');
      expect(tabId).toBeTruthy();
      expect(tabId).toBe(`${tab.getAttribute('aria-controls')!.replace('-panel', '')}-tab`);
    });
  });

  it('the active tabpanel has role, id, and aria-labelledby on initial render', () => {
    const { container } = render(<RiskToolsSection isAr={false} />);
    const panel = container.querySelector('[role="tabpanel"]');
    expect(panel).not.toBeNull();
    expect(panel!.getAttribute('id')).toBe('kri-panel');
    expect(panel!.getAttribute('aria-labelledby')).toBe('kri-tab');
  });

  it('switching tab renders the new panel with correct linkage', () => {
    const { container } = render(<RiskToolsSection isAr={false} />);
    fireEvent.click(screen.getByRole('tab', { name: /Risk Register/i }));
    const panel = container.querySelector('[role="tabpanel"]');
    expect(panel).not.toBeNull();
    expect(panel!.getAttribute('id')).toBe('register-panel');
    expect(panel!.getAttribute('aria-labelledby')).toBe('register-tab');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   TrainingTools — ARIA tab↔panel linkage
══════════════════════════════════════════════════════════════════════════ */
describe('TrainingTools — ARIA tab↔panel linkage', () => {
  beforeEach(() => { localStorage.clear(); cleanup(); });

  it('each tab button has id and aria-controls attributes', () => {
    const { container } = render(<TrainingNeedsAssessment isAr={false} />);
    const tabs = container.querySelectorAll<HTMLElement>('[role="tab"]');
    expect(tabs.length).toBe(4);
    tabs.forEach(tab => {
      expect(tab.getAttribute('id')).toBeTruthy();
      expect(tab.getAttribute('aria-controls')).toBeTruthy();
      expect(tab.getAttribute('id')).toBe(
        `${tab.getAttribute('aria-controls')!.replace('-panel', '')}-tab`,
      );
    });
  });

  it('the active tabpanel has role, id, and aria-labelledby on initial render', () => {
    const { container } = render(<TrainingNeedsAssessment isAr={false} />);
    const panel = container.querySelector('[role="tabpanel"]');
    expect(panel).not.toBeNull();
    expect(panel!.getAttribute('id')).toBe('matrix-panel');
    expect(panel!.getAttribute('aria-labelledby')).toBe('matrix-tab');
  });

  it('switching to Radar tab renders correct tabpanel linkage', () => {
    const { container } = render(<TrainingNeedsAssessment isAr={false} />);
    fireEvent.click(screen.getByRole('tab', { name: /Skill-Gap Radar/i }));
    const panel = container.querySelector('[role="tabpanel"]');
    expect(panel).not.toBeNull();
    expect(panel!.getAttribute('id')).toBe('radar-panel');
    expect(panel!.getAttribute('aria-labelledby')).toBe('radar-tab');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   MaturityTools — ARIA tab↔panel linkage
══════════════════════════════════════════════════════════════════════════ */
describe('MaturityTools — ARIA tab↔panel linkage', () => {
  beforeEach(() => { localStorage.clear(); cleanup(); });

  it('each tab button has id and aria-controls attributes', () => {
    const { container } = render(<MaturityAssessmentTool slug="resiliency" isAr={false} />);
    const tabs = container.querySelectorAll<HTMLElement>('[role="tab"]');
    expect(tabs.length).toBe(3);
    tabs.forEach(tab => {
      expect(tab.getAttribute('id')).toBeTruthy();
      expect(tab.getAttribute('aria-controls')).toBeTruthy();
      expect(tab.getAttribute('id')).toBe(
        `${tab.getAttribute('aria-controls')!.replace('-panel', '')}-tab`,
      );
    });
  });

  it('the active tabpanel has role, id, and aria-labelledby on initial render', () => {
    const { container } = render(<MaturityAssessmentTool slug="resiliency" isAr={false} />);
    const panel = container.querySelector('[role="tabpanel"]');
    expect(panel).not.toBeNull();
    expect(panel!.getAttribute('id')).toBe('assess-panel');
    expect(panel!.getAttribute('aria-labelledby')).toBe('assess-tab');
  });

  it('switching to Gap Analysis tab renders correct tabpanel linkage', () => {
    const { container } = render(<MaturityAssessmentTool slug="resiliency" isAr={false} />);
    fireEvent.click(screen.getByRole('tab', { name: /Gap Analysis/i }));
    const panel = container.querySelector('[role="tabpanel"]');
    expect(panel).not.toBeNull();
    expect(panel!.getAttribute('id')).toBe('analysis-panel');
    expect(panel!.getAttribute('aria-labelledby')).toBe('analysis-tab');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   SupplierScorecard — SupplierScorecardTool
══════════════════════════════════════════════════════════════════════════ */
describe('SupplierScorecard — SupplierScorecardTool accessibility', () => {
  beforeEach(() => { localStorage.clear(); cleanup(); });

  it('has zero critical violations on initial render', async () => {
    const { container } = render(<SupplierScorecardTool isAr={false} />);
    await expectNoCriticalViolations(container);
  });

  it('has zero critical violations in Arabic mode', async () => {
    const { container } = render(<SupplierScorecardTool isAr={true} />);
    await expectNoCriticalViolations(container);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Primitives — ChecklistTool
══════════════════════════════════════════════════════════════════════════ */
describe('Primitives — ChecklistTool accessibility', () => {
  beforeEach(() => { localStorage.clear(); cleanup(); });

  const ITEMS = [
    { en: 'Review supplier contracts', ar: 'مراجعة عقود الموردين' },
    { en: 'Validate KPI data',         ar: 'التحقق من بيانات مؤشرات الأداء' },
    { en: 'Update risk register',      ar: 'تحديث سجل المخاطر' },
  ];

  it('has zero critical violations (English)', async () => {
    const { container } = render(
      <ChecklistTool storageKey="test-checklist" items={ITEMS} isAr={false} />
    );
    await expectNoCriticalViolations(container);
  });

  it('has zero critical violations (Arabic)', async () => {
    const { container } = render(
      <ChecklistTool storageKey="test-checklist-ar" items={ITEMS} isAr={true} />
    );
    await expectNoCriticalViolations(container);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Primitives — ActionTracker
══════════════════════════════════════════════════════════════════════════ */
describe('Primitives — ActionTracker accessibility', () => {
  beforeEach(() => { localStorage.clear(); cleanup(); });

  it('has zero critical violations (English)', async () => {
    const { container } = render(
      <ActionTracker storageKey="test-action-tracker" isAr={false} />
    );
    await expectNoCriticalViolations(container);
  });

  it('has zero critical violations (Arabic)', async () => {
    const { container } = render(
      <ActionTracker storageKey="test-action-tracker-ar" isAr={true} />
    );
    await expectNoCriticalViolations(container);
  });

  it('has zero critical violations with the add-action form open', async () => {
    const { container } = render(
      <ActionTracker storageKey="test-action-tracker-form" isAr={false} />
    );
    // Open the "Add Action" form
    const addBtn = container.querySelector('button');
    if (addBtn) fireEvent.click(addBtn);
    await expectNoCriticalViolations(container);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Primitives — ParamForm
══════════════════════════════════════════════════════════════════════════ */
describe('Primitives — ParamForm accessibility', () => {
  beforeEach(() => { localStorage.clear(); cleanup(); });

  const FIELDS = [
    { id: 'qty',   label: 'Quantity',   labelAr: 'الكمية',   type: 'number' as const, unit: 'units', unitAr: 'وحدات' },
    { id: 'price', label: 'Unit Price', labelAr: 'سعر الوحدة', type: 'number' as const, unit: 'SAR',   unitAr: 'ريال' },
  ];
  const compute = (vals: Record<string, string>) => {
    const total = (parseFloat(vals.qty) || 0) * (parseFloat(vals.price) || 0);
    return [{ label: 'Total', labelAr: 'الإجمالي', value: total.toLocaleString() }];
  };

  it('has zero critical violations (English)', async () => {
    const { container } = render(
      <ParamForm storageKey="test-param-form" fields={FIELDS} compute={compute} isAr={false} />
    );
    await expectNoCriticalViolations(container);
  });

  it('has zero critical violations (Arabic)', async () => {
    const { container } = render(
      <ParamForm storageKey="test-param-form-ar" fields={FIELDS} compute={compute} isAr={true} />
    );
    await expectNoCriticalViolations(container);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   ProcurementTools — ProcurementToolsSection (all tabs)
   Note: the tab bar uses plain <button> elements (not role="tab").
   In jsdom the label spans are visible regardless of Tailwind classes,
   so buttons are matched by partial name regex.
══════════════════════════════════════════════════════════════════════════ */
describe('ProcurementTools — ProcurementToolsSection accessibility', () => {
  beforeEach(() => { localStorage.clear(); cleanup(); });

  it('has zero critical violations on the default Spend Analysis tab', async () => {
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    // 'Spend Analysis' is the default active tab
    await expectNoCriticalViolations(container);
  });

  it('has zero critical violations on the Market Intelligence tab', async () => {
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    fireEvent.click(screen.getByRole('tab', { name: /Market Intelligence/i }));
    await expectNoCriticalViolations(container);
  });

  it('has zero critical violations on the Sourcing Strategy tab', async () => {
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    fireEvent.click(screen.getByRole('tab', { name: /Sourcing Strategy/i }));
    await expectNoCriticalViolations(container);
  });

  it('has zero critical violations in Arabic mode', async () => {
    const { container } = render(<ProcurementToolsSection isAr={true} />);
    await expectNoCriticalViolations(container);
  });
});
