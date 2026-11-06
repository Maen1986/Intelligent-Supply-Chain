// src/lib/deskRoutes.ts
// Negotiation Desk: entry routes, pick-list builder and paste-in price parser (E3, 6 Nov 2026).
// Pure functions, no DOM, no runtime imports from other engines (standalone-first).
// Routes are ISC design choices about which Desk steps a given situation needs. They are not a sourced standard.
import type { PricePoint } from '@/lib/supplierCommercialIntelligence';

export type StepId = 'setup' | 'position' | 'price' | 'tactics' | 'rounds' | 'brief';
export const STEP_IDS: StepId[] = ['setup', 'position', 'price', 'tactics', 'rounds', 'brief'];
export type RouteId = 'full' | 'meeting-today' | 'price-rise' | 'quick' | 'mid-negotiation' | 'renewal';

export interface DeskRoute {
  id: RouteId;
  en: string; ar: string;
  whenEn: string; whenAr: string;
  needs: StepId[];
  landing: StepId;
}

export const DESK_ROUTES: DeskRoute[] = [
  { id: 'full', en: 'Full guided preparation', ar: 'تحضير كامل خطوة بخطوة',
    whenEn: 'You have time and want every angle covered.', whenAr: 'لديك وقت وتريد تغطية كل الجوانب.',
    needs: ['setup', 'position', 'price', 'tactics', 'rounds', 'brief'], landing: 'setup' },
  { id: 'meeting-today', en: 'Meeting today', ar: 'اجتماع اليوم',
    whenEn: 'Know where you stand, what to use and what to watch for. Price and rounds are optional.',
    whenAr: 'اعرف موقفك وما تستخدمه وما تحذر منه. السعر والجولات اختياريان.',
    needs: ['setup', 'position', 'tactics', 'brief'], landing: 'setup' },
  { id: 'price-rise', en: 'Is this price rise fair?', ar: 'هل هذه الزيادة في السعر عادلة؟',
    whenEn: 'The supplier asked for more. Enter your recent prices and see the trend and your position.',
    whenAr: 'طلب المورد سعرا أعلى. أدخل أسعارك الأخيرة لترى الاتجاه وموقفك.',
    needs: ['price', 'position'], landing: 'price' },
  { id: 'quick', en: 'Quick read (few minutes)', ar: 'قراءة سريعة (بضع دقائق)',
    whenEn: 'Two answers only: how strong is your position, then the one-page brief.',
    whenAr: 'إجابتان فقط: مدى قوة موقفك ثم الملخص في صفحة واحدة.',
    needs: ['position', 'brief'], landing: 'position' },
  { id: 'mid-negotiation', en: 'We are already negotiating', ar: 'نحن نتفاوض بالفعل',
    whenEn: 'Log what each side did and get the suggested next move.',
    whenAr: 'سجّل ما فعله كل طرف واحصل على الخطوة التالية المقترحة.',
    needs: ['rounds'], landing: 'rounds' },
  { id: 'renewal', en: 'Contract renewal coming', ar: 'تجديد عقد قريب',
    whenEn: 'Set up the supplier, check the price history, then pick tactics.',
    whenAr: 'أدخل بيانات المورد وراجع سجل الأسعار ثم اختر التكتيكات.',
    needs: ['setup', 'price', 'position', 'tactics'], landing: 'setup' },
];

export function getRoute(id: string | undefined | null): DeskRoute | undefined {
  return DESK_ROUTES.find(r => r.id === id);
}
/** 'needed' when the route lists the step, 'optional' otherwise. With no route every step is 'needed'. */
export function stepNeed(routeId: string | undefined | null, step: StepId): 'needed' | 'optional' {
  const r = getRoute(routeId);
  if (!r) return 'needed';
  return r.needs.includes(step) ? 'needed' : 'optional';
}

// ---------- pick-list ----------
export type SuggestSource = 'case' | 'portfolio' | 'check' | 'category';
export interface Suggestion {
  name: string;
  source: SuggestSource;
  quadrant?: string;
  checkId?: string;
  detail?: string;
}
const QUADS = ['leverage', 'strategic', 'bottleneck', 'non-critical'];
const RANK: Record<SuggestSource, number> = { case: 0, portfolio: 1, check: 2, category: 3 };

