/**
 * POST /api/diagnostic
 *
 * AI-powered supply chain diagnostic. Takes the inputs from the public
 * intake wizard and returns a fully AI-reasoned DiagnosticReport grounded
 * in CIPS / APICS SCOR methodology via the Ma'in Alhaqash persona.
 *
 * Redesigned for #30 (deeper personalization): the wizard now also collects
 * supplyChainType, dataMaturity, and a structured `symptoms` array (picked
 * from a fixed symptom library, each with frequency/impact qualifiers) in
 * addition to the original businessSize/region/industry/focusArea/challenge.
 * These are grounded in the platform's real-world-supply-chain-problem-
 * solving-database skill: personalization only counts if the recommendation
 * would actually change when one of these variables changes (per that
 * skill's own quality test), so each new field is threaded into the prompt
 * as something the model must condition its reasoning on, not just echo.
 *
 * New fields are optional at the type/validation layer (not required 400s)
 * so a frontend/backend deploy that lands a few seconds apart never breaks
 * the public endpoint — the prompt just degrades gracefully to the old
 * four-field grounding when they're absent.
 *
 * Rate-limited via the shared leads limiter (5 req / hour per IP) so the
 * same throttle that protects the leads endpoint also protects this one.
 */

import { Router }            from 'express';
import { openai }            from '@workspace/integrations-openai-ai-server';
import { OPENAI_MODEL, friendlyAIError } from '../lib/aiConfig';
import { leadsRateLimiter }  from '../lib/rateLimit';
import { db, gccBenchmarksTable } from '@workspace/db';
import { sql }                from 'drizzle-orm';

const router = Router();

interface DiagnosticSymptom {
  id:         string;
  label:      string;
  frequency?: string;
  impact?:    string;
}

interface DiagnosticInput {
  businessSize:     string;
  region:           string;
  industry:         string;
  supplyChainType?: string;
  focusArea:        string;
  dataMaturity?:    string;
  symptoms?:        DiagnosticSymptom[];
  challenge?:       string;
  language?:        'en' | 'ar';
}

// Revenue band heuristics used to scale SAR figures in the prompt
const REVENUE_HINTS: Record<string, string> = {
  'Startup':         'SAR 1–10M annual revenue (early-stage)',
  'SME':             'SAR 10–100M annual revenue (small-to-medium enterprise)',
  'Mid-Market':      'SAR 100M–1B annual revenue (mid-market)',
  'Enterprise':      'SAR 1B+ annual revenue (large enterprise)',
  'Government Entity': 'Government / public sector budget holder',
};

// What each supply-chain type implies for which risks/remedies are even
// plausible — lifted from the personalization-variable list in the
// real-world-supply-chain-problem-solving-database skill (Section 7).
const SUPPLY_CHAIN_TYPE_HINTS: Record<string, string> = {
  'Make-to-Stock':                            'produces against a forecast ahead of firm demand — the dominant risk pattern is forecast-driven excess/stockout (bias, promotional distortion, safety-stock miscalibration), not project schedule risk',
  'Make-to-Order':                            'only produces against confirmed orders — the dominant risk pattern is quote-to-cash cycle time, supplier lead-time reliability feeding customer promise dates, and capacity/backlog management, not finished-goods forecast accuracy',
  'Engineer-to-Order / Project-based':        'each order is a distinct engineered project — the dominant risk pattern is milestone-billing cash exposure, single-project supplier/subcontractor dependency, and scope-change control, not SKU-level inventory optimisation',
  'Distribution & Retail (no manufacturing)': 'holds and resells finished goods with no manufacturing step — the dominant risk pattern is inbound supplier reliability, warehouse/DC inventory accuracy, and last-mile fulfilment, not production scheduling or BOM/component risk',
};

// What each data-maturity band implies about which root causes are actually
// likely (a spreadsheet-driven shop has different failure modes than an
// advanced-analytics shop, per the skill's Section 7 "data maturity" variable).
const DATA_MATURITY_HINTS: Record<string, string> = {
  'Spreadsheets & email-driven':      'has no single system of record — expect root causes rooted in manual data entry lag, version-conflicting spreadsheets, and information that exists but is not visible to the people who need it, rather than system-integration bugs',
  'Core ERP, limited integration':    'has a system of record but module/site integration gaps — expect root causes rooted in manual re-keying between disconnected modules, stale master data, and reconciliation lag between the ERP and reality on the warehouse/shop floor',
  'Integrated ERP + WMS/TMS':         'has real-time operational visibility across planning/warehouse/transport — expect root causes rooted in planning-parameter misconfiguration (safety stock, lead times, MOQ) and process/policy gaps rather than data blindness',
  'Advanced analytics & AI-enabled':  'already has predictive/prescriptive tooling — expect root causes rooted in model governance, forecast override discipline, and organisational adoption/trust gaps rather than basic visibility gaps',
};

