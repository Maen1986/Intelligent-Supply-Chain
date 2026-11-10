import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within, act } from '@testing-library/react';
import userEvent from './userEventLite';
import { TierBadge, NoTierNotice, accessibleName, shortBadgeName } from './TierBadge';
import { TIER_STRINGS, SR_STRINGS, SHORT_STRINGS, type Lang } from './tierStrings';
import { findForbiddenTier2Words } from './tierRecord';

const now = new Date('2026-11-10T12:00:00Z');
const T1 = { tier: 1 as const, basis: 'Saudi government procurement law', confirmedBy: 'Owner (SME, Saudi government procurement law)', confirmedOn: '2026-11-09', now };
const T1S = { tier: 1 as const, basis: 'Primary regulation text', source: 'MoF regulation page', sourceOpenedOn: '2026-11-08', now };
const T2 = { tier: 2 as const, basis: 'ISC desk review', source: 'DLA Piper GENIE page, V2', sourceOpenedOn: '2026-11-09', possibleAnswers: [{ text: 'Ban 12:00 to 15:00', source: 'DLA Piper', vLevel: 'V2' }], now };
const T3 = { tier: 3 as const, possibleAnswers: [{ text: 'Draft regulation of 2019 applies', source: 'MoF notice', vLevel: 'V2' }, 'Later Cabinet approval applies'], now };
const langs: Lang[] = ['en', 'ar'];

