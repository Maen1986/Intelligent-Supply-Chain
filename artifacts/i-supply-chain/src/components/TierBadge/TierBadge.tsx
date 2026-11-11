// TierBadge.tsx -- ISC Confidence tier badge (spec X-01, section 6.15A; card RM-02 v11).
// React only. No localStorage, no network, no hover-only information.
//
// What it does (spec):
//  - a real <button> (Enter / Space open the details drawer, Escape closes it, focus returns to the badge)
//  - the text label is always shown; icon SHAPE differs per tier; never colour alone
//  - Tier 1 shows basis and date; Tier 2 shows source and the prompt; Tier 3 shows the prompt, guidance and
//    possible answers WITHOUT opening anything, and cannot be collapsed, dismissed or hidden
//  - Tier 2 is never worded as certain/confirmed/verified/proven/approved/cleared/compliant (dev guard + validation)
//  - incomplete record => INSUFFICIENT_DATA (never guessed): rendered as the Tier 3 label and prompt, no record text
//  - RTL by dir + logical CSS; "ISC" in <bdi>; Western digits; touch target >= 44px; bottom sheet at <= 480px
import {
  useCallback, useEffect, useId, useMemo, useRef, useState,
  type KeyboardEvent as ReactKeyboardEvent, type ReactNode,
} from 'react';
import './TierBadge.css';
import {
  SHORT_STRINGS, SR_STRINGS, TIER_STRINGS, labelKey,
  type Lang, type TierNumber,
} from './tierStrings';
import {
  answerText, clean, findForbiddenTier2Words, toWesternDigits, validateTierRecord,
  type PossibleAnswer, type TierRecord, type ValidationResult,
} from './tierRecord';

export interface TierBadgeProps {
  /** 1, 2, 3, or 'na' (row with no confidence tier: plain text, no badge). Anything else is INSUFFICIENT_DATA. */
  tier: TierNumber | 'na' | null | undefined;
  basis?: string | null;
  confirmedBy?: string | null;
  confirmedOn?: string | Date | null;
  source?: string | null;
  sourceOpenedOn?: string | Date | null;
  possibleAnswers?: PossibleAnswer[] | null;
  lang: Lang;
  className?: string;
  /** Injected "today" for the future-date check (tests, specimens). */
  now?: Date;
}

export const PHONE_QUERY = '(max-width: 480px)';

function isDev(): boolean {
  const env = (import.meta as unknown as { env?: { DEV?: boolean } }).env;
  return !!env?.DEV;
}

// ---------- text helpers ----------

/** Wrap every "ISC" in <bdi> (spec: brand in Latin letters, bidi-isolated). Also normalises digits. */
function withIsc(text: string): ReactNode[] {
  return toWesternDigits(text)
    .split(/(ISC)/)
    .map((part, i) => (part === 'ISC' ? <bdi key={i}>ISC</bdi> : part));
}

/** User-entered text: Western digits, direction decided by its own content (ARQ-17), ISC isolated. */
function UserText({ text }: { text: string }) {
  return <bdi>{withIsc(text)}</bdi>;
}

/** Fill "[placeholder]" slots of a spec string with nodes. */
function fill(template: string, slots: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\[[^\]]+\])/).map((part, i) => {
    const m = /^\[([^\]]+)\]$/.exec(part);
    if (m && m[1] in slots) return <span key={i}>{slots[m[1]]}</span>;
    return <span key={i}>{withIsc(part)}</span>;
  });
}

const SLOT = {
  en: { by: 'name, role', date: 'date', source: 'source', basis: 'basis' },
  ar: { by: 'الاسم، الصفة', date: 'التاريخ', source: 'المصدر', basis: 'الأساس' },
} as const;

function DateText({ iso }: { iso: string }) {
  return <time dateTime={iso} dir="ltr">{iso}</time>;
}

const stripDot = (basis: string) => toWesternDigits(basis.replace(/[.۔]+$/, ''));

/**
 * Accessible name with the FULL label visible = the spec sentence tier.sr_t1..3 (it contains the visible label exactly:
 * WCAG 2.5.3, ARQ-23; spec 6.15B rule 1). INSUFFICIENT_DATA: tier.sr_t3 followed by tier.insufficient (rule 2).
 */
export function accessibleName(tier: TierNumber, lang: Lang, basis: string, insufficient = false): string {
  const srTpl = SR_STRINGS[`sr_t${tier}` as 'sr_t1'][lang];
  const sr = srTpl.replace(`[${SLOT[lang].basis}]`, stripDot(basis)).replace(/\s+\./, '.').trim();
  return insufficient ? `${sr} ${TIER_STRINGS.insufficient[lang]}` : sr;
}

