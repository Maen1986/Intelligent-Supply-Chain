/**
 * /api/consultancy — End-to-end AI consultancy workflow
 *
 * POST /api/consultancy/diagnose    → structured AI diagnosis
 * POST /api/consultancy/solution    → solution plan generation
 * POST /api/consultancy/refine      → refine solution after satisfaction feedback
 * POST /api/consultancy/escalate    → email Ma'in + log case to DB
 */
import { Router } from 'express';
import { openai } from '@workspace/integrations-openai-ai-server';
import { db } from '@workspace/db';
import { submissionsTable } from '@workspace/db';
import { logger } from '../lib/logger';
import { sendEscalationEmail } from './notify';

const router = Router();

// ── Shared system identity ────────────────────────────────────────────────────
const CONSULTANT_IDENTITY = `You are Ma'in Alhaqash — MCIPS, CPSM, MSc, MIPP — founding principal of I Supply Chain. You have 20+ years of transformational supply chain and procurement experience across Saudi Arabia, Jordan, UAE, Qatar, and Kuwait. You deliver solutions at the standard of McKinsey, BCG, Kearney, Accenture, and Gartner.

Your diagnostic methodology applies:
- SCOR Model (Plan, Source, Make, Deliver, Return, Enable)
- CIPS Procurement Excellence Framework (Levels 1-6)
- APICS Supply Chain Operations Reference
- Lean Manufacturing & Lean Supply Chain
- Six Sigma (DMAIC) process improvement
- Theory of Constraints (TOC) — identify the system constraint first
- SRM (Supplier Relationship Management) — segmentation, development, governance
- CLM (Contract Lifecycle Management) — drafting, risk, compliance, renewal
- ISO 31000 Risk Management
- ESG & Circular Economy frameworks
- Saudi Vision 2030, GTPL, IKTVA, GCC Procurement Laws

You apply SCOR's five performance attributes: Reliability, Responsiveness, Agility, Cost, and Asset Management — always benchmarked to GCC top-quartile data.

You speak with authority, warmth, and commercial precision. No generic advice. No vague platitudes. Every output must be industry-specific, process-specific, region-specific, and maturity-specific.`;

// ── POST /api/consultancy/diagnose ────────────────────────────────────────────
router.post('/diagnose', async (req, res) => {
  const { industry, subIndustry, challenge, companySize, maturityHint, language } = req.body as {
    industry:      string;
    subIndustry?:  string;
    challenge:     string;
    companySize?:  string;
    maturityHint?: string;
    language?:     'en' | 'ar';
  };

  if (!industry || !challenge) {
    res.status(400).json({ ok: false, error: 'industry and challenge are required' });
    return;
  }

  const lang = language === 'ar' ? 'Arabic' : 'English';
  const industryFull = subIndustry ? `${industry} — ${subIndustry}` : industry;
  const contextBlock = [
    companySize   ? `Company Size / Revenue: ${companySize}` : '',
    maturityHint  ? `Maturity Indicator: ${maturityHint}` : '',
  ].filter(Boolean).join('\n');

  const prompt = `Client Challenge Submission:

INDUSTRY: ${industryFull}
${contextBlock}
CHALLENGE DESCRIBED: ${challenge}

Using the full SCOR / CIPS / Lean / Six Sigma / TOC / ISO 31000 diagnostic framework, produce a structured professional diagnosis. Language: ${lang}.

Return ONLY valid JSON:
{
  "challengeSummary": "1-2 sentence synthesis of the core challenge in supply chain terms",
  "clarifyingQuestions": ["question 1 if more info needed", "question 2"],
  "rootCauses": [
    { "cause": "specific root cause", "framework": "e.g. SCOR Source reliability gap", "severity": "High|Medium|Low" }
  ],
  "scorcardGaps": {
    "reliability": "assessment of OTIF/perfect order reliability",
    "responsiveness": "assessment of cycle time and agility",
    "agility": "assessment of upside/downside flexibility",
    "cost": "assessment of total supply chain cost",
    "assets": "assessment of inventory and asset utilisation"
  },
  "riskAssessment": {
    "level": "Low|Moderate|High|Critical",
    "topRisks": ["risk 1", "risk 2", "risk 3"],
    "iso31000Score": <0-100>
  },
  "maturityAssessment": {
    "level": "Reactive|Developing|Defined|Optimised|World-Class",
    "score": <0-100>,
    "keyGaps": ["gap 1", "gap 2", "gap 3"]
  },
  "diagnosticSummary": "3-4 paragraphs: what is broken, why it is broken, what it is costing them, what world-class looks like for their industry",
  "urgentActions": ["action 1 — do this week", "action 2", "action 3"],
  "estimatedAnnualCost": "SAR/USD quantification of the problem if left unresolved",
  "consultantNote": "Personal diagnostic note from Ma'in — 2 sentences, specific to their industry and challenge"
}

Rules:
- rootCauses: 3-5 items
- urgentActions: 3 items
- Be industry-specific: ${industryFull} benchmarks, not generic supply chain
- Ground every root cause in a named framework`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        { role: 'system', content: CONSULTANT_IDENTITY },
        { role: 'user',   content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 2500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content from AI');
    const diagnosis = JSON.parse(content);

    // Persist to submissions table (fire-and-forget)
    db.insert(submissionsTable).values({
      tool:         'diagnostic',
      userId:       req.session.userId ?? null,
      contactEmail: req.session.userEmail ?? null,
      contactName:  req.session.userFullName ?? null,
      contactCompany: req.session.userCompany ?? null,
      inputs:  { industry, subIndustry, challenge, companySize, maturityHint, language },
      outputs: diagnosis,
      ipAddress: req.ip ?? null,
    }).catch(err => logger.error({ err }, '[consultancy] Failed to persist diagnosis'));

    res.json({ ok: true, diagnosis });
  } catch (err) {
    logger.error({ err }, '[consultancy/diagnose] failed');
    res.status(500).json({ ok: false, error: 'Diagnosis generation failed', detail: String(err) });
  }
});

