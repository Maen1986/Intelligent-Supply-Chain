import { Router } from 'express';
import { openai } from '@workspace/integrations-openai-ai-server';

const router = Router();

interface AssessmentInput {
  industry:         string;
  subIndustry?:     string;
  revenueBand:      string;
  painPoints:       string[];
  kpiRatings:       Record<string, number>;
  maturityRatings:  Record<string, number>;
  language?:        'en' | 'ar';
}

async function generateBriefing(input: AssessmentInput): Promise<Record<string, unknown>> {
  const avgKpi      = Object.values(input.kpiRatings).reduce((a, b) => a + b, 0)      / Math.max(Object.values(input.kpiRatings).length, 1);
  const avgMaturity = Object.values(input.maturityRatings).reduce((a, b) => a + b, 0) / Math.max(Object.values(input.maturityRatings).length, 1);
  const industryFull = input.subIndustry ? `${input.industry} — ${input.subIndustry}` : input.industry;
  const lang = input.language === 'ar' ? 'Arabic' : 'English';

  const systemPrompt = `You are Ma'in Alhaqash, MCIPS · CPSM · MSc · MIPP — one of the GCC's foremost supply chain transformation authorities. You have 20+ years of hands-on experience across Saudi Arabia, Jordan, UAE, Qatar, and Kuwait in:
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

You produce confidential executive briefings that match the rigour and depth of McKinsey, BCG, Kearney, and Accenture supply chain practices. Every claim is grounded in professional frameworks, GCC market data, and real-world benchmarks.

LANGUAGE INSTRUCTION: Generate all text values in ${lang}.`;

  const userPrompt = `A prospective client has submitted the following supply chain self-assessment profile:

INDUSTRY: ${industryFull}
REVENUE BAND: ${input.revenueBand}
STATED PAIN POINTS: ${input.painPoints.join(', ')}

KPI SELF-RATINGS (1=Very Poor, 5=Excellent):
${Object.entries(input.kpiRatings).map(([k, v]) => `  ${k}: ${v}/5`).join('\n')}

PROCESS MATURITY SELF-RATINGS (1=Reactive, 5=World-Class):
${Object.entries(input.maturityRatings).map(([k, v]) => `  ${k}: ${v}/5`).join('\n')}

DERIVED SCORES: KPI avg=${avgKpi.toFixed(1)}/5, Maturity avg=${avgMaturity.toFixed(1)}/5

Produce a confidential executive supply chain briefing. Apply SCOR, CIPS, APICS, Lean, Six Sigma, ISO 31000, SRM, CLM, and ESG frameworks. Be specific, quantified, GCC-contextualized. Reference industry-specific benchmarks (OTIF%, procurement cost % revenue, inventory turns, forecast accuracy). Sound like a senior transformation consultant who has reviewed hundreds of organisations — not a generic AI. Speak in the client's commercial reality.

Return ONLY valid JSON (no markdown, no code fences) matching this exact structure:
{
  "executiveSummary": "3-4 sentences synthesising their situation, biggest vulnerability, and primary opportunity — with a specific benchmark or data point relevant to their industry",
  "maturityLevel": "one of: Reactive | Developing | Defined | Optimised | World-Class",
  "maturityScore": <integer 0-100>,
  "overallRiskLevel": "one of: Low | Moderate | High | Critical",
  "criticalGaps": [
    {
      "title": "specific gap title, 4-8 words",
      "businessImpact": "quantified SAR/USD or % impact e.g. SAR 2–4M annually in excess spend",
      "urgency": "one of: Immediate | 90-Day | 6-Month",
      "detail": "2-3 sentences: what is happening, why it matters in their specific industry context, what SCOR/CIPS/APICS best practice looks like",
      "framework": "relevant standard e.g. CIPS Level 4 | APICS SCOR Plan | ISO 31000 | GTPL Article 62"
    }
  ],
  "quickWins": [
    {
      "action": "specific action starting with a verb",
      "timeframe": "30 days | 60 days | 90 days",
      "expectedSavingPct": <number>,
      "effort": "Low | Medium | High",
      "framework": "relevant reference"
    }
  ],
  "strategicPriorities": [
    {
      "priority": <1-3>,
      "title": "strategic initiative title",
      "rationale": "2 sentences: why this first, what it unlocks for their industry",
      "expectedROI": "e.g. 12–18% reduction in total procurement cost",
      "timeline": "e.g. 6–12 months"
    }
  ],
  "ninetyDayPlan": {
    "month1": { "focus": "focus theme weeks 1-4", "milestones": ["milestone 1", "milestone 2", "milestone 3"] },
    "month2": { "focus": "focus theme weeks 5-8", "milestones": ["milestone 1", "milestone 2", "milestone 3"] },
    "month3": { "focus": "focus theme weeks 9-12", "milestones": ["milestone 1", "milestone 2", "milestone 3"] },
    "totalProjectedSaving": "e.g. SAR 1.2–2.8M in year one"
  },
  "benchmarkInsight": "One paragraph comparing them to GCC peers in ${industryFull}. Cite specific benchmark ranges (OTIF %, procurement cost as % of revenue, inventory turns, procurement cycle days). Be encouraging but realistic.",
  "sustainabilityOpportunity": "One paragraph identifying the most relevant ESG / sustainability / circular economy opportunity for their industry and region",
  "resiliencyGap": "One paragraph assessing their supply chain resiliency based on the risk indicators and recommending a specific SCOR-based mitigation",
  "recommendedPackage": "one of: Essential | Professional | Transformation",
  "recommendedPackageRationale": "1-2 sentences",
  "consultantNote": "A personal note from Ma'in in first person — 2 sentences, warm but authoritative, referencing their specific industry or primary pain point"
}

Rules:
- criticalGaps: exactly 3 items
- quickWins: exactly 4 items
- strategicPriorities: exactly 3 items
- All SAR figures scaled to ${input.revenueBand}
- Industry context must be ${industryFull}-specific throughout — no generic supply chain advice
- Every recommendation grounded in SCOR, CIPS, APICS, or GCC regulatory frameworks`;

  const response = await openai.chat.completions.create({
    model:           'gpt-5',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    max_completion_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No content returned from AI');
  return JSON.parse(content) as Record<string, unknown>;
}

/* POST /api/assessment */
router.post('/assessment', async (req, res) => {
  try {
    const input = req.body as AssessmentInput;
    if (!input.industry || !input.revenueBand || !input.painPoints) {
      return res.status(400).json({ error: 'Missing required fields: industry, revenueBand, painPoints' });
    }
    const briefing = await generateBriefing(input);
    return res.json({ success: true, generatedAt: new Date().toISOString(), briefing });
  } catch (err) {
    console.error('[assessment] failed', err);
    return res.status(500).json({ error: 'Failed to generate assessment', details: String(err) });
  }
});

export default router;