/**
 * Accessible name when the SHORT badge is the visible label (6.15B rule 1): field label, colon, short text, full stop,
 * then the basis (Tier 1) or the prompt (Tier 2, Tier 3). The component does not render the short variant yet; this
 * exports the rule so the pages that do can use it.
 */
export function shortBadgeName(tier: TierNumber, lang: Lang, basis = ''): string {
  const short = SHORT_STRINGS[`t${tier}_short` as 't1_short'][lang];
  const tail = tier === 1 ? stripDot(basis) : TIER_STRINGS[tier === 2 ? 't2_prompt' : 't3_prompt'][lang];
  return `${TIER_STRINGS.field_tier[lang]}: ${short}.${tail ? ` ${tail}` : ''}`;
}

// ---------- icons: different SHAPES per tier, stroke = currentColor (survive greyscale and forced colours) ----------

function Icon({ tier }: { tier: TierNumber }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', 'aria-hidden': true, focusable: false, className: 'isc-tier__icon', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (tier === 1) { // circle with tick
    return (<svg {...common} data-shape="circle"><circle cx="12" cy="12" r="9.5" /><path d="M7.5 12.5l3 3 6-6.5" /></svg>);
  }
  if (tier === 2) { // diamond with "i"
    return (<svg {...common} data-shape="diamond"><path d="M12 2.5l9.5 9.5-9.5 9.5L2.5 12z" /><path d="M12 11v5" /><path d="M12 7.8v.2" /></svg>);
  }
  return ( // triangle with "!"
    <svg {...common} data-shape="triangle"><path d="M12 3l10 18H2z" /><path d="M12 10v5" /><path d="M12 17.8v.2" /></svg>
  );
}

// ---------- phone detection ----------

function usePhone(): boolean {
  const get = () => (typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(PHONE_QUERY).matches : false);
  const [phone, setPhone] = useState(get);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(PHONE_QUERY);
    const on = () => setPhone(mq.matches);
    on();
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return phone;
}

// ---------- scroll lock behind the modal sheet (6.15B rule 4) ----------

let lockCount = 0;
let saved: { overflow: string; htmlOverflow: string; y: number } | null = null;
function lockScroll() {
  if (typeof document === 'undefined') return;
  if (lockCount++ === 0) {
    saved = { overflow: document.body.style.overflow, htmlOverflow: document.documentElement.style.overflow, y: window.scrollY };
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }
}
function unlockScroll() {
  if (typeof document === 'undefined' || lockCount === 0) return;
  if (--lockCount === 0 && saved) {
    document.body.style.overflow = saved.overflow;
    document.documentElement.style.overflow = saved.htmlOverflow;
    if (window.scrollY !== saved.y) window.scrollTo(0, saved.y);
    saved = null;
  }
}

// ---------- the component ----------