// ── POST /api/consultancy/solution ────────────────────────────────────────────
router.post('/solution', async (req, res) => {
  const { industry, subIndustry, challenge, diagnosis, language } = req.body as {
    industry:     string;
    subIndustry?: string;
    challenge:    string;
    diagnosis:    Record<string, unknown>;
    language?:    'en' | 'ar';
  };

  if (!industry || !challenge || !diagnosis) {
    res.status(400).json({ ok: false, error: 'industry, challenge, and diagnosis are required' });
    return;
  }

  const lang = language === 'ar' ? 'Arabic' : 'English';
  const industryFull = subIndustry ? `${industry} — ${subIndustry}` : industry;

  const prompt = `Based on the following diagnosis, generate a world-class solution plan. Language: ${lang}.

INDUSTRY: ${industryFull}
CHALLENGE: ${challenge}
DIAGNOSIS SUMMARY: ${JSON.stringify(diagnosis, null, 2)}

Return ONLY valid JSON:
{
  "executiveSolution": "3-4 sentence executive-level solution summary — what will be done and what it will achieve",
  "solutionPhases": [
    {
      "phase": 1,
      "title": "Phase title",
      "duration": "e.g. Weeks 1-4",
      "focus": "What this phase achieves",
      "activities": ["activity 1", "activity 2", "activity 3"],
      "deliverables": ["deliverable 1", "deliverable 2"],
      "kpis": ["KPI 1 with target", "KPI 2 with target"],
      "framework": "SCOR/CIPS/Lean reference"
    }
  ],
  "authorityMatrix": [
    { "decision": "decision type", "owner": "role", "approver": "role", "framework": "DoA reference" }
  ],
  "kpiDashboard": [
    { "kpi": "KPI name", "baseline": "current estimated value", "target": "target value", "timeframe": "e.g. 6 months" }
  ],
  "riskMitigations": [
    { "risk": "risk description", "mitigation": "specific action", "owner": "responsible role", "iso31000": "risk treatment type" }
  ],
  "sustainabilityImpact": "2-3 sentences: how this solution reduces carbon footprint, waste, or improves ESG compliance",
  "resiliencyImpact": "2-3 sentences: how this solution improves supply chain resilience and BCP",
  "totalProjectedSaving": "quantified SAR/USD annual saving estimate",
  "roi": "estimated ROI % and payback period",
  "nextStep": "The single most important first action to take — specific, this week",
  "consultantNote": "Ma'in's personal recommendation — 2 sentences"
}

Rules:
- solutionPhases: 3-4 phases
- authorityMatrix: 3-4 entries relevant to ${industryFull}
- kpiDashboard: 4-6 KPIs with GCC benchmark targets
- riskMitigations: 3-4 mitigations
- All SAR figures calibrated to the company context from the diagnosis`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        { role: 'system', content: CONSULTANT_IDENTITY },
        { role: 'user',   content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content from AI');
    const solution = JSON.parse(content);

    // Persist
    db.insert(submissionsTable).values({
      tool:         'command_centre',
      userId:       req.session.userId ?? null,
      contactEmail: req.session.userEmail ?? null,
      contactName:  req.session.userFullName ?? null,
      contactCompany: req.session.userCompany ?? null,
      inputs:  { industry, subIndustry, challenge, language },
      outputs: solution,
      ipAddress: req.ip ?? null,
    }).catch(err => logger.error({ err }, '[consultancy] Failed to persist solution'));

    res.json({ ok: true, solution });
  } catch (err) {
    logger.error({ err }, '[consultancy/solution] failed');
    res.status(500).json({ ok: false, error: 'Solution generation failed', detail: String(err) });
  }
});

