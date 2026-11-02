/**
 * Round B5 UI tests: playbook, supplier-view and GCC blocks, evidence ledger, report pack.
 * Real clicks in both languages. Honesty checks: nothing is guessed, GCC rules hidden for private sector,
 * unconfirmed claims never shown as values.
 */
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { KraljicPlaybookPanel } from './KraljicPlaybookPanel';
import { KraljicSupplierExtras, emptyExtras, type SupplierExtras } from './KraljicSupplierExtras';
import { KraljicEvidencePanel } from './KraljicEvidencePanel';
import { KraljicReportPack } from './KraljicReportPack';
import type { LedgerEntry } from '@/lib/kraljicLedger';
import { emptyOutcome } from '@/lib/kraljicLedger';

afterEach(cleanup);

function Harness({ isAr = false, quadrant = 'bottleneck' as const, alt = 3 }: { isAr?: boolean; quadrant?: 'bottleneck'; alt?: number }) {
  const [e, setE] = React.useState<SupplierExtras>(emptyExtras());
  return <KraljicSupplierExtras isAr={isAr} quadrant={quadrant} qualifiedAlternatives={alt} extras={e} onChange={setE} />;
}

describe('playbook tab', () => {
  it('shows five headings and switches sub-type (EN)', () => {
    render(<KraljicPlaybookPanel isAr={false} />);
    expect(screen.getByText('1. Objective')).toBeTruthy();
    expect(screen.getByText('5. Monitoring and exit')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /locked/i }));
    expect(screen.getAllByText(/Secure and contain/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('ISC design choice').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sourced').length).toBeGreaterThan(0);
  });
  it('renders Arabic headings and the guardrails (AR)', () => {
    render(<KraljicPlaybookPanel isAr />);
    expect(screen.getByText('1. الهدف')).toBeTruthy();
    expect(screen.getByText('ضوابط الاستخدام')).toBeTruthy();
    expect(screen.getAllByText('اختيار تصميمي من ISC').length).toBeGreaterThan(0);
  });
});

describe('supplier view and GCC block', () => {
  it('asks instead of guessing, then gives a cue and flags missing evidence', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText(/How the supplier sees us/));
    expect(screen.getByText(/ISC does not guess/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Our account value to the supplier/), { target: { value: 'low' } });
    fireEvent.change(screen.getByLabelText(/How attractive our account is/), { target: { value: 'low' } });
    expect(screen.getByText(/The supplier sees us as/)).toBeTruthy();
    expect(screen.getByText(/No evidence recorded/)).toBeTruthy();
    expect(screen.getAllByText(/phase you out/).length).toBeGreaterThan(0);
  });
  it('private sector hides government rules; Saudi shows them with the not-confirmed warning', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText(/GCC modifiers/));
    expect(screen.getByText(/Choose a government buyer/)).toBeTruthy();
    expect(screen.queryByText('Price preference (dated values)')).toBeNull();
    fireEvent.change(screen.getByLabelText(/Buyer type/), { target: { value: 'saudi-gov' } });
    expect(screen.getByText('Price preference (dated values)')).toBeTruthy();
    expect(screen.getByText(/In-force status is not confirmed/)).toBeTruthy();
    expect(screen.queryAllByText(/Qatar.*15%/).every((e) => !!e.closest('li') && /not confirmed|not stated|unconfirmed/i.test(e.closest('ul')?.parentElement?.textContent ?? ''))).toBe(true);
  });
  it('Mandatory List reduces the eligible alternatives and says so', () => {
    render(<Harness alt={3} />);
    fireEvent.click(screen.getByText(/GCC modifiers/));
    fireEvent.change(screen.getByLabelText(/Buyer type/), { target: { value: 'saudi-gov' } });
    fireEvent.change(screen.getByLabelText(/Mandatory List of National Products\?/), { target: { value: 'y' } });
    fireEvent.change(screen.getByLabelText(/qualified alternatives are national/), { target: { value: '1' } });
    expect(screen.getByText(/1 of 3 alternatives are eligible/)).toBeTruthy();
  });
  it('direct procurement above the ceiling is flagged', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText(/GCC modifiers/));
    fireEvent.change(screen.getByLabelText(/Buyer type/), { target: { value: 'saudi-gov' } });
    fireEvent.change(screen.getByLabelText(/Planned method/), { target: { value: 'direct' } });
    fireEvent.change(screen.getByLabelText(/Estimated value \(SAR\)/), { target: { value: '2000000' } });
    expect(screen.getByText(/Above the SAR 1,000,000/)).toBeTruthy();
  });
  it('Arabic renders for the same blocks', () => {
    render(<Harness isAr />);
    fireEvent.click(screen.getByText(/معدِّلات الخليج/));
    expect(screen.getByText(/اختر جهة حكومية/)).toBeTruthy();
  });
});

