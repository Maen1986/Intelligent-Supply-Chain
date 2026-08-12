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
  /**
   * Strategic/Tactical/Operational classification of this specific
   * question (#38) — independent of which segment it lives in. Used to
   * sequence a dependency-aware 30/60/90-day roadmap: Operational gaps
   * are typically quick 30-day wins, Tactical gaps need process/capability
   * build (60-day), and Strategic gaps need leadership sponsorship and
   * commonly anchor the 90-day horizon. Optional — older weak items or
   * sub-segment (deep-mode) questions may not carry this tag yet.
   */
  layer?: 'strategic' | 'tactical' | 'operational';
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

    const layerLabel = (l?: WeakSubQuestion['layer']) =>
      l === 'strategic' ? 'STRATEGIC' : l === 'tactical' ? 'TACTICAL' : l === 'operational' ? 'OPERATIONAL' : 'UNCLASSIFIED';

    const weakSummary = Object.entries(weakBySegment)
      .map(([seg, items]) =>
        `${seg}:\n${items
          .sort((a, b) => a.score - b.score)
          .map(i => `  • [${layerLabel(i.layer)}] "${i.questionText}" → Score ${i.score}/5. Current state: "${i.levelDescription}"`)
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

AUTHORITATIVE BODY-OF-KNOWLEDGE MAP — use the correct body for each segment:
• Strategy & Network Design          → CSCMP (network design), Gartner Supply Chain Institute (maturity/operating model), APICS/ASCM SCOR Plan/Enable, ISM/CPSM (make-or-buy)
• Procurement & Sourcing             → ISM/CPSM (CPSM Modules 1–3: spend analysis, sourcing strategy, negotiation, P2P); CIPS (category management, 5-rights framework, DoA governance); NAPM purchasing fundamentals
• Contract Lifecycle Management      → CIPS Contract Management Standard; IACCM/World Commerce & Contracting (commercial best practice, obligations management, risk clauses)
• Supplier Relationship Management   → CIPS SRM Standard (Kraljic segmentation, supplier development); ISM/CPSM (supplier selection, scorecards)
• Supply Chain Risk Management       → CIPS Risk Management Standard; ISO 31000; APICS/ASCM SCOR Resilience; CSCMP supply chain resilience research; Gartner (geopolitical/digital risk)
• ESG & Sustainability               → ISO 20400 (sustainable procurement); CIPS Sustainability & Ethical Trading Standards; GHG Protocol Scope 3; ISM/CPSM (supplier ESG assessment)
• Digital & Technology               → Gartner Supply Chain Institute (technology maturity, AI/automation, Magic Quadrant research); APICS/ASCM (digital transformation guidance)
• Demand Planning & Forecasting      → APICS/ASCM CPIM (forecasting, S&OP/IBP, NPI, MAPE/bias measurement); ASCM IBP Standard (Ross/Wallace methodology); Gartner (demand sensing)
• Inventory Management               → APICS/ASCM CPIM (safety stock, EOQ/ROP, ABC/XYZ, cycle counting, SLOB); CSCMP (multi-echelon, warehousing benchmarks)
• Logistics & Warehousing            → CSCMP (definitive authority: WERC benchmarks, State of Logistics Report, warehousing/transportation/last-mile/reverse logistics); Gartner Magic Quadrant for WMS; NOT CIPS for logistics remedies
• Organisation & Talent              → CIPS Professionalism Framework (MCIPS/FCIPS); ISM/CPSM competency model; APICS/ASCM SCOR People; CSCMP talent research; Prosci ADKAR/Kotter (change management)

Build a dependency-aware 30/60/90-day improvement roadmap that targets the specific weak sub-questions above.

CRITICAL RULES:
1. Every remedy must trace to a SPECIFIC weak sub-question by name — not a segment average. Two organisations with the same segment score but different weak questions must receive different remedies.
2. Every remedy MUST cite the correctly-mapped body of knowledge (see map above) — never default to CIPS or APICS/SCOR when CSCMP, Gartner, ISM/CPSM, IACCM, or ISO 20400 is the authoritative body for that segment. Name the specific tool or standard: e.g. "CSCMP WERC warehouse slotting methodology", "APICS/ASCM CPIM S&OP Demand Review cadence", "ISM/CPSM CPSM Module 1 spend segmentation", "Gartner Supply Chain Technology Maturity curve", "ISO 20400 sustainable procurement policy framework", "IACCM contract obligation management best practice". Never write generic labels like "best practice" or "industry standard" without naming the body.
3. Scale to ${input.companySize}: do not recommend enterprise-grade platforms to SMEs; do not under-scope Enterprises or Government entities.
4. Each remedy MUST end with a specific measurable target (metric, current state, target, timeframe).
5. Sequence by dependencies: 30-day = quick foundations; 60-day = formalised processes; 90-day = scaled capability.
5b. Each weak sub-question above is prefixed with its management layer — [OPERATIONAL], [TACTICAL], or [STRATEGIC]. Use it as a strong (not absolute) sequencing signal: [OPERATIONAL] gaps are usually the right 30-day quick wins (they need execution, not new mandate); [TACTICAL] gaps usually belong in the 60-day phase (they need a designed process or capability); [STRATEGIC] gaps usually belong in the 90-day phase (they need leadership sponsorship, budget, or a policy decision before they can move) — unless a specific dependency clearly overrides this (e.g. a foundational Strategic gap that blocks everything else may need to start on day 1 even if it only closes at day 90). [UNCLASSIFIED] items should be sequenced on their content alone, same as before.
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