export function buildSuggestions(input: {
  cases?: { name?: string; quadrant?: string }[];
  portfolio?: { name?: string; category?: string; quadrant?: string }[];
  checks?: { id?: string; name?: string }[];
  categories?: { label: string }[];
}): Suggestion[] {
  const all: Suggestion[] = [];
  const ok = (n: unknown): n is string => typeof n === 'string' && n.trim() !== '';
  for (const c of input.cases ?? []) if (ok(c?.name)) all.push({ name: c.name.trim(), source: 'case', quadrant: QUADS.includes(c.quadrant ?? '') ? c.quadrant : undefined });
  for (const p of input.portfolio ?? []) if (ok(p?.name)) all.push({ name: p.name.trim(), source: 'portfolio', quadrant: QUADS.includes(p.quadrant ?? '') ? p.quadrant : undefined, detail: ok(p.category) ? p.category.trim() : undefined });
  for (const k of input.checks ?? []) if (ok(k?.name)) all.push({ name: k.name.trim(), source: 'check', checkId: k.id });
  for (const g of input.categories ?? []) if (ok(g?.label)) all.push({ name: g.label.trim(), source: 'category' });
  const best = new Map<string, Suggestion>();
  for (const s of all) {
    const key = s.name.toLowerCase();
    const cur = best.get(key);
    if (!cur) { best.set(key, s); continue; }
    const winner = RANK[s.source] < RANK[cur.source] ? s : cur;
    const other = winner === s ? cur : s;
    best.set(key, { ...winner, quadrant: winner.quadrant ?? other.quadrant, checkId: winner.checkId ?? other.checkId, detail: winner.detail ?? other.detail });
  }
  return [...best.values()].sort((a, b) => RANK[a.source] - RANK[b.source] || a.name.localeCompare(b.name));
}
export function matchSuggestion(list: Suggestion[], typed: string): Suggestion | undefined {
  const k = typed.trim().toLowerCase();
  return k === '' ? undefined : list.find(s => s.name.toLowerCase() === k);
}

// ---------- paste-in prices ----------
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
function normaliseDigits(s: string): string {
  return s.replace(/[٠-٩]/g, d => String(AR_DIGITS.indexOf(d))).replace(/٫/g, '.').replace(/٬/g, ',');
}
const ISO = /^\d{4}-\d{2}-\d{2}$/;
/** One price per line: "Q1 100", "Jan, 1,200.50", "2026-03-01<TAB>98", or just "100". Lines without a usable price are skipped and counted. */
export function parsePastedPrices(text: string, baseDate: string): { points: PricePoint[]; skipped: number } {
  const lines = normaliseDigits(text).split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
  const raw: { label: string; price: number; date?: string }[] = [];
  let skipped = 0;
  for (const line of lines) {
    const m = [...line.matchAll(/-?\d[\d,]*(?:\.\d+)?/g)];
    const last = m[m.length - 1];
    if (!last) { skipped++; continue; }
    const price = Number(last[0].replace(/,/g, ''));
    if (!Number.isFinite(price) || price <= 0) { skipped++; continue; }
    const label = (line.slice(0, last.index) + line.slice((last.index ?? 0) + last[0].length)).replace(/[,;\t|:=]+/g, ' ').trim();
    const dm = label.match(/\d{4}-\d{2}-\d{2}/);
    raw.push({ label: dm ? label.replace(dm[0], '').trim() || dm[0] : label, price, date: dm && ISO.test(dm[0]) ? dm[0] : undefined });
  }
  const base = new Date(`${baseDate}T00:00:00Z`);
  const points = raw.map((r, i) => {
    let sortKey = r.date;
    if (!sortKey) {
      const d = new Date(base.getTime());
      d.setUTCDate(d.getUTCDate() + i * 30);
      sortKey = d.toISOString().slice(0, 10);
    }
    return { periodLabel: r.label || `P${i + 1}`, price: r.price, sortKey };
  });
  return { points, skipped };
}
