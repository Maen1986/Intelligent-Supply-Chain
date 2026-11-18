import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { RiskPictureExplorer } from '../RiskPictureExplorer';
import { SECTORS, SAMPLE_RISKS } from '@/lib/riskPageData';
import { SECTOR_RISKS, EVIDENCE_KIND_LABEL, SOURCE_TYPE_LABEL } from '@/lib/sectorSpecificRisks';

afterEach(() => cleanup());
const ARABIC = /[\u0600-\u06FF]/;
const cats = Array.from({ length: 8 }, (_, i) => ({ response: `Response ${i}`, responseAr: `استجابة ${i}` }));
const INDUSTRY = SECTORS.filter(s => s.id !== 'general');

describe('sector-specific risks data (#890)', () => {
  it('has 64 unique risks, 8 per industry sector, none clashing with R1 to R20', () => {
    expect(SECTOR_RISKS).toHaveLength(64);
    expect(new Set(SECTOR_RISKS.map(r => r.id)).size).toBe(64);
    for (const s of INDUSTRY) expect(SECTOR_RISKS.filter(r => r.sectorId === s.id)).toHaveLength(8);
    for (const r of SECTOR_RISKS) expect(SAMPLE_RISKS.some(c => c.id === r.id)).toBe(false);
  });
  it('gives each risk valid scales, a category 0 to 7, Arabic, an evidence kind and a source type', () => {
    for (const r of SECTOR_RISKS) {
      expect(r.l).toBeGreaterThanOrEqual(1); expect(r.l).toBeLessThanOrEqual(5);
      expect(r.i).toBeGreaterThanOrEqual(1); expect(r.i).toBeLessThanOrEqual(5);
      expect(r.cat).toBeGreaterThanOrEqual(0); expect(r.cat).toBeLessThanOrEqual(7);
      expect(r.nameAr).toMatch(ARABIC);
      expect(EVIDENCE_KIND_LABEL[r.evidenceKind]).toBeDefined();
      expect(SOURCE_TYPE_LABEL[r.sourceType]).toBeDefined();
    }
  });
  it('each industry sector picks its own seven plus three common risks; reserve risks are not picked', () => {
    for (const s of INDUSTRY) {
      const own = s.picks.filter(id => !/^R\d+$/.test(id));
      const common = s.picks.filter(id => /^R\d+$/.test(id));
      expect(own).toHaveLength(7); expect(common).toHaveLength(3);
      for (const id of own) expect(SECTOR_RISKS.find(r => r.id === id)?.sectorId).toBe(s.id);
      for (const r of SECTOR_RISKS.filter(r => r.sectorId === s.id)) expect(s.picks.includes(r.id)).toBe(r.inTopTen);
    }
  });
  it('keeps General on the common risks only', () => {
    const g = SECTORS.find(s => s.id === 'general')!;
    expect(g.picks.every(id => /^R\d+$/.test(id))).toBe(true);
  });
});

describe('explorer shows sector-specific risks (#890)', () => {
  it('tags seven Sector-specific and three Common rows for Healthcare & Pharma', () => {
    render(<RiskPictureExplorer isAr={false} categories={cats} onOpenToolkit={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Healthcare & Pharma' }));
    const tags = screen.getAllByTestId('scope-tag').map(t => t.textContent);
    expect(tags.filter(t => t === 'Sector-specific')).toHaveLength(7);
    expect(tags.filter(t => t === 'Common')).toHaveLength(3);
    expect(screen.getAllByText(/Active ingredient \(API\)/).length).toBeGreaterThan(0);
  });
  it('shows the evidence kind and source type when a sector-specific risk is pinned', () => {
    render(<RiskPictureExplorer isAr={false} categories={cats} onOpenToolkit={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Oil & Gas / Energy' }));
    const row = screen.getAllByTestId('rank-row').find(r => /Long-lead equipment/.test(r.textContent || ''))!;
    fireEvent.click(row);
    expect(screen.getByTestId('risk-evidence').textContent).toMatch(/Market estimate/);
    expect(screen.getByTestId('risk-evidence').textContent).toMatch(/Analyst, press or industry body/);
  });
  it('does not show an evidence line for a common risk', () => {
    render(<RiskPictureExplorer isAr={false} categories={cats} onOpenToolkit={() => {}} />);
    fireEvent.click(screen.getAllByTestId('rank-row')[0]);
    expect(screen.queryByTestId('risk-evidence')).toBeNull();
  });
  it('renders in Arabic with Arabic tags and names', () => {
    render(<RiskPictureExplorer isAr categories={cats} onOpenToolkit={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'الأغذية والمشروبات' }));
    expect(screen.getAllByText('خاص بالقطاع').length).toBe(7);
    expect(screen.getAllByText('مشترك').length).toBe(3);
    expect(screen.getAllByText(/فقدان شهادة الحلال/).length).toBeGreaterThan(0);
  });
  it('shows ten ranked rows for every sector', () => {
    render(<RiskPictureExplorer isAr={false} categories={cats} onOpenToolkit={() => {}} />);
    for (const s of SECTORS) {
      fireEvent.click(screen.getByRole('button', { name: s.en }));
      expect(screen.getAllByTestId('rank-row')).toHaveLength(10);
    }
  });
});
