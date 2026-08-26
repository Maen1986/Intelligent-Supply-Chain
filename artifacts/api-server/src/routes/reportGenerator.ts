import { Router }   from 'express';
import { openai }   from '@workspace/integrations-openai-ai-server';
import { OPENAI_MODEL, friendlyAIError } from '../lib/aiConfig';
import { requireSession }            from '../middlewares/requireSession';
import { getEntitledSegments, gateRemedyActions, entitledTitlesFrom } from '../lib/entitlements';

const router = Router();

/* ── Types ──────────────────────────────────────────────────────────────── */

interface SegmentScore {
  id:    string;
  title: string;
  score: number;
  level: string;
  gccAvg?:   number;
  globalAvg?: number;
  bestClass?: number;
}

interface RemedyItem {
  segmentTitle:     string;
  subQuestion?:     string;
  specificGap?:     string;
  action:           string;
  framework?:       string;
  measurableTarget?: string;
  effort?:          string;
}

interface Remedies {
  executiveSummary?: string;
  days30?:          RemedyItem[];
  days60?:          RemedyItem[];
  days90?:          RemedyItem[];
  estimatedImpact?: string;
}

/**
 * One saved TCO Engine analysis, summarised for the report prompt (#168/#170
 * TCO reporting, 2026-08-23). Shape matches the "best supplier" row the
 * frontend already computes in ProcurementTools.tsx's tcoPortfolio -- see
 * ReportGenerator.tsx for the equivalent computation on this page, kept in
 * sync deliberately so the number a client sees on the TCO tab is the same
 * number that lands in this report. No entitlement gating here (unlike
 * maturityData) -- TCO analyses are not part of the module paywall, and this
 * is the client's own account data, session-scoped like every other
 * /api/tco-* route.
 */
interface TcoAnalysisSummary {
  name:             string;
  itemName?:        string | null;
  bestSupplierName?: string | null;
  bestTcoPerUnit:   number;
  bestTcoAnnual?:   number | null;
  savingsPct?:      number | null;
  supplierCount:    number;
}

export interface ReportInput {
  tier:         'sme_growth' | 'startup' | 'mid_market';
  contactInfo:  { name: string; company: string; industry: string; companySize: string; email?: string };
  maturityData?: {
    overallScore:   number;
    overallLevel:   string;
    segmentScores:  SegmentScore[];
    remedies?:      Remedies;
  };
  /** Client's own saved TCO Engine analyses, best-supplier summary only. */
  tcoData?:     TcoAnalysisSummary[];
  language?:    'en' | 'ar';
}

/* ── POST /api/report/generate ───────────────────────────────────────────── */

