// Lookup + exemption price-gap test for the Saudi Mandatory List (government entities, June 2025 edition; state-owned companies' edition).
// Data: lcgpaMandatoryListData.ts (generated from LCGPA's official workbooks supplied by the platform owner, 24 Oct 2026).
// Honest limits (Decision Record 8.7):
//  - The lists carry a PRICE CEILING per product and a manufacturer-certificate condition. They carry NO numeric minimum-baseline percentage:
//    the baseline column says only whether a local-content certificate is required (and from which date). ISC does not invent a number.
//  - The exemption document does not define the base of the price ceiling. ISC measures the local premium over the highest foreign offer
//    and says so on screen; the buyer / LCGPA decides.
import { MANDATORY_ROWS, MANDATORY_SECTORS, type MandatoryRow } from './lcgpaMandatoryListData';

export interface MandatoryProduct {
  code: string;
  sectorIndex: number;
  sectorAr: string;
  sectorEn: string;
  nameAr: string;
  nameEn: string;
  /** Price ceiling as a whole percent (10, 15, 25, 30) or null where the list shows none. */
  ceilingPct: number | null;
  govEffective: string | null;
  soeEffective: string | null;
  cert: 0 | 1 | 2;
  certFrom: string | null;
}

export type BuyerType = 'government' | 'soe';

function toProduct(r: MandatoryRow): MandatoryProduct {
  const s = MANDATORY_SECTORS[r[1]];
  return { code: r[0], sectorIndex: r[1], sectorAr: s[0], sectorEn: s[1], nameAr: r[2], nameEn: r[3], ceilingPct: r[4], govEffective: r[5], soeEffective: r[6], cert: r[7], certFrom: r[8] };
}

let cache: MandatoryProduct[] | null = null;
let hay: string[] | null = null;
export function allMandatoryProducts(): MandatoryProduct[] {
  if (!cache) cache = MANDATORY_ROWS.map(toProduct);
  return cache;
}
/** Code + normalised Arabic + normalised English name, built once: keystroke searches then do a single includes() per row. */
function haystacks(): string[] {
  if (!hay) hay = allMandatoryProducts().map(p => p.code + '\u0001' + norm(p.nameAr) + '\u0001' + norm(p.nameEn));
  return hay;
}
export function mandatorySectors(): { index: number; ar: string; en: string; count: number }[] {
  const counts = new Map<number, number>();
  for (const r of MANDATORY_ROWS) counts.set(r[1], (counts.get(r[1]) ?? 0) + 1);
  return MANDATORY_SECTORS.map((s, i) => ({ index: i, ar: s[0], en: s[1], count: counts.get(i) ?? 0 }));
}

const norm = (s: string): string =>
  s.toLowerCase().replace(/[ً-ٰٟـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').trim();

export interface MandatorySearch { query: string; sectorIndex?: number; buyer?: BuyerType; limit?: number }

/** Search by Etimad code or product name (Arabic or English). */
export function searchMandatory(opts: MandatorySearch): { total: number; items: MandatoryProduct[] } {
  const q = norm(opts.query);
  const limit = opts.limit ?? 50;
  const out: MandatoryProduct[] = [];
  let total = 0;
  const H = haystacks();
  for (let i = 0; i < H.length; i++) {
    const p = allMandatoryProducts()[i];
    if (opts.sectorIndex !== undefined && p.sectorIndex !== opts.sectorIndex) continue;
    if (opts.buyer === 'soe' && !p.soeEffective) continue;
    if (q && !H[i].includes(q)) continue;
    total++;
    if (out.length < limit) out.push(p);
  }
  return { total, items: out };
}

/** Effective date of the obligation for the buyer type, or null when the product is not on that buyer's list. */
export function effectiveDateFor(p: MandatoryProduct, buyer: BuyerType): string | null {
  return buyer === 'soe' ? p.soeEffective : p.govEffective;
}

export interface ExemptionPriceTest {
  /** Local premium over the highest foreign offer, as a fraction (0.12 = 12%). */
  premium: number;
  ceilingPct: number | null;
  exceedsCeiling: boolean | null;
  /** If the lowest local offer is above the ceiling, the document first requires negotiating the local offers down to the ceiling. */
  negotiateTargetPrice: number | null;
}

/** Exemption ground 4 (price): the gap between the highest foreign offer and the lowest local offer must exceed the ceiling. */
export function exemptionPriceTest(highestForeign: number, lowestLocal: number, ceilingPct: number | null): ExemptionPriceTest | null {
  if (!Number.isFinite(highestForeign) || !Number.isFinite(lowestLocal) || !(highestForeign > 0) || !(lowestLocal > 0)) return null;
  const premium = (lowestLocal - highestForeign) / highestForeign;
  if (ceilingPct === null) return { premium, ceilingPct, exceedsCeiling: null, negotiateTargetPrice: null };
  const exceeds = premium > ceilingPct / 100 + 1e-12;
  return { premium, ceilingPct, exceedsCeiling: exceeds, negotiateTargetPrice: exceeds ? highestForeign * (1 + ceilingPct / 100) : null };
}
