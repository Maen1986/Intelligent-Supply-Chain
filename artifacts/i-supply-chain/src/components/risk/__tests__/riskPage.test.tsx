/**
 * Interactive Risk Management page (backlog #882): data integrity and behaviour, EN and AR.
 */
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { RiskPictureExplorer } from '../RiskPictureExplorer';
import { GovernanceSelfCheck } from '../GovernanceSelfCheck';
import { RiskKpiBoard } from '../RiskKpiBoard';
import { HeatMapCellPanel } from '../HeatMapCellPanel';
import { WorldwideExamples } from '../WorldwideExamples';
import { IsoStageBar } from '../IsoStageBar';
import { HEAT_MAP_RISKS, SAMPLE_RISKS, SECTORS, WORLDWIDE, GOV_TIERS, KPI_DEFS, ISO_STAGE_BY_TAB, bandView, kpiState, tierState } from '@/lib/riskPageData';

afterEach(() => cleanup());

const ARABIC = /[؀-ۿ]/;
const cats = Array.from({ length: 8 }, (_, i) => ({ response: `Response ${i}`, responseAr: `استجابة ${i}` }));

describe('riskPageData integrity', () => {
  it('has 12 sample risks with valid scales and a category index 0-7', () => {
    expect(HEAT_MAP_RISKS).toHaveLength(12);
    for (const r of HEAT_MAP_RISKS) {
      expect(r.l).toBeGreaterThanOrEqual(1); expect(r.l).toBeLessThanOrEqual(5);
      expect(r.i).toBeGreaterThanOrEqual(1); expect(r.i).toBeLessThanOrEqual(5);
      expect(r.cat).toBeGreaterThanOrEqual(0); expect(r.cat).toBeLessThanOrEqual(7);
      expect(r.nameAr).toMatch(ARABIC);
    }
  });
  it('has the 20-risk explorer pool: the 12 heat-map risks plus 8 new, ids R1 to R20', () => {
    expect(SAMPLE_RISKS).toHaveLength(20);
    expect(new Set(SAMPLE_RISKS.map(r => r.id)).size).toBe(20);
    for (let n = 1; n <= 20; n++) expect(SAMPLE_RISKS.some(r => r.id === `R${n}`)).toBe(true);
    for (const r of SAMPLE_RISKS) {
      expect(r.l).toBeGreaterThanOrEqual(1); expect(r.l).toBeLessThanOrEqual(5);
      expect(r.i).toBeGreaterThanOrEqual(1); expect(r.i).toBeLessThanOrEqual(5);
      expect(r.cat).toBeGreaterThanOrEqual(0); expect(r.cat).toBeLessThanOrEqual(7);
      expect(r.nameAr).toMatch(ARABIC);
    }
  });
  it('every sector picks ten distinct pool risks and carries an evidence note with Arabic and https sources', () => {
    for (const s of SECTORS) {
      expect(s.picks).toHaveLength(10);
      expect(new Set(s.picks).size).toBe(10);
      for (const id of s.picks) expect(SAMPLE_RISKS.some(r => r.id === id)).toBe(true);
      expect(s.ar).toMatch(ARABIC);
      expect(s.evidence.note.en.length).toBeGreaterThan(20);
      expect(s.evidence.note.ar).toMatch(ARABIC);
      expect(s.evidence.sources.length).toBeGreaterThan(0);
      for (const src of s.evidence.sources) expect(src.url).toMatch(/^https:\/\//);
    }
  });
  it('no two sectors show the same set of ten risks', () => {
    const keys = SECTORS.map(s => [...s.picks].sort().join(','));
    expect(new Set(keys).size).toBe(SECTORS.length);
  });
  it('has worldwide examples for all eight categories, each with year, https source and Arabic', () => {
    expect(WORLDWIDE).toHaveLength(8);
    for (const list of WORLDWIDE) {
      expect(list.length).toBeGreaterThan(0);
      for (const x of list) {
        expect(x.url).toMatch(/^https:\/\//);
        expect(x.year).toMatch(/^(19|20)\d\d$/);
        expect(x.sourceName.length).toBeGreaterThan(3);
        expect(x.ar).toMatch(ARABIC);
      }
    }
  });
  it('uses the agreed band names and thresholds', () => {
    expect(bandView(4).en).toBe('Low'); expect(bandView(5).en).toBe('Watch');
    expect(bandView(9).en).toBe('Watch'); expect(bandView(10).en).toBe('Act');
    expect(bandView(14).en).toBe('Act'); expect(bandView(15).en).toBe('Urgent');
    expect(bandView(15).ar).toBe('عاجل'); expect(bandView(10).ar).toBe('تحرّك'); expect(bandView(5).ar).toBe('مراقبة');
  });
  it('status rules are exact at the boundaries', () => {
    expect(kpiState(95, 95)).toBe('healthy'); expect(kpiState(85, 95)).toBe('watch');
    expect(kpiState(84.9, 95)).toBe('attention'); expect(kpiState(null, 95)).toBe('none');
    expect(tierState(4, 4)).toBe('healthy'); expect(tierState(2, 4)).toBe('watch');
    expect(tierState(1, 4)).toBe('attention'); expect(tierState(0, 0)).toBe('none');
  });
  it('has Arabic for every governance item, KPI and ISO stage', () => {
    for (const t of GOV_TIERS) { expect(t.ar).toMatch(ARABIC); for (const it of t.items) expect(it.ar).toMatch(ARABIC); }
    expect(KPI_DEFS).toHaveLength(6);
    for (const k of KPI_DEFS) { expect(k.name.ar).toMatch(ARABIC); expect(k.meaning.ar).toMatch(ARABIC); expect(k.next.ar).toMatch(ARABIC); }
    expect(ISO_STAGE_BY_TAB).toHaveLength(7);
    for (const s of ISO_STAGE_BY_TAB) expect(s.ar).toMatch(ARABIC);
  });
  it('has no old band word in governance items', () => {
    for (const t of GOV_TIERS) for (const it of t.items) expect(it.en).not.toMatch(/Critical/);
  });
});

describe('RiskPictureExplorer', () => {
  const active = () => Array.from(document.querySelectorAll('[data-testid="risk-dot"][data-active="true"]'));
  it('shows ten ranked risks and a board preview, and changes with the sector', () => {
    render(<RiskPictureExplorer isAr={false} categories={cats} onOpenToolkit={() => {}} />);
    expect(active()).toHaveLength(10);
    expect(screen.getAllByTestId('rank-row')).toHaveLength(10);
    const general = screen.getAllByTestId('rank-row').map(r => r.textContent).join('|');
    fireEvent.click(screen.getByRole('button', { name: 'Healthcare & Pharma' }));
    expect(active()).toHaveLength(10);
    expect(screen.getAllByTestId('rank-row')).toHaveLength(10);
    expect(screen.getAllByTestId('rank-row').map(r => r.textContent).join('|')).not.toBe(general);
    expect(screen.getByTestId('board-preview').textContent).toMatch(/Healthcare & Pharma/);
    expect(screen.getByTestId('board-preview').textContent).toMatch(/of 10 risks need action now/);
    expect(screen.getByText('Quality recall')).toBeTruthy();
    expect(Number(screen.getByTestId('act-now-count').textContent)).toBeGreaterThan(0);
  });
  it('ranks by score and keeps the act-now count equal to the Urgent plus Act bands', () => {
    render(<RiskPictureExplorer isAr={false} categories={cats} onOpenToolkit={() => {}} />);
    for (const s of SECTORS) {
      fireEvent.click(screen.getByRole('button', { name: s.en }));
      const scores = screen.getAllByTestId('rank-row').map(r => Number((r.textContent || '').match(/(\d+)$/)?.[1]));
      for (let i = 1; i < scores.length; i++) expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
      const band = (k: string) => Number(screen.queryByTestId(`band-${k}`)?.getAttribute('data-count') ?? 0);
      expect(Number(screen.getByTestId('act-now-count').textContent)).toBe(band('critical') + band('high'));
      expect(band('critical') + band('high') + band('medium') + band('low')).toBe(10);
    }
  });
  it('pins a risk to show its score and usual response, and unpins on a second press', () => {
    render(<RiskPictureExplorer isAr={false} categories={cats} onOpenToolkit={() => {}} />);
    expect(screen.getByTestId('risk-detail').textContent).toMatch(/Select a risk/);
    const row = screen.getAllByTestId('rank-row')[0];
    fireEvent.click(row);
    expect(screen.getByTestId('risk-detail').textContent).toMatch(/Likelihood \d × impact \d = \d+/);
    expect(screen.getByTestId('risk-detail').textContent).toMatch(/Usual response: Response \d/);
    fireEvent.click(row);
    expect(screen.getByTestId('risk-detail').textContent).toMatch(/Select a risk/);
  });
  it('names the sources behind each sector with a status, and says the order is judgement', () => {
    render(<RiskPictureExplorer isAr={false} categories={cats} onOpenToolkit={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Healthcare & Pharma' }));
    const ev = screen.getByTestId('sector-evidence');
    expect(ev.querySelectorAll('a[href^="https://"]').length).toBeGreaterThan(0);
    expect(ev.textContent).toMatch(/FDA/);
    expect(screen.getByTestId('evidence-status').textContent).toBe('Theme found in sources');
    expect(ev.textContent).toMatch(/order is ISC practitioner judgement/);
    fireEvent.click(screen.getByRole('button', { name: 'Construction / Real Estate' }));
    expect(screen.getByTestId('evidence-status').textContent).toBe('ISC judgement');
  });
  it('renders in Arabic and opens the toolkit', () => {
    const open = vi.fn();
    render(<RiskPictureExplorer isAr categories={cats} onOpenToolkit={open} />);
    expect(screen.getByTestId('risk-picture').textContent).toMatch(ARABIC);
    expect(screen.getByTestId('risk-picture').textContent).not.toMatch(/Critical/);
    fireEvent.click(screen.getByRole('button', { name: 'ابنِ صفحتي في الأدوات' }));
    expect(open).toHaveBeenCalledTimes(1);
  });
});

describe('GovernanceSelfCheck', () => {
  it('counts ticks per tier and lists the remaining gaps', () => {
    render(<GovernanceSelfCheck isAr={false} onRequestAssessment={() => {}} />);
    const total = GOV_TIERS.reduce((n, t) => n + t.items.length, 0);
    expect(screen.getByTestId('gov-gaps').querySelectorAll('li')).toHaveLength(total);
    const first = within(screen.getByTestId('gov-tier-0')).getAllByRole('checkbox');
    first.forEach(c => fireEvent.click(c));
    expect(screen.getByTestId('gov-count-0').textContent).toMatch(/4 \/ 4/);
    expect(within(screen.getByTestId('gov-tier-0')).getByText('Healthy')).toBeTruthy();
    expect(screen.getByTestId('gov-gaps').querySelectorAll('li')).toHaveLength(total - 4);
  });
  it('works in Arabic and fires the assessment request', () => {
    const go = vi.fn();
    render(<GovernanceSelfCheck isAr onRequestAssessment={go} />);
    expect(screen.getByTestId('gov-selfcheck').textContent).toMatch(ARABIC);
    fireEvent.click(screen.getByRole('button', { name: 'اطلب تقييم مخاطر' }));
    expect(go).toHaveBeenCalledTimes(1);
  });
});

describe('RiskKpiBoard', () => {
  it('opens on labelled example values, never empty, and shows six cards', () => {
    render(<RiskKpiBoard isAr={false} onOpenTab={() => {}} />);
    expect(screen.getByTestId('kpi-mode').textContent).toMatch(/Example values/);
    for (const k of KPI_DEFS) expect(screen.getByTestId(`kpi-${k.id}`)).toBeTruthy();
    expect(screen.getByTestId('kpi-state-rto').textContent).toBe('Watch');
    expect(screen.getByTestId('kpi-state-bcp').textContent).toBe('High attention');
  });
  it('clears examples, takes the visitor value and re-rates it', () => {
    render(<RiskKpiBoard isAr={false} onOpenTab={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear examples' }));
    expect(screen.getByTestId('kpi-state-coverage').textContent).toBe('No value');
    fireEvent.change(screen.getByLabelText('Your value', { selector: '#kpi-in-coverage' }), { target: { value: '96' } });
    expect(screen.getByTestId('kpi-state-coverage').textContent).toBe('Healthy');
  });
  it('links a weak KPI to the right tab, in Arabic too', () => {
    const open = vi.fn();
    render(<RiskKpiBoard isAr onOpenTab={open} />);
    expect(screen.getByTestId('risk-kpi-board').textContent).toMatch(ARABIC);
    fireEvent.click(within(screen.getByTestId('kpi-coverage')).getByRole('button', { name: 'افتح' }));
    expect(open).toHaveBeenCalledWith(4);
  });
});

describe('HeatMapCellPanel, WorldwideExamples, IsoStageBar', () => {
  it('lists all risks ranked, or only those in the selected cell, with a clear button', () => {
    const clear = vi.fn();
    const { rerender } = render(<HeatMapCellPanel cell={null} risks={HEAT_MAP_RISKS} isAr={false} onClear={clear} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(12);
    rerender(<HeatMapCellPanel cell="3-5" risks={HEAT_MAP_RISKS} isAr={false} onClear={clear} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getAllByText('Urgent').length).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(clear).toHaveBeenCalledTimes(1);
    rerender(<HeatMapCellPanel cell="1-1" risks={HEAT_MAP_RISKS} isAr={false} onClear={clear} />);
    expect(screen.getByText('No risks in this cell.')).toBeTruthy();
  });
  it('shows sourced worldwide examples with external links that are safe', () => {
    const reg = vi.fn(); const hm = vi.fn();
    render(<WorldwideExamples index={6} isAr={false} onOpenRegister={reg} onOpenHeatMap={hm} />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(WORLDWIDE[6].length);
    for (const a of links) { expect(a.getAttribute('rel')).toMatch(/noopener/); expect(a.getAttribute('target')).toBe('_blank'); }
    fireEvent.click(screen.getByRole('button', { name: 'Add to my register' })); expect(reg).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'See it on the heat map' })); expect(hm).toHaveBeenCalled();
  });
  it('names the ISO 31000 stage and says aligned, not certified', () => {
    render(<IsoStageBar isAr={false} tab={2} />);
    expect(screen.getByTestId('iso-stage').textContent).toMatch(/Risk evaluation/);
    expect(screen.getByTestId('iso-stage').textContent).toMatch(/not certified/);
    cleanup();
    render(<IsoStageBar isAr tab={6} />);
    expect(screen.getByTestId('iso-stage').textContent).toMatch(/المتابعة والمراجعة/);
  });
});