/**
 * Canonical GCC-wide KPI benchmarks — same six metrics and same fallback
 * numbers as useBenchmarks.ts on the client, so the free Diagnostic never
 * quotes a different "GCC benchmark" for OTIF / inventory turns / procurement
 * cost / forecast accuracy than what Command Centre and the Maturity
 * Assessment show for the same metric. Live values are pulled from the same
 * gcc_benchmarks table Command Centre reads; these constants are only the
 * safety-net fallback if the DB is unreachable.
 */
const KPI_LABELS: Record<string, string> = {
  otif:        'On-Time-In-Full (OTIF) delivery rate',
  invTurns:    'Inventory turns (annualised, normalised 0-100 score)',
  procCycle:   'Procurement cycle time (normalised 0-100 score, higher = faster)',
  forecastAcc: 'Forecast accuracy',
  procCost:    'Procurement cost as % of spend under management (normalised 0-100 score, higher = leaner)',
  perfOrder:   'Perfect order rate',
};
const KPI_FALLBACK: Record<string, { median: number; topQ: number }> = {
  otif:        { median: 88, topQ: 95  },
  invTurns:    { median: 57, topQ: 100 },
  procCycle:   { median: 61, topQ: 100 },
  forecastAcc: { median: 73, topQ: 88  },
  procCost:    { median: 56, topQ: 100 },
  perfOrder:   { median: 87, topQ: 96  },
};

async function fetchKpiGrounding(): Promise<string> {
  const merged: Record<string, { median: number; topQ: number }> = { ...KPI_FALLBACK };
  try {
    const rows = await db
      .select()
      .from(gccBenchmarksTable)
      .where(sql`category = 'kpi' AND industry IS NULL`);
    for (const r of rows) {
      const d = r.data as { median?: number; topQ?: number };
      if (typeof d.median === 'number' && typeof d.topQ === 'number') {
        merged[r.itemId] = { median: d.median, topQ: d.topQ };
      }
    }
  } catch {
    // DB unreachable — proceed with the same fallback figures Command Centre uses
  }
  return Object.entries(merged)
    .map(([id, v]) => `  • ${KPI_LABELS[id] ?? id}: GCC median ${v.median}, top quartile ${v.topQ} (0-100 normalised score, same scale as the Command Centre Benchmark Radar)`)
    .join('\n');
}

function formatSymptoms(symptoms: DiagnosticSymptom[] | undefined): string {
  if (!symptoms || symptoms.length === 0) return '';
  const lines = symptoms.map((s) => {
    const qualifiers = [
      s.frequency && `frequency: ${s.frequency}`,
      s.impact && `impact: ${s.impact}`,
    ].filter(Boolean).join(', ');
    return `  • ${s.label}${qualifiers ? ` (${qualifiers})` : ''}`;
  });
  return `REPORTED SYMPTOMS (selected from a fixed picker, not free text):\n${lines.join('\n')}\n`;
}