export function TierBadge(props: TierBadgeProps) {
  const { lang, className } = props;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const uid = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const phone = usePhone();

  const record: TierRecord = useMemo(() => ({
    tier: props.tier === 1 || props.tier === 2 || props.tier === 3 ? props.tier : null,
    basis: props.basis, confirmedBy: props.confirmedBy, confirmedOn: props.confirmedOn,
    source: props.source, sourceOpenedOn: props.sourceOpenedOn, possibleAnswers: props.possibleAnswers,
  }), [props.tier, props.basis, props.confirmedBy, props.confirmedOn, props.source, props.sourceOpenedOn, props.possibleAnswers]);

  const isNa = props.tier === 'na';
  const v: ValidationResult = useMemo(
    () => validateTierRecord(record, { now: props.now, tier3PromptAvailable: !!TIER_STRINGS.t3_prompt[lang] }),
    [record, props.now, lang],
  );

  const close = useCallback(() => {
    setOpen(false);
    // focus returns to the badge
    queueMicrotask(() => btnRef.current?.focus());
  }, []);

  // Dev guard: report validation refusals and any forbidden word that reaches Tier 2 DOM text.
  useEffect(() => {
    if (!isDev() || isNa) return;
    if (v.state === 'INSUFFICIENT_DATA') {
      console.error(`[ISC TierBadge] INSUFFICIENT_DATA (${v.reasons.join(', ')}). Shown as the safe Tier 3 state; record not guessed.`
        + (v.forbiddenFound ? ` Forbidden Tier 2 word(s): ${v.forbiddenFound.join(', ')}.` : ''));
    } else if (v.warnings.includes('ANSWER_NO_SOURCE_OR_VLEVEL')) {
      console.warn('[ISC TierBadge] A possible answer has no source or no V level: the missing row is left out (spec 6.15B rule 3). Complete the record.');
    }
    if (v.state !== 'INSUFFICIENT_DATA' && v.tier === 2 && rootRef.current) {
      const text = `${rootRef.current.textContent ?? ''} ${btnRef.current?.getAttribute('aria-label') ?? ''}`;
      const bad = findForbiddenTier2Words(text);
      if (bad.length) console.error(`[ISC TierBadge] Tier 2 render contains forbidden word(s): ${bad.join(', ')}.`);
    }
  }, [v, isNa, open]);

  // Escape closes (document level, so it works wherever focus is while the drawer is open).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Focus moves into the drawer on open (only on open: crossing the 480 px breakpoint keeps focus where it is).
  useEffect(() => { if (open) drawerRef.current?.focus(); }, [open]);

  // Scroll lock while the modal bottom sheet is open; restored on close, on leaving the phone layout and on unmount.
  useEffect(() => {
    if (!(open && phone)) return;
    lockScroll();
    return unlockScroll;
  }, [open, phone]);

  // Modal sheet on phone: keep Tab inside.
  const onDrawerKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!phone || e.key !== 'Tab' || !drawerRef.current) return;
    const f = Array.from(drawerRef.current.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])'));
    if (f.length === 0) { e.preventDefault(); return; }
    const first = f[0], last = f[f.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === drawerRef.current)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  };

  if (isNa) {
    return (
      <span className={`isc-tier-na ${className ?? ''}`.trim()} lang={lang} dir={dir} data-tier="na">
        {withIsc(TIER_STRINGS.na[lang])}
      </span>
    );
  }

  const insufficient = v.state === 'INSUFFICIENT_DATA';
  // INSUFFICIENT_DATA shows the safe Tier 3 look, with NO free text from the record.
  const shown: TierNumber = insufficient ? 3 : (v.tier as TierNumber);
  const basis = insufficient ? '' : clean(props.basis);
  const source = insufficient ? '' : clean(props.source);
  const by = insufficient ? '' : clean(props.confirmedBy);
  const answers: PossibleAnswer[] = insufficient || shown === 1 ? [] : (props.possibleAnswers ?? []).filter((a) => answerText(a).trim() !== '');
  const metaSep = lang === 'ar' ? '، ' : ', ';
  const label = TIER_STRINGS[labelKey(shown)][lang];
  const drawerId = `${uid}-drawer`;
  const titleId = `${uid}-title`;
  const name = accessibleName(shown, lang, basis, insufficient);

  const dateOf = (iso?: string) => (iso ? <DateText iso={iso} /> : null);

  // ----- blocks -----
  const BasisRow = ({ withSource }: { withSource: boolean }) => {
    const parts: ReactNode[] = [];
    if (basis) parts.push(<UserText key="b" text={basis} />);
    if (withSource && source) {
      parts.push(<cite key="s" className="isc-tier__source"><UserText text={source} />{v.sourceOpenedOn ? <>{lang === 'ar' ? '، ' : ', '}{dateOf(v.sourceOpenedOn)}</> : null}</cite>);
    }
    if (parts.length === 0) return null;
    return (
      <p className="isc-tier__row" data-part="basis">
        <span className="isc-tier__key">{TIER_STRINGS.field_basis[lang]}{lang === 'ar' ? ':' : ':'}</span>{' '}
        {parts.map((p, i) => <span key={i}>{i > 0 ? ' · ' : ''}{p}</span>)}
      </p>
    );
  };

  const ProofLines = () => (
    <>
      {v.confirmedOn && by ? (
        <p className="isc-tier__row" data-part="confirmed-by">
          {fill(TIER_STRINGS.t1_by[lang], { [SLOT[lang].by]: <UserText text={by} />, [SLOT[lang].date]: dateOf(v.confirmedOn) })}
        </p>
      ) : null}
      {v.sourceOpenedOn && source ? (
        <p className="isc-tier__row" data-part="source-opened">
          {fill(TIER_STRINGS.t1_source[lang], { [SLOT[lang].source]: <UserText text={source} />, [SLOT[lang].date]: dateOf(v.sourceOpenedOn) })}
        </p>
      ) : null}
    </>
  );

  const Answers = ({ part }: { part: string }) => {
    if (answers.length === 0) return null;
    const hid = `${uid}-${part}-h`;
    return (
      <>
        <p id={hid} className="isc-tier__key isc-tier__heading" data-part="answers-heading">{TIER_STRINGS.possible_answers[lang]}</p>
        <ul className="isc-tier__answers" data-part="possible-answers" aria-labelledby={hid}>
          {answers.map((a, i) => {
            const src = typeof a === 'string' ? '' : clean(a.source);
            const vl = typeof a === 'string' ? '' : clean(a.vLevel);
            return (
              <li key={i}>
                <UserText text={typeof a === 'string' ? a : a.text} />
                {src ? <>{metaSep}<span className="isc-tier__meta" data-part="answer-source">{TIER_STRINGS.source_label[lang]}: <cite className="isc-tier__source"><UserText text={src} /></cite></span></> : null}
                {vl ? <>{metaSep}<span className="isc-tier__meta" data-part="answer-vlevel">{TIER_STRINGS.vlevel_label[lang]}: <bdi dir="ltr" className="isc-tier__v">{toWesternDigits(vl)}</bdi></span></> : null}
              </li>
            );
          })}
        </ul>
      </>
    );
  };

  const Prompt = () => {
    if (shown === 2) return <p className="isc-tier__prompt" data-part="prompt">{withIsc(TIER_STRINGS.t2_prompt[lang])}</p>;
    if (shown === 3) return <p className="isc-tier__prompt" data-part="prompt">{withIsc(TIER_STRINGS.t3_prompt[lang])}</p>;
    return null;
  };

  /** INSUFFICIENT_DATA message (6.15B rule 2): fixed string, never record text. */
  const Insufficient = () => (insufficient
    ? <p className="isc-tier__insufficient" data-part="insufficient">{withIsc(TIER_STRINGS.insufficient[lang])}</p> : null);

  const Guidance = () => (shown === 3 && answers.length > 0
    ? <p className="isc-tier__guidance" data-part="guidance">{withIsc(TIER_STRINGS.t3_guidance[lang])}</p> : null);

  // Inline = always visible, never collapsible. Tier 3 carries prompt + guidance + answers here.
  const inline = (
    <div className="isc-tier__inline" data-part="inline">
      {shown === 1 && (<><ProofLines /><BasisRow withSource={false} /></>)}
      {shown === 2 && (<><BasisRow withSource /><Prompt /></>)}
      {shown === 3 && (<><Prompt /><Insufficient /><Guidance /><Answers part="inline" /></>)}
    </div>
  );

  const drawerBody = (
    <>
      <p id={titleId} className="isc-tier__drawer-title">{withIsc(label)}</p>
      {shown === 1 && (<><ProofLines /><BasisRow withSource={false} /></>)}
      {shown === 2 && (<><BasisRow withSource /><Prompt /><Answers part="drawer" /></>)}
      {shown === 3 && (<><Prompt /><Insufficient /><Guidance /><Answers part="drawer" />{!insufficient && <BasisRow withSource />}</>)}
      <p className="isc-tier__never" data-part="never-certifies">{withIsc(TIER_STRINGS.never_certifies[lang])}</p>
      <button type="button" className="isc-tier__close" onClick={close}>{TIER_STRINGS.close[lang]}</button>
    </>
  );

  const drawer = open ? (
    <div
      ref={drawerRef}
      id={drawerId}
      role="dialog"
      aria-modal={phone ? 'true' : 'false'}
      aria-labelledby={titleId}
      tabIndex={-1}
      className={`isc-tier__drawer isc-tier--t${shown}${phone ? ' isc-tier__drawer--sheet' : ''}`}
      data-testid="tier-drawer"
      onKeyDown={onDrawerKeyDown}
    >
      {drawerBody}
    </div>
  ) : null;

  return (
    <div
      ref={rootRef}
      className={`isc-tier isc-tier--t${shown}${insufficient ? ' isc-tier--insufficient' : ''} ${className ?? ''}`.trim()}
      lang={lang}
      dir={dir}
      data-tier={shown}
      data-state={insufficient ? 'INSUFFICIENT_DATA' : 'OK'}
      data-reason={insufficient ? v.reasons.join(' ') : undefined}
    >
      <button
        ref={btnRef}
        type="button"
        className="isc-tier__badge"
        aria-expanded={open}
        aria-controls={drawerId}
        aria-haspopup="dialog"
        aria-label={name}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <Icon tier={shown} />
        <span className="isc-tier__label">{withIsc(label)}</span>
      </button>
      {inline}
      {/* One stable element tree: crossing 480 px changes only class, aria-modal and the scrim, never remounts the drawer (focus is kept). */}
      {open && phone ? <div className="isc-tier__scrim" aria-hidden="true" onClick={close} /> : null}
      {drawer}
    </div>
  );
}

/** For an output with no tiered statement: "No tier on this output" (tier.none). Cannot be switched off by the caller. */
export function NoTierNotice({ lang, className }: { lang: Lang; className?: string }) {
  return (
    <p className={`isc-tier-na ${className ?? ''}`.trim()} lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} data-tier="none">
      {withIsc(TIER_STRINGS.none[lang])}
    </p>
  );
}

export default TierBadge;
