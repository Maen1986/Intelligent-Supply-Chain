import { Router }             from 'express';
import { openai }             from '@workspace/integrations-openai-ai-server';
import { OPENAI_MODEL, friendlyAIError } from '../lib/aiConfig';

const router = Router();

/* ── Types ──────────────────────────────────────────────────────────────── */

interface WeakSubQuestion {
  segmentTitle: string;
  questionText: string;
  score: number;          // 1–3
  levelDescription: string; // exact text of the chosen level criterion
}

interface MaturityRemediesInput {
  industry:      string;
  companySize:   string;
  segmentScores: Array<{ segmentTitle: string; score: number }>;
  weakSubQuestions: WeakSubQuestion[];
  language?: 'en' | 'ar';
}

/* ── POST /api/maturity/remedies ─────────────────────────────────────────── */

router.post('/maturity/remedies', async (req, res) => {
  try {
    const input = req.body as MaturityRemediesInput;

    if (!input.industry || !input.companySize || !Array.isArray(input.weakSubQuestions)) {
      return res.status(400).json({ error: 'Missing required fields: industry, companySize, weakSubQuestions' });
    }

    const lang = input.language === 'ar' ? 'Arabic' : 'English';

    /* Group weak items by segment for cleaner prompt layout */
    const weakBySegment: Record<string, WeakSubQuestion[]> = {};
    for (const item of input.weakSubQuestions) {
      (weakBySegment[item.segmentTitle] ??= []).push(item);
    }

    const weakSummary = Object.entries(weakBySegment)
      .map(([seg, items]) =>
        `${seg}:\n${items
          .sort((a, b) => a.score - b.score)
          .map(i => `  • "${i.questionText}" → Score ${i.score}/5. Current state: "${i.levelDescription}"`)
          .join('\n')}`
      )
      .join('\n\n');

    const segSummary = input.segmentScores
      .map(s => `  ${s.segmentTitle}: ${s.score.toFixed(2)}/5`)
      .join('\n');

    const systemPrompt = `You are Ma'in Alhaqash, MCIPS · CPSM · MSc · MIPP — one of the GCC's foremost supply chain transformation authorities, with 20+ years of hands-on experience across Saudi Arabia, UAE, Qatar, Jordan, and Kuwait.

You build dependency-aware, framework-grounded supply chain improvement roadmaps. You reason about prerequisites (e.g., spend analysis before category management; demand-data hygiene before S&OP maturity; supplier segmentation before SRM investment). You scale advice precisely to the client's organisation size and industry context.

LANGUAGE INSTRUCTION: Respond entirely in ${lang}.`;

    const userPrompt = `A ${input.companySize} in the ${input.industry} sector has completed a structured Supply Chain Maturity Assessment.

SEGMENT SCORES (overview):
${segSummary}

WEAK SUB-QUESTIONS (score ≤ 3) — the specific capability gaps to address:
${weakSummary}

Build a dependency-aware 30/60/90-day improvement roadmap that targets the specific weak sub-questions above.

CRITICAL RULES:
1. Every remedy must trace to a SPECIFIC weak sub-question by name — not a segment average. Two organisations with the same segment score but different weak questions must receive different remedies.
2. Every remedy MUST name a specific real framework, standard, or tool. Examples: CIPS Category Cube, APICS SCOR-P Source domain, Kraljic Matrix, ISO 31000, DMAIC, GHG Protocol Scope 3 Category 1, ISO 20400, CIPS Level 4, ABC/XYZ classification, statistical EOQ/ROP, S&OP Demand Review, Prosci ADKAR, ISO 22301, GTPL Article 62, IKTVA local-content methodology. Never write "category management" — always name the specific tool or framework.
3. Scale to ${input.companySize}: do not recommend enterprise-grade platforms to SMEs; do not under-scope Enterprises or Government entities.
4. Each remedy MUST end with a specific measurable target (metric, current state, target, timeframe).
5. Sequence by dependencies: 30-day = quick foundations; 60-day = formalised processes; 90-day = scaled capability.
6. Prioritise the 6–9 most impactful gaps (2–3 per phase). Quality over quantity.
7. Be ${input.industry}-specific throughout — no generic advice.

Return ONLY valid JSON (no markdown fences) matching this exact schema:
{
  "executiveSummary": "3 sentences: (a) their overall maturity picture, (b) the single most critical dependency chain blocking improvement, (c) the realistic 90-day transformation impact with a specific metric. Be quantified and GCC-contextualised.",
  "days30": [
    {
      "segmentTitle": "exact segment name from the weak sub-questions",
      "subQuestion": "≤12-word summary of the specific question being addressed",
      "specificGap": "1 sentence: exactly what capability is missing and its direct operational/financial impact in ${input.industry}",
      "action": "Specific action starting with Deploy/Implement/Establish/Build/Conduct/Apply/Develop",
      "framework": "Named framework or standard — e.g. 'CIPS Category Cube' not 'category management'",
      "measurableTarget": "Raise [metric] from [current baseline implied by score] to [specific target] within 30 days",
      "effort": "Low"
    }
  ],
  "days60": [{ ...same structure..., "effort": "Medium" }],
  "days90": [{ ...same structure..., "effort": "Medium or High" }],
  "estimatedImpact": "Realistic SAR/USD impact estimate for a ${input.companySize} in ${input.industry} — e.g. 'SAR 1.4–3.2M in Year 1 from procurement savings, inventory right-sizing, and OTIF improvement' with brief rationale"
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

    const result = JSON.parse(content) as Record<string, unknown>;
    return res.json({ ok: true, remedies: result });
  } catch (err) {
    console.error('[maturity-remedies] failed', err);
    const { message, status } = friendlyAIError(err);
    return res.status(status).json({ error: message });
  }
});

export default router;
