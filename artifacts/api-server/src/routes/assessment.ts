import { Router } from 'express';

const router = Router();

interface AssessmentInput {
  industry: string;
  revenueBand: string;
  painPoints: string[];
  kpiRatings: Record<string, number>;   // domain → 1-5
  maturityRatings: Record<string, number>; // domain → 1-5
}

async function generateBriefing(input: AssessmentInput): Promise<Record<string, unknown>> {
  const baseUrl = process.env['AI_INTEGRATIONS_OPENAI_BASE_URL'];
  const apiKey = process.env['AI_INTEGRATIONS_OPENAI_API_KEY'];
  if (!baseUrl || !apiKey) throw new Error('OpenAI env vars not configured');

  const avgKpi = Object.values(input.kpiRatings).reduce((a, b) => a + b, 0) / Math.max(Object.values(input.kpiRatings).length, 1);
  const avgMaturity = Object.values(input.maturityRatings).reduce((a, b) => a + b, 0) / Math.max(Object.values(input.maturityRatings).length, 1);

  const prompt = `You are Ma'in Alhaqash, MCIPS · CPSM · MSc · MIPP — one of the GCC's foremost supply chain transformation authorities. You have 20+ years of hands-on experience across Saudi Arabia, Jordan, UAE, Qatar, and Kuwait in procurement excellence, supply chain strategy, CIPS Category Management, APICS SCOR, ISO 31000, and Saudi Vision 2030 compliance.

A prospective client has submitted the following supply chain self-assessment profile:

INDUSTRY: ${input.industry}
REVENUE BAND: ${input.revenueBand}
STATED PAIN POINTS: ${input.painPoints.join(', ')}
KPI SELF-RATINGS (1=Very Poor, 5=Excellent):
${Object.entries(input.kpiRatings).map(([k, v]) => `  ${k}: ${v}/5`).join('\n')}
MATURITY SELF-RATINGS (1=Reactive, 5=World-Class):
${Object.entries(input.maturityRatings).map(([k, v]) => `  ${k}: ${v}/5`).join('\n')}
DERIVED SCORES: KPI avg=${avgKpi.toFixed(1)}/5, Maturity avg=${avgMaturity.toFixed(1)}/5

Produce a confidential executive supply chain briefing. Be specific, quantified, GCC-contextualized, and CIPS/APICS-grounded. Sound like a senior consultant who has seen hundreds of organisations — not a chatbot. Speak in the client's commercial reality.

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "executiveSummary": "3-4 sentences synthesising their situation, biggest vulnerability, and primary opportunity — with a specific benchmark or data point",
  "maturityLevel": "one of: Reactive | Developing | Defined | Optimised | World-Class",
  "maturityScore": <integer 0-100 reflecting the avg ratings and stated pain points>,
  "overallRiskLevel": "one of: Low | Moderate | High | Critical",
  "criticalGaps": [
    {
      "title": "gap title — specific, 4-8 words",
      "businessImpact": "quantified SAR/USD or % impact e.g. SAR 2–4M annually in excess spend",
      "urgency": "one of: Immediate | 90-Day | 6-Month",
      "detail": "2-3 sentences: what is happening, why it matters in their industry/context, what best practice looks like",
      "framework": "relevant standard e.g. CIPS Level 4 | APICS SCOR | ISO 31000 | GTPL"
    }
  ],
  "quickWins": [
    {
      "action": "specific action statement starting with a verb",
      "timeframe": "30 days | 60 days | 90 days",
      "expectedSavingPct": <number — savings as % of procurement spend, realistic>,
      "effort": "Low | Medium | High",
      "framework": "relevant reference"
    }
  ],
  "strategicPriorities": [
    {
      "priority": <1-3>,
      "title": "strategic initiative title",
      "rationale": "2 sentences: why this first, what it unlocks",
      "expectedROI": "e.g. 12–18% reduction in total procurement cost",
      "timeline": "e.g. 6–12 months"
    }
  ],
  "ninetyDayPlan": {
    "month1": {
      "focus": "focus theme for weeks 1–4",
      "milestones": ["milestone 1", "milestone 2", "milestone 3"]
    },
    "month2": {
      "focus": "focus theme for weeks 5–8",
      "milestones": ["milestone 1", "milestone 2", "milestone 3"]
    },
    "month3": {
      "focus": "focus theme for weeks 9–12",
      "milestones": ["milestone 1", "milestone 2", "milestone 3"]
    },
    "totalProjectedSaving": "e.g. SAR 1.2–2.8M in year one"
  },
  "benchmarkInsight": "One paragraph comparing them to GCC peers in ${input.industry} — cite specific benchmark ranges (OTIF %, procurement cycle, cost as % revenue). Be realistic and encouraging.",
  "recommendedPackage": "one of: Essential | Professional | Transformation",
  "recommendedPackageRationale": "1-2 sentences explaining why this package fits their profile",
  "consultantNote": "A personal note from Ma'in in first person — 2 sentences, warm but professional, referencing their specific industry or pain point"
}

Rules:
- criticalGaps: exactly 3 items
- quickWins: exactly 4 items
- strategicPriorities: exactly 3 items
- All SAR figures should scale with the revenue band (${input.revenueBand})
- Ground every claim in professional frameworks and GCC market realities
- Avoid generic platitudes — every sentence must add specific value`;

  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI API ${resp.status}: ${err}`);
  }

  const json = await resp.json() as { choices: { message: { content: string } }[] };
  return JSON.parse(json.choices[0].message.content) as Record<string, unknown>;
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
