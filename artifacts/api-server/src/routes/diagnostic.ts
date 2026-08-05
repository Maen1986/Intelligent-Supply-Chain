/**
 * POST /api/diagnostic
 *
 * AI-powered supply chain diagnostic. Takes the five inputs from the
 * public 5-step wizard and returns a fully AI-reasoned DiagnosticReport
 * grounded in CIPS / APICS SCOR methodology via the Ma'in Alhaqash persona.
 *
 * Rate-limited via the shared leads limiter (5 req / hour per IP) so the
 * same throttle that protects the leads endpoint also protects this one.
 */

import { Router }            from 'express';
import { openai }            from '@workspace/integrations-openai-ai-server';
import { OPENAI_MODEL, friendlyAIError } from '../lib/aiConfig';
import { leadsRateLimiter }  from '../lib/rateLimit';

const router = Router();

interface DiagnosticInput {
  businessSize: string;
  region:       string;
  industry:     string;
  focusArea:    string;
  challenge?:   string;
  language?:    'en' | 'ar';
}

// Revenue band heuristics used to scale SAR figures in the prompt
const REVENUE_HINTS: Record<string, string> = {
  'Startup':         'SAR 1–10M annual revenue (early-stage)',
  'SME':             'SAR 10–100M annual revenue (small-to-medium enterprise)',
  'Mid-Market':      'SAR 100M–1B annual revenue (mid-market)',
  'Enterprise':      'SAR 1B+ annual revenue (large enterprise)',
  'Government Entity': 'Government / public sector budget holder',
};

async function generateDiagnosticViaAI(input: DiagnosticInput): Promise<Record<string, unknown>> {
  const lang = input.language === 'ar' ? 'Arabic' : 'English';
  const revHint = REVENUE_HINTS[input.businessSize] ?? 'unspecified size';

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

LANGUAGE INSTRUCTION: Generate ALL text values in ${lang}.`;

  const hasChallenge = Boolean(input.challenge?.trim());

  const challengeBlock = hasChallenge
    ? `\nCLIENT'S STATED CHALLENGE (this is the single most important input you have — every section of the report must directly engage with it, referencing its specific details rather than restating it back generically):\n"${input.challenge!.trim()}"\n`
    : '';

  const specificityInstruction = hasChallenge
    ? `The client has described their specific challenge above. You MUST ground the executiveSummary, diagnosis, and rootCauses directly in that stated challenge — reference its specific details, not just the industry/region/size category. Findings that ignore the stated challenge and only restate the organisation's category are a failure.`
    : `The client did NOT describe a specific challenge — only their organisation category (size, region, industry, focus area). Because of this, be transparent about scope: the final sentence of executiveSummary must plainly note that this is a directional, framework-based assessment based on their organisation profile alone, and that sharing specific operational details (or booking a live consultation) would sharpen it into a truly personalised diagnosis. Do not present category-level generalities as if they were specific findings about their organisation.`;

  const regionContext: Record<string, string> = {
    'Saudi Arabia': 'Saudi Arabia — subject to GTPL, IKTVA, Vision 2030 localisation targets, Zakat authority requirements',
    'Jordan':       'Jordan — subject to Government Procurement Bureau regulations, Central Tenders Directorate rules',
    'Other GCC':    'GCC region — subject to applicable national procurement laws and Vision 2030-aligned frameworks',
    'International': 'international operations with GCC headquarters or significant GCC exposure',
  };
  const regionFull = regionContext[input.region] ?? input.region;

  const userPrompt = `A prospective client has submitted a 5-step supply chain self-assessment:

ORGANISATION TYPE: ${input.businessSize} (${revHint})
OPERATING REGION: ${regionFull}
INDUSTRY SECTOR: ${input.industry}
PRIMARY FOCUS AREA: ${input.focusArea}
${challengeBlock}
${specificityInstruction}

Using your deep ${input.industry} sector knowledge for the ${input.region} market and applying SCOR, CIPS, APICS, ISO 31000, Lean/Six Sigma, and GCC regulatory frameworks, produce a confidential supply chain diagnostic report.

Be specific to the ${input.industry} sector in ${input.region}. Reference industry-specific GCC benchmarks where relevant (e.g. OTIF%, procurement cost as % of revenue, inventory turns, forecast accuracy). Scale all SAR/USD figures to a ${input.businessSize} organisation. Do NOT produce generic supply chain advice — every finding must reflect the specific realities of a ${input.businessSize} ${input.industry} organisation in ${input.region} with a ${input.focusArea} focus.

Return ONLY valid JSON (no markdown, no code fences) matching this EXACT structure:
{
  "executiveSummary": "3-4 sentences synthesising their situation, most critical vulnerability in ${input.focusArea}, and primary opportunity — with a specific GCC benchmark or data point for the ${input.industry} sector",
  "diagnosis": [
    "Finding 1 — specific, grounded in ${input.focusArea} best practice",
    "Finding 2",
    "Finding 3",
    "Finding 4"
  ],
  "rootCauses": [
    "Root cause 1 — the structural or process reason behind the finding",
    "Root cause 2",
    "Root cause 3",
    "Root cause 4"
  ],
  "recommendations": [
    "Recommendation 1 — specific action starting with a verb, citing the relevant framework",
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
  "regionalAlignment": "One paragraph on specific ${input.region} regulatory, policy, or compliance requirements relevant to this ${input.businessSize} ${input.industry} organisation's ${input.focusArea} agenda — e.g. GTPL, IKTVA, Vision 2030 for Saudi; GPB for Jordan; relevant GCC frameworks. Omit if region is International and there is nothing specific to say."
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
- All SAR figures calibrated to a ${input.businessSize} (${revHint})`;

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
  const { businessSize, region, industry, focusArea, challenge, language } = req.body as DiagnosticInput;

  if (!businessSize || !region || !industry || !focusArea) {
    return res.status(400).json({ error: 'Missing required fields: businessSize, region, industry, focusArea' });
  }

  try {
    const aiReport = await generateDiagnosticViaAI({ businessSize, region, industry, focusArea, challenge, language });

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