const entry = (o: Partial<LedgerEntry> & Pick<LedgerEntry, 'id' | 'supplierId' | 'dateIso' | 'quadrant'>): LedgerEntry => ({
  subtype: null, riskPct: null, profitPct: null, mode: 'manual', reviewer: '', version: 'x', trigger: null, persistence: null, hysteresisCount: null,
  outcome: emptyOutcome(), metricName: '', pre: null, post: null, note: '', ...o,
});

describe('evidence tab', () => {
  const sups = [{ supplierId: 'a', name: 'Alpha Co', quadrant: 'bottleneck' as const, subtype: 'bottleneck-movable' }];
  it('records an entry and keeps cost avoidance out of savings', () => {
    const added: LedgerEntry[] = [];
    render(<KraljicEvidencePanel isAr={false} suppliers={sups} entries={[]} asOfIso="2026-11-02" onAdd={(e) => added.push(e)} onRemove={() => {}} />);
    fireEvent.change(screen.getByLabelText(/Declared baseline price/), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/Full-year saving/, { selector: 'input' }), { target: { value: '200' } });
    fireEvent.change(screen.getByLabelText(/Cost avoidance/, { selector: 'input' }), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save entry' }));
    expect(added.length).toBe(1);
    expect(added[0].outcome.baselinePrice).toBe(10); expect(added[0].outcome.costAvoidance).toBe(50); expect(added[0].supplierId).toBe('a');
  });
  it('savings calculator separates saving and avoidance, and calls a rise an increase', () => {
    render(<KraljicEvidencePanel isAr={false} suppliers={sups} entries={[]} asOfIso="2026-11-02" onAdd={() => {}} onRemove={() => {}} />);
    fireEvent.change(screen.getByLabelText('Baseline unit price'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('New unit price'), { target: { value: '11' } });
    fireEvent.change(screen.getByLabelText('Annual volume'), { target: { value: '100' } });
    expect(screen.getByText('A price increase, not a saving')).toBeTruthy();
  });
  it('source ledger shows unconfirmed claims as unconfirmed and the wording pack discloses Arabic status', () => {
    render(<KraljicEvidencePanel isAr={false} suppliers={sups} entries={[]} asOfIso="2026-11-02" onAdd={() => {}} onRemove={() => {}} />);
    expect(screen.getAllByText('Not confirmed: not stated').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/not certified by a human/).length).toBeGreaterThan(0);
    expect(screen.getByText(/كراجيك/)).toBeTruthy();
  });
  it('shows stability and moved-out-of-bottleneck from history', () => {
    const es = [entry({ id: '1', supplierId: 'a', dateIso: '2026-01-01', quadrant: 'bottleneck' }), entry({ id: '2', supplierId: 'a', dateIso: '2026-06-01', quadrant: 'non-critical', trigger: 'event' })];
    render(<KraljicEvidencePanel isAr={false} suppliers={sups} entries={es} asOfIso="2026-11-02" onAdd={() => {}} onRemove={() => {}} />);
    const card = screen.getByText('Items moved out of Bottleneck').closest('div') as HTMLElement;
    expect(within(card).getByText('1')).toBeTruthy();
    expect(screen.getAllByText(/Alpha Co/).length).toBeGreaterThan(0);
  });
  it('Arabic renders', () => {
    render(<KraljicEvidencePanel isAr suppliers={sups} entries={[]} asOfIso="2026-11-02" onAdd={() => {}} onRemove={() => {}} />);
    expect(screen.getByText('الأدلة والقياس')).toBeTruthy();
    expect(screen.getByText('سجل المصادر')).toBeTruthy();
  });
});

describe('report pack', () => {
  it('draws one bubble per supplier and says how many are not scored', () => {
    const items = [{ supplierId: 'a', name: 'Alpha', quadrant: 'bottleneck' as const, spendSAR: 100, latest: null }, { supplierId: 'b', name: 'Beta', quadrant: 'leverage' as const, spendSAR: null, latest: { riskPct: 20, profitPct: 80 } }];
    const { container } = render(<KraljicReportPack isAr={false} items={items} entries={[]} nameOf={(id) => id} />);
    expect(container.querySelectorAll('svg circle').length).toBe(2);
    expect(screen.getByText(/1 bubbles not scored/)).toBeTruthy();
    expect(screen.getByText(/No movements recorded yet/)).toBeTruthy();
    expect(screen.getByText(/Items that need total cost of ownership/)).toBeTruthy();
  });
});