// ── POST /api/consultancy/refine ──────────────────────────────────────────────
router.post('/refine', async (req, res) => {
  const { industry, subIndustry, challenge, previousSolution, feedback, language } = req.body as {
    industry:         string;
    subIndustry?:     string;
    challenge:        string;
    previousSolution: Record<string, unknown>;
    feedback:         string;
    language?:        'en' | 'ar';
  };

  if (!industry || !previousSolution || !feedback) {
    res.status(400).json({ ok: false, error: 'industry, previousSolution, and feedback are required' });
    return;
  }

  const lang = language === 'ar' ? 'Arabic' : 'English';
  const industryFull = subIndustry ? `${industry} — ${subIndustry}` : industry;

  const prompt = `The client has reviewed the solution plan and provided feedback. Refine the solution accordingly. Language: ${lang}.

INDUSTRY: ${industryFull}
ORIGINAL CHALLENGE: ${challenge}
CLIENT FEEDBACK: ${feedback}
PREVIOUS SOLUTION: ${JSON.stringify(previousSolution, null, 2)}

Return an improved solution in the same JSON structure as the original solution, with all sections updated to address the client's feedback. Add a "refinementNote" field explaining what was changed and why.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        { role: 'system', content: CONSULTANT_IDENTITY },
        { role: 'user',   content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content from AI');
    res.json({ ok: true, solution: JSON.parse(content) });
  } catch (err) {
    logger.error({ err }, '[consultancy/refine] failed');
    res.status(500).json({ ok: false, error: 'Refinement failed', detail: String(err) });
  }
});

// ── POST /api/consultancy/escalate ────────────────────────────────────────────
// Triggers human escalation: sends a structured brief to Ma'in via email
// and logs the full case to the submissions table.
router.post('/escalate', async (req, res) => {
  const {
    contactName, contactEmail, contactMobile, contactCompany, contactDesignation,
    industry, subIndustry, challenge, diagnosis, solution, satisfactionScore,
  } = req.body as {
    contactName?:       string;
    contactEmail?:      string;
    contactMobile?:     string;
    contactCompany?:    string;
    contactDesignation?: string;
    industry:           string;
    subIndustry?:       string;
    challenge:          string;
    diagnosis?:         Record<string, unknown>;
    solution?:          Record<string, unknown>;
    satisfactionScore?: number;
  };

  const industryFull = subIndustry ? `${industry} — ${subIndustry}` : industry;
  const name    = contactName    ?? req.session.userFullName    ?? 'Anonymous';
  const email   = contactEmail   ?? req.session.userEmail       ?? 'Not provided';
  const mobile  = contactMobile  ?? req.session.userMobile      ?? 'Not provided';
  const company = contactCompany ?? req.session.userCompany     ?? 'Not provided';
  const title   = contactDesignation ?? req.session.userDesignation ?? 'Not provided';

  try {
    // Send escalation email
    await sendEscalationEmail({
      subject: `🚨 Escalation Required — ${name} (${company}) | ${industryFull}`,
      clientName:   name,
      clientEmail:  email,
      clientMobile: mobile,
      company,
      title,
      industry:     industryFull,
      challenge,
      satisfactionScore: satisfactionScore ?? null,
      diagnosisSummary: diagnosis ? String((diagnosis as any).diagnosticSummary ?? '') : '',
      solutionSummary:  solution  ? String((solution  as any).executiveSolution ?? '') : '',
    });

    // Persist full case to DB
    await db.insert(submissionsTable).values({
      tool:         'lead',
      userId:       req.session.userId ?? null,
      contactName:  name,
      contactEmail: email,
      contactMobile: mobile,
      contactDesignation: title,
      contactCompany: company,
      inputs:  { industry, subIndustry, challenge, satisfactionScore },
      outputs: { diagnosis, solution },
      ipAddress: req.ip ?? null,
    });

    logger.info({ contactEmail: email, industry: industryFull }, '[consultancy] Escalation sent');
    res.json({ ok: true, message: 'Escalation sent to Ma\'in Alhaqash. You will be contacted within 4 business hours.' });
  } catch (err) {
    logger.error({ err }, '[consultancy/escalate] failed');
    res.status(500).json({ ok: false, error: 'Escalation failed', detail: String(err) });
  }
});

export default router;
