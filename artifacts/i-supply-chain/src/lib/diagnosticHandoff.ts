/**
 * Diagnostic → Maturity Assessment handoff (#142).
 *
 * The free Diagnostic and the paid Maturity Assessment use the same three
 * organisation-profile concepts (industry, company size, country) but each
 * tool grew its own option list independently, so the raw label strings a
 * Diagnostic report carries (report.industry / report.businessSize /
 * report.region) don't line up 1:1 with Maturity's intake ids
 * (INTAKE_INDUSTRIES / INTAKE_SIZES ids, and the country ids driving real
 * regulatory content in maturityData.tsx).
 *
 * These are pure mapping functions so a completed Diagnostic report can
 * link straight into a pre-filled Maturity intake instead of a blank one,
 * without duplicating the mapping logic inline wherever the link is built.
 *
 * Honesty rule: country is the one field that drives actual regulatory
 * content, not just a label, so it is only mapped where Maturity has a real,
 * researched module for that exact country (ksa/uae/qat/jor/omn/bhr today).
 * Every other Diagnostic region returns undefined rather than guessing —
 * an unmapped country left for the user to pick themselves is honest; a
 * wrong guess would silently show them another country's regulatory
 * content as if it were theirs.
 */

// Diagnostic's businessSize values (Diagnostic.tsx) -> Maturity's INTAKE_SIZES ids (maturityData.tsx)
const SIZE_MAP: Record<string, string> = {
  'Startup':            'startup',
  'SME':                'sme',
  'Mid-Market':         'midmarket',
  'Enterprise':         'enterprise',
  'Government Entity':  'government',
};

// Diagnostic's industry values -> Maturity's INTAKE_INDUSTRIES ids.
// Two Diagnostic categories have no direct Maturity equivalent, so they map
// to the closest real fit rather than 'other': Ecommerce shares Retail &
// Consumer Goods' distribution/fulfilment risk pattern; Food & Beverage is
// explicitly folded into Maturity's "FMCG & Food" category.
const INDUSTRY_MAP: Record<string, string> = {
  'Manufacturing':    'manufacturing',
  'Marine':           'marine',
  'Retail':           'retail',
  'FMCG':             'fmcg',
  'Pharma':           'pharma',
  'Logistics':        'logistics',
  'Energy':           'oil_gas',
  'Construction':     'construction',
  'Tech':             'technology',
  'Government':       'government',
  'Ecommerce':        'retail',
  'Food & Beverage':  'fmcg',
  'Healthcare':       'pharma',
};

// Diagnostic's region values -> Maturity's country ids. Deliberately only
// the 6 countries with a real, researched regulatory module — see module
// header for why the rest are left unmapped rather than guessed.
const COUNTRY_MAP: Record<string, string> = {
  'Saudi Arabia':          'ksa',
  'United Arab Emirates':  'uae',
  'Qatar':                 'qat',
  'Jordan':                'jor',
  'Oman':                  'omn',
  'Bahrain':                'bhr',
};

export function mapDiagnosticSize(businessSize: string): string | undefined {
  return SIZE_MAP[businessSize];
}

export function mapDiagnosticIndustry(industry: string): string | undefined {
  return INDUSTRY_MAP[industry];
}

export function mapDiagnosticCountry(region: string): string | undefined {
  return COUNTRY_MAP[region];
}

/**
 * Builds the /maturity query string for a completed Diagnostic report's
 * "Take the Full Maturity Assessment" CTA. Only includes params that have a
 * real mapping — an unmapped field is simply omitted so Maturity's intake
 * screen falls back to its own default/unselected state for that field
 * rather than receiving a fabricated value.
 */
export function buildMaturityHandoffQuery(report: { industry: string; businessSize: string; region: string }): string {
  const params = new URLSearchParams();
  const industry = mapDiagnosticIndustry(report.industry);
  const size     = mapDiagnosticSize(report.businessSize);
  const country  = mapDiagnosticCountry(report.region);
  if (industry) params.set('industry', industry);
  if (size)     params.set('size', size);
  if (country)  params.set('country', country);
  const qs = params.toString();
  return qs ? `/maturity?${qs}` : '/maturity';
}
