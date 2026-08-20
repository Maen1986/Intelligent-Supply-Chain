import { Router }   from 'express';
import { openai }   from '@workspace/integrations-openai-ai-server';
import { OPENAI_MODEL, friendlyAIError } from '../lib/aiConfig';
import { requireSession }            from '../middlewares/requireSession';

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

export interface ReportInput {
  tier:         'sme_growth' | 'startup' | 'mid_market';
  contactInfo:  { name: string; company: string; industry: string; companySize: string; email?: string };
  maturityData?: {
    overallScore:   number;
    overallLevel:   string;
    segmentScores:  SegmentScore[];
    remedies?:      Remedies;
  };
  language?:    'en' | 'ar';
}

/* ── POST /api/report/generate ───────────────────────────────────────────── */

router.post('/generate', requireSession, async (req, res) => {
  try {
    const input = req.body as ReportInput;
    if (!input?.contactInfo?.name || !input?.contactInfo?.company) {
      return res.status(400).json({ error: 'contactInfo.name and contactInfo.company are required' });
    }

    const { contactInfo, maturityData, language } = input;
    const lang = language === 'ar' ? 'Arabic' : 'English';

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

    const systemPrompt = `You are Ma'in Alhaqash, MCIPS · CPSM · MSc · MIPP — the GCC's foremost supply chain transformation authority with 20+ years across Saudi Arabia, UAE, Qatar, Jordan, and Kuwait. You author premium, board-ready strategy reports for organisations undergoing supply chain transformation.

Your writing is authoritative, specific, and GCC-contextualised. You name real frameworks (CIPS Category Cube, SCOR-P, Kraljic, ISO 31000, DMAIC, S&OP, IKTVA, GTPL, etc.). You quantify impacts in SAR. You never write generic advice — every sentence must be calibrated to the specific client's industry, size, and maturity level.

LANGUAGE: Respond entirely in ${lang}.`;

    const userPrompt = `Generate a comprehensive Supply Chain Strategy Report for:

CLIENT: ${contactInfo.name}
COMPANY: ${contactInfo.company}
INDUSTRY: ${contactInfo.industry}
ORGANISATION SIZE: ${contactInfo.companySize}
PACKAGE TIER: SME Growth — 30-page Strategy Report + 6-Month Implementation Roadmap

${maturityContext}

Generate a full strategy report with EIGHT sections, each substantive and deeply tailored to this specific client. Return ONLY valid JSON (no markdown fences) with this exact structure:

{
  "reportTitle": "Supply Chain Strategy Report: [Company Name]",
  "reportSubtitle": "SME Growth Programme — Strategic Assessment & 6-Month Transformation Roadmap",
  "executiveSummary": {
    "headline": "One-sentence strategic verdict",
    "body": "5–6 paragraphs: (1) who the client is and their strategic context, (2) what the assessment found — the overall maturity picture with specific scores cited, (3) the single most critical dependency chain blocking improvement, (4) the 3 highest-leverage opportunities found, (5) the 6-month transformation vision and its measurable endpoint, (6) a call to action. Be specific with numbers, GCC benchmarks, and SAR impact estimates."
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
        "roi": "X% ROI"
      },
      {
        "name": "Base Case",
        "assumption": "Full implementation, 75–85% adoption",
        "year1SavingsRange": "SAR X–Y million",
        "keyDrivers": ["2–3 drivers"],
        "roi": "X% ROI"
      },
      {
        "name": "Optimistic",
        "assumption": "Full implementation with leadership commitment and quick capability build",
        "year1SavingsRange": "SAR X–Y million",
        "keyDrivers": ["2–3 drivers"],
        "roi": "X% ROI"
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
- The report must read as if written by a senior GCC supply chain expert who studied their specific data`;

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