async function generateDiagnosticViaAI(input: DiagnosticInput): Promise<Record<string, unknown>> {
  const lang = input.language === 'ar' ? 'Arabic' : 'English';
  const revHint = REVENUE_HINTS[input.businessSize] ?? 'unspecified size';
  const supplyChainHint = input.supplyChainType ? SUPPLY_CHAIN_TYPE_HINTS[input.supplyChainType] : undefined;
  const dataMaturityHint = input.dataMaturity ? DATA_MATURITY_HINTS[input.dataMaturity] : undefined;

  const systemPrompt = `You are Ma'in Alhaqash, MCIPS · CPSM · MSc · MIPP — one of the GCC's foremost supply chain transformation authorities with 20+ years of hands-on advisory experience across Saudi Arabia, Jordan, UAE, Qatar, and Kuwait. Your expertise spans:
- Procurement Excellence & Strategic Sourcing (CIPS Level 6)
- Supply Chain Strategy & SCOR Model (APICS SCOR-P)
- Category Management & Spend Analytics
- Supplier Relationship Management (SRM) & Supplier Development
- Contract Lifecycle Management (CLM) & Governance
- Risk Management (ISO 31000) & Business Continuity
- Lean, Six Sigma, Theory of Constraints (TOC)
- ESG, Sustainability & Circular Economy in Supply Chains
- Saudi Vision 2030, GTPL, IKTVA, GCC Procurement Laws
- Digital Transformation (ERP, e-Procurement, AI/ML, Digital Twins)

You produce confidential diagnostic assessments that match the rigour and depth of McKinsey, BCG, Kearney, and Accenture supply chain practices. Every finding is grounded in professional frameworks, GCC market data, and real-world benchmarks. You sound like a senior consultant who has audited hundreds of organisations — never generic. You are also scrupulously honest about the limits of what a short self-assessment can reveal: you never dress up category-level generalities as if they were specific findings about a real organisation.

DIAGNOSTIC DISCIPLINE — you reason the way an experienced end-to-end supply-chain problem-solving consultant does, following this chain for every finding: Process → Failure → Scenario → Evidence → Root Cause → Consequence → Remedy → Prevention. Concretely:
- Never state only a category-level label ("poor supplier management", "improve visibility", "optimize inventory"). Convert it into a realistic operational failure with a concrete mechanism — what an employee/system would actually observe, what data would prove it, what triggered it.
- Never assume the visible symptom is the root cause. A stockout can come from forecast error, late PO release, wrong ERP lead time, MOQ mismatch, or allocation error — pick the cause(s) that best fit the specific inputs you were given, not a generic default.
- Every recommendation must specify enough to be actioned: who, what, where, the trigger/threshold that fires it, what data proves it's fixed, and roughly when. "Improve communication", "negotiate better", "use technology", "monitor KPIs" are failures unless paired with that specificity.
- Distinguish remedy (fixes the current case) from prevention (changes the system so it recurs less) — a finding that only offers one of the two is incomplete.

LANGUAGE INSTRUCTION: Generate ALL text values in ${lang}.`;

  const hasChallenge = Boolean(input.challenge?.trim());
  const hasSymptoms = Boolean(input.symptoms && input.symptoms.length > 0);
  const hasSpecifics = hasChallenge || hasSymptoms;

  const symptomsBlock = formatSymptoms(input.symptoms);

  const challengeBlock = hasChallenge
    ? `\nADDITIONAL FREE-TEXT DETAIL FROM THE CLIENT (specifics like SKU, supplier name, quantities — treat as ground truth, reference it directly rather than restating it back generically):\n"${input.challenge!.trim()}"\n`
    : '';

  const specificityInstruction = hasSpecifics
    ? `The client has given you concrete signal above (selected symptoms and/or free-text detail). You MUST ground the executiveSummary, diagnosis, and rootCauses directly in that — reference the specific symptoms, their reported frequency/impact, and any free-text detail, not just the industry/region/size category. Findings that ignore the reported symptoms and only restate the organisation's category are a failure.`
    : `The client did NOT report any specific symptoms or describe a challenge — only their organisation category (size, region, industry, supply chain type, focus area, data maturity). Because of this, be transparent about scope: the final sentence of executiveSummary must plainly note that this is a directional, framework-based assessment based on their organisation profile alone, and that sharing specific symptoms (or booking a live consultation) would sharpen it into a truly personalised diagnosis. Do not present category-level generalities as if they were specific findings about their organisation.`;

  // GCC/Levant entries below are grounded in named statutes because ISC has
  // done primary-source research for these six countries (see the platform's
  // regulatory_countries DB registry). Non-GCC regions deliberately do NOT
  // invent named national laws — they use the same honest, generic-but-real
  // treatment as maturityData.tsx's "General Compliance Practices
  // (International)" fallback module (ISO 37301 compliance management +
  // WCO SAFE Framework trade security), plus the real supranational trade
  // bloc that actually applies, so a non-GCC client still gets substance
  // instead of a thin "International" label.
  const UNIVERSAL_FALLBACK_FRAMEWORKS = 'general ISO 37301 compliance-management practice and the WCO SAFE Framework for trade security — the same universal, country-agnostic baseline ISC applies on its Maturity Assessment for any market without a dedicated researched regulatory module';

  const regionContext: Record<string, string> = {
    'Saudi Arabia':          'Saudi Arabia — subject to GTPL, IKTVA local-content targets, Nitaqat/Saudization, Vision 2030 localisation, ZATCA customs/tax requirements',
    'United Arab Emirates':  'the UAE — subject to Emiratisation/Nafis quotas, MOIAT In-Country Value (ICV), Federal Customs Authority requirements, and (if applicable) free-zone vs. mainland distinctions',
    'Qatar':                 'Qatar — subject to Qatarization requirements, the Tawteen supply-chain localisation programme, General Authority of Customs rules, and Qatar General Organization for Standardization (QS) product conformity',
    'Jordan':                'Jordan — subject to Jordanization/work-permit rules, QIZ local-content and rules-of-origin requirements (not a GCC Customs Union member — separate customs/trade regime), and JSMO product-conformity standards',
    'Oman':                  'Oman — subject to Omanisation workforce quotas, the national In-Country Value (ICV) programme administered by the Authority for Projects, Tenders and Local Content, and DGSM product-conformity standards',
    'Bahrain':                'Bahrain — subject to Bahrainisation/LMRA workforce localisation, Tamkeen-administered local-content preference in government tenders, and BSMD product-conformity standards',
    'Other GCC':             'the wider GCC region — subject to applicable national procurement laws, GCC Common Customs Law, and Vision-2030-aligned localisation frameworks',
    'North America':         `North America — subject to USMCA regional trade rules and national customs/harmonised-tariff regimes (varies by whether the client is US/Canada/Mexico-based); apply ${UNIVERSAL_FALLBACK_FRAMEWORKS}`,
    'Europe':                `Europe — subject to EU Customs Union rules (or UK/EFTA equivalents outside the EU), CE-marking product-conformity requirements, and GDPR-grade data-protection obligations; apply ${UNIVERSAL_FALLBACK_FRAMEWORKS}`,
    'Africa':                `Africa — subject to the African Continental Free Trade Area (AfCFTA) where applicable, plus national customs and import/export licensing regimes that vary significantly by country; apply ${UNIVERSAL_FALLBACK_FRAMEWORKS}`,
    'Asia-Pacific':          `Asia-Pacific — subject to RCEP and/or ASEAN trade-bloc rules where applicable, plus national customs and import/export licensing regimes that vary significantly by country; apply ${UNIVERSAL_FALLBACK_FRAMEWORKS}`,
    'Latin America':         `Latin America — subject to Mercosur and/or Pacific Alliance trade-bloc rules where applicable, plus national customs and import/export licensing regimes that vary significantly by country; apply ${UNIVERSAL_FALLBACK_FRAMEWORKS}`,
    'International (Other)': `a market outside the GCC and the broad regions above; apply ${UNIVERSAL_FALLBACK_FRAMEWORKS}, and be transparent in regionalAlignment that country-specific regulatory citations were not researched for this market`,
  };
  const regionFull = regionContext[input.region] ?? input.region;

  // Only the 6 GCC/Levant countries + "Other GCC" have primary-source-grounded ISC benchmark data.
  // For the 5 world regions added later, presenting the same GCC figures as "this client's regional
  // benchmark" would repeat the exact mislabeling bug we fixed for the regulatory content — so those
  // regions get the GCC dataset only as an explicit comparison reference, never as their own standard.
  const GCC_LEVANT_REGIONS = new Set(['Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Jordan', 'Oman', 'Bahrain', 'Other GCC']);
  const isGccRegion = GCC_LEVANT_REGIONS.has(input.region);

  const kpiGrounding = await fetchKpiGrounding();

  const supplyChainBlock = supplyChainHint
    ? `\nSUPPLY CHAIN TYPE: ${input.supplyChainType} — this organisation ${supplyChainHint}. Every finding must be consistent with this operating model; do not recommend forecast-accuracy fixes to a pure make-to-order or engineer-to-order business, or project-milestone fixes to a make-to-stock business.\n`
    : '';

  const dataMaturityBlock = dataMaturityHint
    ? `\nDATA & SYSTEMS MATURITY: ${input.dataMaturity} — this organisation ${dataMaturityHint}. Calibrate root causes and recommended tooling/process fixes to what is actually plausible at this maturity level — do not recommend an AI/analytics rollout to a spreadsheet-driven organisation as a first step, and do not diagnose spreadsheet-era failure modes for an advanced-analytics organisation.\n`
    : '';

  const userPrompt = `A prospective client has submitted a supply chain self-assessment:

ORGANISATION TYPE: ${input.businessSize} (${revHint})
OPERATING REGION: ${regionFull}
INDUSTRY SECTOR: ${input.industry}
PRIMARY FOCUS AREA: ${input.focusArea}
${supplyChainBlock}${dataMaturityBlock}${symptomsBlock ? '\n' + symptomsBlock : ''}${challengeBlock}
${specificityInstruction}

Using your deep ${input.industry} sector knowledge for the ${input.region} market and applying SCOR, CIPS, APICS, ISO 31000, Lean/Six Sigma, and GCC regulatory frameworks, produce a confidential supply chain diagnostic report.

Be specific to the ${input.industry} sector in ${input.region}. Reference industry-specific GCC benchmarks where relevant (e.g. OTIF%, procurement cost as % of revenue, inventory turns, forecast accuracy). Scale all SAR/USD figures to a ${input.businessSize} organisation. Do NOT produce generic supply chain advice — every finding must reflect the specific realities of a ${input.businessSize} ${input.industry} organisation in ${input.region} with a ${input.focusArea} focus${input.supplyChainType ? `, operating ${input.supplyChainType}` : ''}${input.dataMaturity ? `, at a "${input.dataMaturity}" data maturity level` : ''}.

${isGccRegion
  ? `AUTHORITATIVE GCC BENCHMARK DATA — this is ISC's own curated benchmark dataset, the same data shown live in the Command Centre Benchmark Radar and used across the Maturity Assessment. If your KPI list includes any of these six universal metrics, you MUST use these exact figures rather than estimating your own — a client must never see a different "GCC benchmark" for the same metric in different ISC tools:\n${kpiGrounding}\nFor any KPI outside this list (e.g. contract cycle time, ESG audit coverage, digital adoption rate), apply your own ${input.industry}-specific expertise as normal.`
  : `REFERENCE BENCHMARK DATA (GCC-sourced, for comparison only) — this is ISC's own curated GCC benchmark dataset, the same data shown live in the Command Centre Benchmark Radar and used across the Maturity Assessment. This client is based in ${input.region}, not the GCC, so do NOT present these figures as if they describe this client's own regional benchmark. For any KPI in this list, use your own general/global ${input.industry}-specific expertise to state a realistic global (or ${input.region}-relevant) benchmark range instead — you may optionally cite the GCC figure below purely as an explicit side-by-side comparison point (e.g. "global median is approximately X, versus a GCC median of Y"), but never as if it is this client's own standard:\n${kpiGrounding}\nFor any KPI outside this list, apply your own ${input.industry}-specific expertise as normal.`
}