router.post('/generate', requireSession, async (req, res) => {
  try {
    const input = req.body as ReportInput;
    if (!input?.contactInfo?.name || !input?.contactInfo?.company) {
      return res.status(400).json({ error: 'contactInfo.name and contactInfo.company are required' });
    }

    const { contactInfo, language, tcoData } = input;
    const lang = language === 'ar' ? 'Arabic' : 'English';

    // #188: never trust the client's maturityData for gated content --
    // the client already filters what it sends, but a manipulated request
    // could ask for a full report on segments outside a purchased module.
    // Re-derive entitlement server-side and re-filter before this ever
    // reaches the AI prompt. Ownership enforced at the data level, same
    // principle maturitySnapshots.ts already uses for its own reads.
    const userId = res.locals.userId as number;
    let maturityData = input.maturityData;
    if (maturityData) {
      const entitledSegmentIds = await getEntitledSegments(userId);
      const entitledTitles = entitledTitlesFrom(entitledSegmentIds, maturityData.segmentScores);
      maturityData = {
        ...maturityData,
        segmentScores: maturityData.segmentScores.filter(s => entitledSegmentIds.has(s.id)),
        remedies: gateRemedyActions(entitledTitles, maturityData.remedies),
      };
    }

    /* ── Build context strings ── */
    const maturityContext = maturityData
      ? `
MATURITY ASSESSMENT RESULTS:
Overall Score: ${maturityData.overallScore.toFixed(2)}/5.0 — Level: ${maturityData.overallLevel}

Segment Scores:
${maturityData.segmentScores.map(s =>
  `  ${s.title}: ${s.score.toFixed(2)}/5.0 (${s.level})${s.gccAvg != null ? ` | GCC Avg: ${s.gccAvg}` : ''}${s.bestClass != null ? ` | Best-in-Class: ${s.bestClass}` : ''}`
).join('\n')}

${maturityData.remedies?.executiveSummary
  ? `AI Remediation Summary: ${maturityData.remedies.executiveSummary}`
  : ''}

${maturityData.remedies?.days30?.length
  ? `Priority 30-day actions:\n${maturityData.remedies.days30.map(r => `  • ${r.action} [${r.framework ?? ''}]`).join('\n')}`
  : ''}
${maturityData.remedies?.days60?.length
  ? `60-day actions:\n${maturityData.remedies.days60.map(r => `  • ${r.action} [${r.framework ?? ''}]`).join('\n')}`
  : ''}
${maturityData.remedies?.days90?.length
  ? `90-day actions:\n${maturityData.remedies.days90.map(r => `  • ${r.action} [${r.framework ?? ''}]`).join('\n')}`
  : ''}
${maturityData.remedies?.estimatedImpact
  ? `Estimated Financial Impact: ${maturityData.remedies.estimatedImpact}`
  : ''}`.trim()
      : 'No maturity assessment data provided — use industry knowledge to benchmark.';

    // #168/#170 (TCO reporting, 2026-08-23) -- fold the client's own saved
    // TCO Engine analyses into the prompt when present, so cost/ROI figures
    // in gapAnalysis, strategicRecommendations, and investmentProjection can
    // be grounded in the client's real numbers instead of invented ones.
    // Absent entirely (not even an empty-state string) when the account has
    // no saved analyses, so the prompt reads identically to before this
    // feature for every client who never used the TCO Engine.
    const tcoContext = tcoData && tcoData.length > 0
      ? `
TCO ENGINE ANALYSES ON FILE (client's own saved cost comparisons):
${tcoData.map(t => {
  const parts = [`  "${t.name}"${t.itemName ? ` (${t.itemName})` : ''}: best TCO SAR ${t.bestTcoPerUnit.toLocaleString(undefined, { maximumFractionDigits: 2 })}/unit`];
  if (t.bestSupplierName) parts.push(`via ${t.bestSupplierName}`);
  if (t.bestTcoAnnual != null) parts.push(`(SAR ${t.bestTcoAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr)`);
  if (t.savingsPct != null && t.savingsPct > 0) parts.push(`-- ${t.savingsPct.toFixed(1)}% savings potential vs. costliest supplier compared, across ${t.supplierCount} suppliers`);
  return parts.join(' ');
}).join('\n')}

Use these real, client-specific TCO figures wherever cost, savings, or ROI claims are made -- do not invent SAR figures for categories where the client already has a real analysis on file. Where no TCO analysis exists for a category discussed, say so plainly and estimate from industry knowledge instead.`.trim()
      : '';

    const systemPrompt = `You are Ma'in Alhaqash, MCIPS · CPSM · MSc · MIPP — the GCC's foremost supply chain transformation authority with 20+ years across Saudi Arabia, UAE, Qatar, Jordan, and Kuwait. You author premium, board-ready strategy reports for organisations undergoing supply chain transformation.

Your writing is authoritative, specific, and GCC-contextualised. You name real frameworks (CIPS Category Cube, SCOR-P, Kraljic, ISO 31000, DMAIC, S&OP, IKTVA, GTPL, etc.). You quantify impacts in SAR. You never write generic advice — every sentence must be calibrated to the specific client's industry, size, and maturity level.

DECISION-READY OUTPUT (#155): never hand the reader a raw number and leave them to translate it into a decision themselves -- do that translation for them. A number that only states the metric, with no stated business consequence or recommended response, is incomplete. Every section should already state the decision-relevant fact, not just the metric behind it.

LANGUAGE: Respond entirely in ${lang}.`;

    const userPrompt = `Generate a comprehensive Supply Chain Strategy Report for:

CLIENT: ${contactInfo.name}
COMPANY: ${contactInfo.company}
INDUSTRY: ${contactInfo.industry}
ORGANISATION SIZE: ${contactInfo.companySize}
PACKAGE TIER: SME Growth — 30-page Strategy Report + 6-Month Implementation Roadmap

${maturityContext}
${tcoContext ? `\n${tcoContext}\n` : ''}
Generate a full strategy report with EIGHT sections, each substantive and deeply tailored to this specific client. Return ONLY valid JSON (no markdown fences) with this exact structure:

{
  "reportTitle": "Supply Chain Strategy Report: [Company Name]",
  "reportSubtitle": "SME Growth Programme — Strategic Assessment & 6-Month Transformation Roadmap",
  "executiveSummary": {
    "headline": "One-sentence strategic verdict",
    "body": "5–6 paragraphs: (1) who the client is and their strategic context, (2) what the assessment found — the overall maturity picture with specific scores cited, (3) the single most critical dependency chain blocking improvement, (4) the 3 highest-leverage opportunities found, (5) the 6-month transformation vision and its measurable endpoint, (6) a call to action. Be specific with numbers, GCC benchmarks, and SAR impact estimates.",
    "considerAlso": "The strongest honest counter-argument to this report's central strategic verdict -- e.g. a reason the top priority might not be the right one to start with, a resourcing or dependency risk to the sequencing, or a condition under which the recommended pace would be wrong for this client. Must be specific to this client's data, never a generic caveat like \"more data could change this\". One or two sentences. Never omit this even when confident."
  },
  "evidenceSummary": {
    "dataUsed": ["specific input this report is grounded in, e.g. \"Overall maturity score: X/5\"", "specific segment scores or remedy actions referenced above, or \"industry knowledge (no maturity assessment on file)\" if none was provided", "if TCO Engine analyses were provided above, name them here too, e.g. \"TCO analysis: [name] -- SAR X/unit\""],
    "assumptions": ["assumption made where the client's data did not specify enough to be precise"],
    "confidence": "<0-100, overall confidence in this report's findings given what was actually provided. Calibrate honestly: 85-100 only with a full maturity assessment on file behind it, 60-84 for partial assessment data, below 60 when the client provided no maturity assessment (\"use industry knowledge to benchmark\" case above). Do not default high out of politeness>"
  },
  "companyContext": {
    "headline": "Organisation & Industry Context",
    "body": "3–4 paragraphs: (1) their industry's current dynamics in the GCC/Saudi market (include Vision 2030 implications where relevant), (2) typical supply chain maturity challenges at their size and sector, (3) what 'good' looks like for a comparable organisation in their industry — specific GCC benchmarks and case examples, (4) how their current position maps onto that landscape."
  },
  "maturityAnalysis": {
    "headline": "Current Maturity State: Detailed Analysis",
    "body": "4–5 paragraphs diving deep into their scores — what each major finding means operationally and financially, how segments compare to GCC and global peers, root causes behind the weakest areas.",
    "keyStrengths": ["3–4 specific strengths as complete sentences, each citing a segment score or evidence"],
    "criticalGaps": ["4–5 specific gaps as complete sentences, each naming the segment, the exact gap, and its business impact in SAR or operational terms"],
    "benchmarkInsight": "2-paragraph comparison against GCC industry peers and best-in-class, with specific delta values"
  },
  "gapAnalysis": {
    "headline": "Gap Analysis & Root Cause Assessment",
    "body": "3–4 paragraphs framing the gap analysis methodology and major themes",
    "priorityGaps": [
      {
        "rank": 1,
        "area": "Specific segment or capability area",
        "currentState": "What they have today — be concrete",
        "targetState": "What good looks like — cite a GCC benchmark or best-in-class standard",
        "rootCause": "The underlying organisational or process cause",
        "businessImpact": "SAR-quantified or operationally-quantified impact of the gap",
        "interdependencies": "Other gaps this one blocks or is blocked by"
      }
    ]
  },
  "strategicRecommendations": [
    {
      "title": "Recommendation title",
      "priority": "Critical / High / Medium",
      "description": "3–4 paragraphs: what to do, why it matters for this specific client, what it will unlock, and the GCC/Saudi market context",
      "framework": "Specific named framework or standard (e.g. CIPS Category Cube, not 'category management')",
      "timeframe": "30 days / 60 days / 90 days / 6 months",
      "expectedOutcome": "Specific measurable outcome with SAR or % target",
      "kpis": ["3–4 specific KPIs to track progress, with current baseline implied and target stated"],
      "implementationSteps": ["4–5 concrete steps to execute this recommendation"]
    }
  ],
  "implementationRoadmap": {
    "headline": "6-Month Transformation Roadmap",
    "overview": "2 paragraphs: the transformation philosophy, sequencing rationale, and how phases build on each other",
    "phase1": {
      "title": "Phase 1 — Foundation & Quick Wins (Months 1–2)",
      "objective": "What this phase achieves",
      "activities": ["6–8 specific activities"],
      "milestones": ["3–4 measurable milestones with target dates"],
      "resources": "Team, tools, and budget guidance for this size of organisation",
      "risks": ["2–3 risks to manage in this phase"]
    },
    "phase2": {
      "title": "Phase 2 — Process Formalisation (Months 3–4)",
      "objective": "...",
      "activities": ["6–8 activities"],
      "milestones": ["3–4 milestones"],
      "resources": "...",
      "risks": ["2–3 risks"]
    },
    "phase3": {
      "title": "Phase 3 — Capability Scaling & Measurement (Months 5–6)",
      "objective": "...",
      "activities": ["6–8 activities"],
      "milestones": ["3–4 milestones"],
      "resources": "...",
      "risks": ["2–3 risks"]
    }
  },
  "investmentProjection": {
    "headline": "Investment & Return Projection",
    "body": "3 paragraphs: (1) the investment philosophy and what the programme requires, (2) how returns compound over 6–12 months, (3) the longer-term capability value beyond financial ROI",
    "scenarios": [
      {
        "name": "Conservative",
        "assumption": "Partial implementation, 50–60% adoption",
        "year1SavingsRange": "SAR X–Y million",
        "keyDrivers": ["2–3 drivers"],
        "roi": "X% ROI",
        "year1SavingsLowSAR": "number, the X in year1SavingsRange converted to a plain SAR figure (e.g. 2100000 for 'SAR 2.1 million'), no currency symbol or text",
        "year1SavingsHighSAR": "number, the Y in year1SavingsRange as a plain SAR figure",
        "roiPercent": "number, the X in roi as a plain number (e.g. 145 for '145% ROI'), no percent sign",
        "savingsBreakdown": [
          { "category": "short label for one driver behind this scenario's savings, e.g. 'Procurement cycle time reduction'", "amountSAR": "number, this category's share of year1SavingsHighSAR" }
        ]
      },
      {
        "name": "Base Case",
        "assumption": "Full implementation, 75–85% adoption",
        "year1SavingsRange": "SAR X–Y million",
        "keyDrivers": ["2–3 drivers"],
        "roi": "X% ROI",
        "year1SavingsLowSAR": "number, same convention as above",
        "year1SavingsHighSAR": "number, same convention as above",
        "roiPercent": "number, same convention as above",
        "savingsBreakdown": [
          { "category": "short label for one driver behind this scenario's savings", "amountSAR": "number, this category's share of year1SavingsHighSAR" }
        ]
      },
      {
        "name": "Optimistic",
        "assumption": "Full implementation with leadership commitment and quick capability build",
        "year1SavingsRange": "SAR X–Y million",
        "keyDrivers": ["2–3 drivers"],
        "roi": "X% ROI",
        "year1SavingsLowSAR": "number, same convention as above",
        "year1SavingsHighSAR": "number, same convention as above",
        "roiPercent": "number, same convention as above",
        "savingsBreakdown": [
          { "category": "short label for one driver behind this scenario's savings", "amountSAR": "number, this category's share of year1SavingsHighSAR" }
        ]
      }
    ]
  },
  "conclusion": {
    "headline": "Conclusion & Recommended Next Steps",
    "body": "3–4 paragraphs: (1) synthesis of the strategic opportunity, (2) why now is the right moment in the GCC/Saudi context, (3) what the organisation risks by delaying, (4) the specific first three actions to take this week.",
    "immediateNextSteps": ["3 concrete, time-bound next steps the client should take within the next 7 days"]
  }
}

QUALITY STANDARDS:
- Every data point must be specific to their industry and size — no generic boilerplate
- Cite exact segment scores, GCC benchmarks, and best-in-class comparisons throughout
- All financial projections must be SAR-denominated and calibrated to their company size
- Every recommendation must name a specific framework/standard
- The report must read as if written by a senior GCC supply chain expert who studied their specific data
- evidenceSummary.dataUsed: 2-4 items naming actual inputs this specific report used, never a generic methodology name
- evidenceSummary.assumptions: 1-3 items; if nothing had to be assumed, say so explicitly rather than omitting the field
- #190 (26 Aug 2026): each investmentProjection scenario's year1SavingsLowSAR/year1SavingsHighSAR/roiPercent/savingsBreakdown fields are structured numeric restatements of that same scenario's year1SavingsRange/roi text -- they must describe the same numbers, not a second independent estimate. savingsBreakdown's amountSAR values should sum to approximately year1SavingsHighSAR (rounding is fine; this powers a real chart, not just narrative text, so internal consistency matters more than false precision)`;

    const response = await openai.chat.completions.create({
      model:           OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 16000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content returned from AI');

    const report = JSON.parse(content) as Record<string, unknown>;
    return res.json({ ok: true, report, contactInfo, generatedAt: new Date().toISOString() });

  } catch (err) {
    console.error('[report-generator] failed', err);
    const { message, status } = friendlyAIError(err);
    return res.status(status).json({ error: message });
  }
});

export default router;
