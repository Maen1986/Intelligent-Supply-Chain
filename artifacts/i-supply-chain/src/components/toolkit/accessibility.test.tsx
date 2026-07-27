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

  it('has zero critical violations on initial render', async () => {
    const { container } = render(<RiskToolsSection isAr={false} />);
    await expectNoCriticalViolations(container);
  });

  it('has zero critical violations in Arabic mode', async () => {
    const { container } = render(<RiskToolsSection isAr={true} />);
    await expectNoCriticalViolations(container);
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
    fireEvent.click(screen.getByRole('button', { name: /Market Intelligence/i }));
    await expectNoCriticalViolations(container);
  });

  it('has zero critical violations on the Sourcing Strategy tab', async () => {
    const { container } = render(<ProcurementToolsSection isAr={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Sourcing Strategy/i }));
    await expectNoCriticalViolations(container);
  });

  it('has zero critical violations in Arabic mode', async () => {
    const { container } = render(<ProcurementToolsSection isAr={true} />);
    await expectNoCriticalViolations(container);
  });
});