Return ONLY valid JSON (no markdown, no code fences) matching this EXACT structure:
{
  "executiveSummary": "3-4 sentences synthesising their situation, most critical vulnerability in ${input.focusArea}, and primary opportunity — with a specific GCC benchmark or data point for the ${input.industry} sector",
  "diagnosis": [
    "Finding 1 — specific, grounded in ${input.focusArea} best practice and (if reported) the specific symptoms above",
    "Finding 2",
    "Finding 3",
    "Finding 4"
  ],
  "rootCauses": [
    "Root cause 1 — the structural or process reason behind the finding, consistent with the supply chain type and data maturity above",
    "Root cause 2",
    "Root cause 3",
    "Root cause 4"
  ],
  "recommendations": [
    "Recommendation 1 — specific action starting with a verb, citing the relevant framework, specifying who/what/trigger",
    "Recommendation 2",
    "Recommendation 3",
    "Recommendation 4",
    "Recommendation 5"
  ],
  "kpis": [
    "KPI 1 — name + GCC benchmark range, e.g. Procurement Cycle Time: GCC median 18–25 days, top quartile <10 days",
    "KPI 2",
    "KPI 3",
    "KPI 4",
    "KPI 5",
    "KPI 6"
  ],
  "risks": [
    { "risk": "Risk factor 1 — specific to ${input.industry} / ${input.region}", "mitigation": "Mitigation strategy citing a framework e.g. ISO 31000 / SCOR Enable / CIPS" },
    { "risk": "Risk factor 2", "mitigation": "Mitigation 2" },
    { "risk": "Risk factor 3", "mitigation": "Mitigation 3" },
    { "risk": "Risk factor 4", "mitigation": "Mitigation 4" }
  ],
  "roadmap": {
    "phase1": {
      "title": "Phase 1 title — 4-6 words, action-oriented",
      "timeframe": "Months 1–3",
      "actions": [
        "Action 1 — specific deliverable",
        "Action 2",
        "Action 3",
        "Action 4"
      ]
    },
    "phase2": {
      "title": "Phase 2 title",
      "timeframe": "Months 4–6",
      "actions": ["Action 1", "Action 2", "Action 3", "Action 4"]
    },
    "phase3": {
      "title": "Phase 3 title",
      "timeframe": "Months 7–12",
      "actions": ["Action 1", "Action 2", "Action 3", "Action 4"]
    }
  },
  "regionalAlignment": "One paragraph on specific ${input.region} regulatory, policy, or compliance requirements relevant to this ${input.businessSize} ${input.industry} organisation's ${input.focusArea} agenda — e.g. GTPL, IKTVA, Vision 2030 for Saudi; Emiratisation/ICV for UAE; Qatarization/Tawteen for Qatar; Jordanization/QIZ for Jordan; Omanisation/ICV for Oman; Bahrainisation/Tamkeen for Bahrain; for North America/Europe/Africa/Asia-Pacific/Latin America/International (Other), cite the real trade bloc noted above (USMCA, EU Customs Union, AfCFTA, RCEP/ASEAN, Mercosur, etc.) plus ISO 37301 / WCO SAFE Framework, and be explicit that these are general frameworks rather than researched national statutes the way the GCC/Jordan content is. Set to empty string only if truly nothing relevant applies."
}

