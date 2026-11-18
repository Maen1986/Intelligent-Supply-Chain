import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { RegionalMeasures } from '../RegionalMeasures';
import { REGIONAL_INDICATORS } from '@/lib/regionalIndicators';
import { REGIONAL_INDICATORS_AR } from '@/lib/regionalIndicatorsAr';

afterEach(() => cleanup());
const ARABIC = /[\u0600-\u06FF]/;

describe('RegionalMeasures (#892)', () => {
  it('has an Arabic entry for every indicator, with parameter text where a status exists', () => {
    for (const r of REGIONAL_INDICATORS) {
      const a = REGIONAL_INDICATORS_AR[r.id];
      expect(a, r.id).toBeDefined();
      for (const v of [a.indicator, a.formula, a.unit, a.frequency, a.rule]) expect(v).toMatch(ARABIC);
      if (r.parameterStatus !== 'none') expect(a.parameter, r.id).toMatch(ARABIC);
    }
  });
  it('renders 6 groups and 19 indicators in English with no state labels', () => {
    const { container } = render(<RegionalMeasures isAr={false} />);
    expect(screen.getByTestId('regional-measures')).toBeTruthy();
    expect(container.querySelectorAll('[data-testid^="regional-group-"]')).toHaveLength(6);
    expect(screen.getAllByTestId('regional-indicator')).toHaveLength(19);
    expect(screen.getAllByText('ISC definition')).toHaveLength(19);
    expect(screen.getAllByTestId('param-unconfirmed')).toHaveLength(2);
    expect(screen.getAllByTestId('param-partly')).toHaveLength(2);
    for (const w of ['Healthy', 'Watch', 'High attention']) expect(container.textContent).not.toContain(w);
  });
  it('renders Arabic, rtl, same counts', () => {
    const { container } = render(<RegionalMeasures isAr />);
    expect(screen.getByTestId('regional-measures').getAttribute('dir')).toBe('rtl');
    expect(screen.getAllByTestId('regional-indicator')).toHaveLength(19);
    expect(screen.getAllByText('تعريف آي سبلاي تشين')).toHaveLength(19);
    expect(container.textContent).toMatch(ARABIC);
    expect(container.textContent).not.toContain('ISC definition');
  });
  it('is collapsed by default', () => {
    const { container } = render(<RegionalMeasures isAr={false} />);
    const outer = container.querySelector('section > details') as HTMLDetailsElement;
    expect(outer.open).toBe(false);
  });
});