function mockPhone(matches: boolean) {
  window.matchMedia = ((q: string) => ({ matches, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as never;
}
afterEach(() => { delete (window as { matchMedia?: unknown }).matchMedia; vi.restoreAllMocks(); });

describe.each(langs)('three tiers render (soft) [%s]', (lang) => {
  it('Tier 1: exact label, basis and date visible; button; dir/lang', () => {
    const { container } = render(<TierBadge {...T1} lang={lang} />);
    const btn = screen.getByRole('button');
    expect(btn.tagName).toBe('BUTTON');
    expect(btn).toHaveTextContent(TIER_STRINGS.t1[lang]);
    expect(container.querySelector('[data-part="basis"]')).toHaveTextContent(T1.basis);
    expect(container.querySelector('[data-part="confirmed-by"]')).toHaveTextContent('2026-11-09');
    expect(container.querySelector('[data-part="confirmed-by"]')).toHaveTextContent('Owner (SME');
    expect(container.firstElementChild).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    expect(container.firstElementChild).toHaveAttribute('lang', lang);
  });
  it('Tier 1 source route shows the source line and date opened', () => {
    const { container } = render(<TierBadge {...T1S} lang={lang} />);
    expect(container.querySelector('[data-part="source-opened"]')).toHaveTextContent('MoF regulation page');
    expect(container.querySelector('[data-part="source-opened"]')).toHaveTextContent('2026-11-08');
  });
  it('Tier 2: exact label, source and the prompt visible without opening', () => {
    const { container } = render(<TierBadge {...T2} lang={lang} />);
    expect(screen.getByRole('button')).toHaveTextContent(TIER_STRINGS.t2[lang]);
    expect(container).toHaveTextContent(TIER_STRINGS.t2_prompt[lang]);
    expect(container).toHaveTextContent('DLA Piper GENIE page, V2');
  });
  it('Tier 3: prompt, guidance and possible answers visible WITHOUT opening a drawer', () => {
    const { container } = render(<TierBadge {...T3} lang={lang} />);
    expect(screen.getByRole('button')).toHaveTextContent(TIER_STRINGS.t3[lang]);
    expect(container).toHaveTextContent(TIER_STRINGS.t3_prompt[lang]);
    expect(container).toHaveTextContent(TIER_STRINGS.t3_guidance[lang]);
    expect(container.querySelectorAll('[data-part="possible-answers"] li')).toHaveLength(2);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('the three tiers differ by icon shape, not only colour', () => {
    const shapes = [T1, T2, T3].map((p) => { const r = render(<TierBadge {...p} lang={lang} />); const s = r.container.querySelector('svg')!.getAttribute('data-shape'); r.unmount(); return s; });
    expect(new Set(shapes).size).toBe(3);
  });
  it('tier "na" shows plain text with no button; NoTierNotice shows tier.none', () => {
    const { container } = render(<><TierBadge tier="na" lang={lang} /><NoTierNotice lang={lang} /></>);
    expect(screen.queryByRole('button')).toBeNull();
    expect(container).toHaveTextContent(TIER_STRINGS.na[lang]);
    expect(container).toHaveTextContent(TIER_STRINGS.none[lang]);
  });
});

describe.each(langs)('keyboard and focus (hardest) [%s]', (lang) => {
  it('Enter opens, Escape closes, focus returns to the badge', async () => {
    const user = userEvent.setup();
    render(<TierBadge {...T2} lang={lang} />);
    const btn = screen.getByRole('button', { name: /./ });
    await user.tab(); expect(btn).toHaveFocus();
    await user.keyboard('{Enter}');
    const dlg = screen.getByRole('dialog');
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(dlg).toHaveFocus();
    expect(dlg).toHaveAttribute('aria-modal', 'false');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(btn).toHaveFocus();
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });
  it('Space opens', async () => {
    const user = userEvent.setup();
    render(<TierBadge {...T1} lang={lang} />);
    await user.tab(); await user.keyboard(' ');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
  it('Escape works when focus is back on the badge, and Close button works', async () => {
    const user = userEvent.setup();
    render(<TierBadge {...T3} lang={lang} />);
    const btn = screen.getByRole('button', { name: /./ });
    await user.click(btn);
    await user.click(screen.getByRole('button', { name: TIER_STRINGS.close[lang] }));
    expect(screen.queryByRole('dialog')).toBeNull(); expect(btn).toHaveFocus();
    await user.click(btn); btn.focus(); await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('clicking the badge again toggles it closed', async () => {
    const user = userEvent.setup();
    render(<TierBadge {...T1} lang={lang} />);
    const btn = screen.getByRole('button', { name: /./ });
    await user.click(btn); await user.click(btn);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('drawer carries the never-certifies line and no single-character shortcut exists', async () => {
    const user = userEvent.setup();
    render(<TierBadge {...T2} lang={lang} />);
    await user.keyboard('x?i'); expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(screen.getByRole('button', { name: /./ }));
    expect(screen.getByRole('dialog')).toHaveTextContent(TIER_STRINGS.never_certifies[lang]);
  });
});

describe('phone bottom sheet (boundary, 375 px)', () => {
  it('opens as a modal sheet in a portal with a scrim; Tab stays inside; Escape returns focus', async () => {
    mockPhone(true);
    const user = userEvent.setup();
    render(<TierBadge {...T3} lang="ar" />);
    const btn = screen.getByRole('button', { name: /./ });
    await user.click(btn);
    const dlg = screen.getByRole('dialog');
    expect(dlg).toHaveAttribute('aria-modal', 'true');
    expect(dlg.className).toContain('isc-tier__drawer--sheet');
    expect(dlg.closest('.isc-tier')).toHaveAttribute('dir', 'rtl');
    await user.tab(); await user.tab();
    expect(dlg.contains(document.activeElement)).toBe(true);
    await user.keyboard('{Escape}');
    expect(btn).toHaveFocus();
  });
  it('tapping the scrim closes the sheet', async () => {
    mockPhone(true);
    const user = userEvent.setup();
    const { baseElement } = render(<TierBadge {...T1} lang="en" />);
    await user.click(screen.getByRole('button', { name: /./ }));
    await user.click(baseElement.querySelector('.isc-tier__scrim')!);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Tier 3 cannot be collapsed or dismissed (boundary, test 258)', () => {
  it('prompt and answers stay after opening and closing; unknown collapse props change nothing', async () => {
    const user = userEvent.setup();
    const extra: object = { collapsed: true, dismissed: true, hidden: true };
    const { container } = render(<TierBadge {...T3} {...extra} lang="en" />);
    expect(container).toHaveTextContent(TIER_STRINGS.t3_prompt.en);
    await user.click(screen.getByRole('button', { name: /./ })); await user.keyboard('{Escape}');
    expect(container).toHaveTextContent(TIER_STRINGS.t3_prompt.en);
    expect(container.querySelectorAll('[data-part="possible-answers"] li').length).toBe(2);
    expect(container.querySelector('[data-part="inline"]')).toBeVisible();
  });
  it('the only controls are the badge and, while open, Close: no dismiss/collapse control', () => {
    render(<TierBadge {...T3} lang="en" />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});

describe.each(langs)('Tier 2 guard words (hardest, test 259) [%s]', (lang) => {
  it('no forbidden word in the full render text, drawer, or accessible name', async () => {
    const user = userEvent.setup();
    const { container } = render(<TierBadge {...T2} lang={lang} />);
    await user.click(screen.getByRole('button', { name: /./ }));
    const all = `${container.textContent} ${screen.getByRole('dialog').textContent} ${screen.getAllByRole('button')[0].getAttribute('aria-label')}`;
    expect(findForbiddenTier2Words(all)).toEqual([]);
    expect(container).toHaveTextContent(TIER_STRINGS.t2[lang]);
    expect(container).toHaveTextContent(TIER_STRINGS.t2_prompt[lang]);
  });
  it('a forbidden word in the record: downgrade to the safe state, no record text shown, dev error logged', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<TierBadge tier={2} source="Law page: rule is approved" basis="cleared by firm" lang={lang} now={now} />);
    expect(container.firstElementChild).toHaveAttribute('data-state', 'INSUFFICIENT_DATA');
    expect(container.firstElementChild?.getAttribute('data-reason')).toContain('T2_FORBIDDEN_WORD');
    expect(container).not.toHaveTextContent('approved'); expect(container).not.toHaveTextContent('cleared');
    expect(err).toHaveBeenCalled();
    expect(String(err.mock.calls[0][0])).toContain('approved');
  });
  it('Tier 2 with no source shows the Tier 3 safe state, never Tier 2', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<TierBadge tier={2} basis="b" lang={lang} now={now} />);
    expect(container.firstElementChild).toHaveAttribute('data-state', 'INSUFFICIENT_DATA');
    expect(container.firstElementChild).toHaveAttribute('data-tier', '3');
    expect(screen.getByRole('button')).toHaveTextContent(TIER_STRINGS.t3[lang]);
    expect(container).not.toHaveTextContent(TIER_STRINGS.t2[lang]);
    expect(container).toHaveTextContent(TIER_STRINGS.t3_prompt[lang]);
  });
  it('Tier 1 text may use the word Confirmed (Tier 1 only): no false guard hit', () => {
    const { container } = render(<TierBadge {...T1} lang="en" />);
    expect(container.firstElementChild).toHaveAttribute('data-state', 'OK');
    expect(container).toHaveTextContent('Confirmed by');
  });
});

describe('missing data (hardest): never guess', () => {
  const bad: [string, Parameters<typeof TierBadge>[0]][] = [
    ['no tier', { tier: undefined, lang: 'en' }],
    ['Tier 1 no basis', { tier: 1, confirmedBy: 'A', confirmedOn: '2026-11-09', lang: 'en', now }],
    ['Tier 1 no date', { tier: 1, basis: 'b', confirmedBy: 'A', lang: 'en', now }],
    ['Tier 1 no confirmer or source', { tier: 1, basis: 'b', confirmedOn: '2026-11-09', lang: 'en', now }],
    ['Tier 1 bad date', { tier: 1, basis: 'b', confirmedBy: 'A', confirmedOn: 'yesterday', lang: 'ar', now }],
    ['Tier 2 no source', { tier: 2, lang: 'ar', now }],
  ];
  it.each(bad)('%s => INSUFFICIENT_DATA, Tier 3 safe look, never a Tier 1 or Tier 2 claim', (_n, p) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<TierBadge {...p} />);
    expect(container.firstElementChild).toHaveAttribute('data-state', 'INSUFFICIENT_DATA');
    const b = screen.getByRole('button');
    expect(b).toHaveTextContent(TIER_STRINGS.t3[p.lang]);
    expect(container).toHaveTextContent(TIER_STRINGS.t3_prompt[p.lang]);
    expect(container).not.toHaveTextContent(TIER_STRINGS.t1[p.lang]);
  });
  it('Tier 3 with no possible answers: prompt shown, guidance sentence omitted (it would point to nothing)', () => {
    const { container } = render(<TierBadge tier={3} lang="en" now={now} />);
    expect(container).toHaveTextContent(TIER_STRINGS.t3_prompt.en);
    expect(container.querySelector('[data-part="guidance"]')).toBeNull();
  });
  it('all-blank possible answers are dropped', () => {
    const { container } = render(<TierBadge tier={3} possibleAnswers={['', '  ']} lang="en" now={now} />);
    expect(container.querySelectorAll('li')).toHaveLength(0);
  });
});

describe('long text, digits, ISC, bidi (boundary)', () => {
  const long = 'Very long legal basis text without any break '.repeat(120) + 'x'.repeat(400);
  it.each(langs)('very long basis, source and answers render without throwing [%s]', (lang) => {
    const { container } = render(<TierBadge tier={2} basis={long} source={long} possibleAnswers={[{ text: long, source: long, vLevel: 'V2' }]} lang={lang} now={now} />);
    expect(container.textContent!.length).toBeGreaterThan(10000);
    expect(screen.getByRole('button').getAttribute('aria-label')).toBeTruthy();
  });
  it('ISC is wrapped in <bdi> in the visible label (EN and AR)', () => {
    for (const l of langs) {
      const { container, unmount } = render(<TierBadge {...T2} lang={l} />);
      const label = container.querySelector('.isc-tier__label')!;
      expect(within(label as HTMLElement).getByText('ISC').tagName).toBe('BDI');
      unmount();
    }
  });
  it('Arabic-Indic digits in user text and dates are shown as Western digits', () => {
    const { container } = render(<TierBadge tier={1} basis="المادة ١٢ من النظام" confirmedBy="الخبير" confirmedOn="٢٠٢٦-١١-٠٩" lang="ar" now={now} />);
    expect(container).toHaveTextContent('2026-11-09'); expect(container).toHaveTextContent('المادة 12');
    expect(container.textContent).not.toMatch(/[٠-٩]/);
  });
  it('Latin name inside Arabic text is isolated with bdi', () => {
    const { container } = render(<TierBadge tier={1} basis="b" confirmedBy="A. Smith, Counsel" confirmedOn="2026-11-09" lang="ar" now={now} />);
    expect(container.querySelector('[data-part="confirmed-by"] bdi')).toHaveTextContent('A. Smith, Counsel');
  });
  it('script-like text is rendered as text (React escaping), not executed', () => {
    const { container } = render(<TierBadge tier={2} source={'<img src=x onerror=alert(1)>'} lang="en" now={now} />);
    expect(container.querySelector('img')).toBeNull();
  });
});

const BIDI = /[⁦-⁩‎‏]/g;
const plain = (s: string) => s.replace(BIDI, '');

describe('accessible name (ARQ-23 label in name; v2: exact, no workaround)', () => {
  it.each(langs.flatMap((l) => ([1, 2, 3] as const).map((t) => [l, t] as const)))('%s tier %i: name contains the visible label EXACTLY', (lang, tier) => {
    const n = accessibleName(tier, lang, 'basis text');
    expect(plain(n)).toContain(plain(TIER_STRINGS[`t${tier}` as 't1'][lang]));
    expect(n.startsWith(TIER_STRINGS.field_tier[lang])).toBe(true);
  });
  it('the Tier 2 Arabic name contains وصوبته', () => { expect(accessibleName(2, 'ar', '')).toContain('وصوبته'); });
  it('Tier 1 name carries the basis (trailing full stop not doubled)', () => {
    expect(accessibleName(1, 'en', 'Law X.')).toBe('Confidence tier: Tier 1: Certain. Law X.');
    expect(accessibleName(1, 'ar', 'المادة ١٢')).toBe('مستوى الثقة: المستوى الأول: مؤكد. المادة 12.');
  });
  it('rendered button aria-label equals accessibleName and contains the visible button text', () => {
    for (const lang of langs) for (const p of [T1, T2, T3]) {
      const { unmount } = render(<TierBadge {...p} lang={lang} />);
      const b = screen.getByRole('button');
      expect(plain(b.getAttribute('aria-label')!)).toContain(plain(b.textContent!.trim()));
      unmount();
    }
  });
  it.each(langs.flatMap((l) => ([1, 2, 3] as const).map((t) => [l, t] as const)))('short badge name (%s tier %i) contains the short text exactly; not rendered', (lang, tier) => {
    const n = shortBadgeName(tier, lang, 'basis text');
    expect(plain(n)).toContain(plain(SHORT_STRINGS[`t${tier}_short` as 't1_short'][lang]));
    expect(n.startsWith(`${TIER_STRINGS.field_tier[lang]}: `)).toBe(true);
    expect(n).toContain(tier === 1 ? 'basis text' : TIER_STRINGS[tier === 2 ? 't2_prompt' : 't3_prompt'][lang]);
  });
  it('the component never renders the short text (variant not implemented)', () => {
    for (const lang of langs) { const { container, unmount } = render(<TierBadge {...T2} lang={lang} />); expect(container.textContent).not.toContain(SHORT_STRINGS.t2_short[lang]); unmount(); }
  });
});

describe('INSUFFICIENT_DATA display rule (6.15B rule 2; test 263)', () => {
  const cases: [string, Parameters<typeof TierBadge>[0]][] = [
    ['no tier', { tier: undefined, lang: 'en' }],
    ['unknown tier', { tier: 7 as never, lang: 'en' }],
    ['Tier 1 no basis', { tier: 1, confirmedBy: 'A', confirmedOn: '2026-11-09', lang: 'en', now }],
    ['Tier 1 future date', { tier: 1, basis: 'b', confirmedBy: 'A', confirmedOn: '2030-01-01', lang: 'en', now }],
    ['Tier 2 no source', { tier: 2, basis: 'b', lang: 'en', now }],
    ['Tier 2 forbidden word', { tier: 2, basis: 'cleared', source: 's', lang: 'en', now }],
  ];
  it.each(cases.flatMap(([n, p]) => langs.map((l) => [n, { ...p, lang: l } as Parameters<typeof TierBadge>[0]] as const)))('%s => Tier 3 label + prompt + message, nothing else', (_n, p) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<TierBadge {...p} possibleAnswers={['record answer']} />);
    const L = p.lang;
    expect(container.firstElementChild).toHaveAttribute('data-state', 'INSUFFICIENT_DATA');
    expect(screen.getByRole('button')).toHaveTextContent(TIER_STRINGS.t3[L]);
    expect(container.querySelector('[data-part="prompt"]')).toHaveTextContent(TIER_STRINGS.t3_prompt[L]);
    expect(container.querySelector('[data-part="insufficient"]')).toHaveTextContent(TIER_STRINGS.insufficient[L]);
    expect(container.querySelector('[data-part="guidance"]')).toBeNull();
    expect(container.querySelector('[data-part="possible-answers"]')).toBeNull();
    expect(container.querySelector('[data-part="answers-heading"]')).toBeNull();
    expect(container).not.toHaveTextContent('record answer');
    if (p.basis) expect(container).not.toHaveTextContent(p.basis);
    expect(container).not.toHaveTextContent(TIER_STRINGS.t3_guidance[L]);
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe(`${SR_STRINGS.sr_t3[L].replace(/\s+\./, '.')} ${TIER_STRINGS.insufficient[L]}`);
    expect(screen.getAllByRole('button')).toHaveLength(1); // cannot be dismissed or collapsed
  });
  it('drawer of the safe state shows the same three parts and no record text', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<TierBadge tier={2} basis="secret basis" lang="ar" now={now} />);
    await user.click(screen.getByRole('button', { name: /./ }));
    const d = screen.getByRole('dialog');
    expect(d).toHaveTextContent(TIER_STRINGS.insufficient.ar);
    expect(d).toHaveTextContent(TIER_STRINGS.t3_prompt.ar);
    expect(d).not.toHaveTextContent('secret basis');
  });
  it('valid records never show the message', () => {
    for (const p of [T1, T2, T3]) { const { container, unmount } = render(<TierBadge {...p} lang="en" />); expect(container.querySelector('[data-part="insufficient"]')).toBeNull(); unmount(); }
  });
});

describe.each(langs)('possible answers labels (6.15B rule 3; test 264) [%s]', (lang) => {
  it('Tier 2 drawer: heading, Source and V level labels with the V code isolated LTR', async () => {
    const user = userEvent.setup();
    render(<TierBadge {...T2} lang={lang} />);
    await user.click(screen.getByRole('button', { name: /./ }));
    const d = screen.getByRole('dialog');
    expect(d.querySelector('[data-part="answers-heading"]')).toHaveTextContent(TIER_STRINGS.possible_answers[lang]);
    expect(d.querySelector('[data-part="answer-source"]')).toHaveTextContent(`${TIER_STRINGS.source_label[lang]}: DLA Piper`);
    expect(d.querySelector('[data-part="answer-vlevel"]')).toHaveTextContent(`${TIER_STRINGS.vlevel_label[lang]}: V2`);
    const code = d.querySelector('[data-part="answer-vlevel"] bdi')!;
    expect(code).toHaveAttribute('dir', 'ltr'); expect(code.textContent).toBe('V2');
    expect(d.querySelector('ul')).toHaveAttribute('aria-labelledby', d.querySelector('[data-part="answers-heading"]')!.id);
  });
  it('Tier 3 inline (no drawer): heading above the list; answers with a missing source or V level leave that row out', () => {
    const { container } = render(<TierBadge tier={3} possibleAnswers={[{ text: 'A', source: 'S1', vLevel: 'V1' }, { text: 'B', vLevel: 'V2' }, { text: 'C', source: 'S3' }, 'D']} lang={lang} now={now} />);
    expect(container.querySelector('[data-part="answers-heading"]')).toHaveTextContent(TIER_STRINGS.possible_answers[lang]);
    const li = container.querySelectorAll('[data-part="possible-answers"] li');
    expect(li).toHaveLength(4);
    expect(li[0].querySelector('[data-part="answer-source"]')).not.toBeNull();
    expect(li[1].querySelector('[data-part="answer-source"]')).toBeNull();
    expect(li[1].querySelector('[data-part="answer-vlevel"]')).not.toBeNull();
    expect(li[2].querySelector('[data-part="answer-vlevel"]')).toBeNull();
    expect(li[3].querySelector('[data-part="answer-source"], [data-part="answer-vlevel"]')).toBeNull();
    expect(li[3]).not.toHaveTextContent(TIER_STRINGS.source_label[lang]); // never a default
  });
  it('Tier 3 guidance sentence still shown in the OK state', () => {
    const { container } = render(<TierBadge {...T3} lang={lang} />);
    expect(container.querySelector('[data-part="guidance"]')).toHaveTextContent(TIER_STRINGS.t3_guidance[lang]);
  });
  it('Close button reads tier.close', async () => {
    const user = userEvent.setup();
    render(<TierBadge {...T1} lang={lang} />);
    await user.click(screen.getByRole('button', { name: /./ }));
    expect(screen.getByRole('button', { name: TIER_STRINGS.close[lang] })).toBeInTheDocument();
  });
});

describe('breakpoint and scroll lock (6.15B rule 4; test 265)', () => {
  type Mq = { matches: boolean; fire: () => void };
  function controllablePhone(initial: boolean) {
    let matches = initial; const ls = new Set<() => void>();
    window.matchMedia = ((q: string) => ({ get matches() { return matches; }, media: q, addEventListener: (_: string, f: () => void) => ls.add(f), removeEventListener: (_: string, f: () => void) => ls.delete(f), addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as never;
    return { set(v: boolean) { matches = v; act(() => { ls.forEach((f) => f()); }); } } as { set: (v: boolean) => void } & Partial<Mq>;
  }
  it('crossing 480 px with the drawer open keeps it open, the same node and the focus', async () => {
    const mq = controllablePhone(false);
    const user = userEvent.setup();
    render(<TierBadge {...T2} lang="en" />);
    await user.click(screen.getByRole('button', { name: /./ }));
    const dlg = screen.getByRole('dialog');
    const close = within(dlg).getByRole('button', { name: 'Close' });
    close.focus(); expect(close).toHaveFocus();
    expect(dlg).toHaveAttribute('aria-modal', 'false');
    mq.set(true);
    expect(screen.getByRole('dialog')).toBe(dlg);          // same DOM node: no remount
    expect(dlg).toHaveAttribute('aria-modal', 'true');
    expect(dlg.className).toContain('isc-tier__drawer--sheet');
    expect(close).toHaveFocus();
    expect(document.querySelector('.isc-tier__scrim')).not.toBeNull();
    mq.set(false);
    expect(screen.getByRole('dialog')).toBe(dlg);
    expect(dlg).toHaveAttribute('aria-modal', 'false');
    expect(close).toHaveFocus();
    expect(document.querySelector('.isc-tier__scrim')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: /./ })).toHaveFocus();
  });
  it('focus on the drawer itself is also kept when crossing', async () => {
    const mq = controllablePhone(true);
    const user = userEvent.setup();
    render(<TierBadge {...T3} lang="ar" />);
    await user.click(screen.getByRole('button', { name: /./ }));
    const dlg = screen.getByRole('dialog'); expect(dlg).toHaveFocus();
    mq.set(false); expect(dlg).toHaveFocus(); expect(screen.getByRole('dialog')).toBe(dlg);
  });
  it('scroll lock: on while the sheet is open, restored on Close, scrim and Escape', async () => {
    controllablePhone(true);
    const user = userEvent.setup();
    document.body.style.overflow = 'scroll';
    const { baseElement } = render(<TierBadge {...T1} lang="en" />);
    const open = () => user.click(screen.getByRole('button', { name: /./ }));
    expect(document.body.style.overflow).toBe('scroll');
    await open(); expect(document.body.style.overflow).toBe('hidden'); expect(document.documentElement.style.overflow).toBe('hidden');
    await user.click(screen.getByRole('button', { name: 'Close' })); expect(document.body.style.overflow).toBe('scroll');
    await open(); expect(document.body.style.overflow).toBe('hidden');
    await user.click(baseElement.querySelector('.isc-tier__scrim')!); expect(document.body.style.overflow).toBe('scroll');
    await open(); await user.keyboard('{Escape}'); expect(document.body.style.overflow).toBe('scroll');
    expect(document.documentElement.style.overflow).toBe('');
    document.body.style.overflow = '';
  });
  it('scroll lock is released on unmount while open (no leak) and by two badges in turn', async () => {
    controllablePhone(true);
    const user = userEvent.setup();
    const { unmount } = render(<><TierBadge {...T1} lang="en" /><TierBadge {...T2} lang="en" /></>);
    await user.click(screen.getAllByRole('button', { name: /./ })[0]);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
    expect(document.documentElement.style.overflow).toBe('');
  });
  it('no scroll lock on desktop (non-modal dialog)', async () => {
    controllablePhone(false);
    const user = userEvent.setup();
    render(<TierBadge {...T2} lang="en" />);
    await user.click(screen.getByRole('button', { name: /./ }));
    expect(document.body.style.overflow).toBe('');
  });
  it('scroll position restored on close when it changed while locked', async () => {
    controllablePhone(true);
    const user = userEvent.setup();
    const spy = vi.fn(); window.scrollTo = spy as never;
    Object.defineProperty(window, 'scrollY', { value: 300, configurable: true });
    render(<TierBadge {...T1} lang="en" />);
    await user.click(screen.getByRole('button', { name: /./ }));
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    await user.keyboard('{Escape}');
    expect(spy).toHaveBeenCalledWith(0, 300);
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });
});

describe('dev guard does not fire on clean data', () => {
  it('no console.error for valid tiers', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    for (const p of [T1, T1S, T2, T3]) for (const l of langs) render(<TierBadge {...p} lang={l} />).unmount();
    act(() => {});
    expect(err).not.toHaveBeenCalled();
  });
});