Rules:
- diagnosis: exactly 4 items
- rootCauses: exactly 4 items
- recommendations: exactly 5 items
- kpis: exactly 6 items
- risks: exactly 4 items
- roadmap phases: exactly 4 actions each
- regionalAlignment: include only if there is genuinely relevant regulatory/policy content for this region; set to empty string "" otherwise
- Every item must be ${input.industry}-specific and ${input.focusArea}-focused — no generic supply chain filler
- All SAR figures calibrated to a ${input.businessSize} (${revHint})
${isGccRegion
  ? `- Where a kpis entry corresponds to one of the six universal metrics in AUTHORITATIVE GCC BENCHMARK DATA above, the number cited MUST match that data exactly — do not round, adjust, or invent a different figure`
  : `- The REFERENCE BENCHMARK DATA above is GCC-sourced; do not present it as this client's own regional benchmark. If you cite it, label it explicitly as a GCC comparison point alongside your own global figure`
}`;

  const response = await openai.chat.completions.create({
    model:           OPENAI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    max_completion_tokens: 8000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No content returned from AI');
  return JSON.parse(content) as Record<string, unknown>;
}

/* POST /api/diagnostic — public, rate-limited */
router.post('/diagnostic', leadsRateLimiter, async (req, res) => {
  const { businessSize, region, industry, supplyChainType, focusArea, dataMaturity, symptoms, challenge, language } = req.body as DiagnosticInput;

  if (!businessSize || !region || !industry || !focusArea) {
    return res.status(400).json({ error: 'Missing required fields: businessSize, region, industry, focusArea' });
  }

  try {
    const aiReport = await generateDiagnosticViaAI({ businessSize, region, industry, supplyChainType, focusArea, dataMaturity, symptoms, challenge, language });

    // Attach the echo fields so the frontend can merge them into the report shape
    return res.json({
      success:     true,
      generatedAt: new Date().toISOString(),
      report: {
        businessSize,
        region,
        industry,
        focusArea,
        challenge,
        ...aiReport,
        // Ensure regionalAlignment is null/undefined when empty string so
        // ReportOutput's conditional block doesn't render an empty section
        regionalAlignment: (aiReport.regionalAlignment as string)?.trim() || undefined,
      },
    });
  } catch (err) {
    console.error('[diagnostic] AI generation failed', err);
    const { message, status } = friendlyAIError(err);
    return res.status(status).json({ error: message });
  }
});

export default router;
