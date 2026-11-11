import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { TierBadgeSlot } from './TierBadgeSlot';
import { TIER_STRINGS } from './tierStrings';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('TierBadgeSlot: no tier data means no change', () => {
  it.each([undefined, null])('renders nothing for record=%s', (rec) => {
    const { container } = render(<TierBadgeSlot record={rec} lang="en" />);
    expect(container.innerHTML).toBe('');
  });
  it('renders nothing in Arabic with no record', () => {
    const { container } = render(<TierBadgeSlot record={undefined} lang="ar" />);
    expect(container.innerHTML).toBe('');
  });
});

describe('TierBadgeSlot: with a record it is the X-01 TierBadge', () => {
  it('Tier 1 shows the exact label (EN)', () => {
    const { container } = render(<TierBadgeSlot lang="en" record={{ tier: 1, basis: 'Primary text', confirmedBy: 'A. Smith, Counsel', confirmedOn: '2026-11-09' }} />);
    expect(container).toHaveTextContent(TIER_STRINGS.t1.en);
    expect(container.querySelector('button')).not.toBeNull();
  });
  it('Tier 1 shows the exact label (AR) with rtl', () => {
    const { container } = render(<TierBadgeSlot lang="ar" record={{ tier: 1, basis: 'نص', confirmedBy: 'خبير', confirmedOn: '2026-11-09' }} />);
    expect(container).toHaveTextContent(TIER_STRINGS.t1.ar);
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull();
  });
  it.each(['en', 'ar'] as const)('incomplete record shows Tier 3 label, prompt and the reason line [%s] (decision a)', (lang) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<TierBadgeSlot lang={lang} record={{ tier: 1, basis: 'only a basis' }} />);
    expect(container).toHaveTextContent(TIER_STRINGS.t3[lang]);
    expect(container).toHaveTextContent(TIER_STRINGS.t3_prompt[lang]);
    expect(container).toHaveTextContent(TIER_STRINGS.insufficient[lang]);
  });
  it('tier 3 record with no data shows the prompt', () => {
    const { container } = render(<TierBadgeSlot lang="en" record={{ tier: 3 }} />);
    expect(container).toHaveTextContent(TIER_STRINGS.t3_prompt.en);
  });
  it('passes className to the badge root', () => {
    const { container } = render(<TierBadgeSlot lang="en" className="mt-4" record={{ tier: 3 }} />);
    expect(container.querySelector('.mt-4')).not.toBeNull();
  });
  it('the old evidence badge is not used: no evidence-tier text', () => {
    const { container } = render(<TierBadgeSlot lang="en" record={{ tier: 3 }} />);
    expect(container.textContent).not.toMatch(/self.reported|consultant.validated/i);
  });
});
