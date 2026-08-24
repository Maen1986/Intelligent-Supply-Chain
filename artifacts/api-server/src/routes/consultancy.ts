/**
 * /api/consultancy — End-to-end AI consultancy workflow
 *
 * All routes below require a signed-in session (#364 billing gate --
 * Consultancy Engine is subscription-only per Decision Record 8.5).
 *
 * POST /api/consultancy/diagnose    → structured AI diagnosis
 *   diagnosis.problems[] is a "Problem DNA" object per problem (#167, 20 Aug 2026):
 *   id / status / severityScore / confidence % / symptom -> trigger -> immediateCause ->
 *   contributingCauses -> rootCause -> downstreamEffects. Same underlying AI call and data,
 *   restructured from the old flat rootCauses[] (cause/framework/severity) list.
 *   #176 (Similar Case Matching, 24 Aug 2026): the response also carries
 *   similarCase, a best-effort lookup of this SAME signed-in user's own most
 *   recent PRIOR diagnostic submission with a matching industry (and
 *   subIndustry, when given) -- read from the same submissions table #167
 *   already writes to, not a new table. "Similar" here means a categorical
 *   match on the dropdown fields the client themselves chose, not semantic
 *   text similarity (no embeddings/full-text infra exists in this stack, so
 *   this deliberately does not claim a stronger match than it can prove).
 *   Cross-CLIENT matching was considered and rejected -- the site map
 *   registry item specifically scopes this to "the same client's own
 *   diagnosis history," and matching across different organizations would
 *   raise real data-boundary questions this endpoint has no business
 *   answering. A lookup failure never blocks the diagnosis itself --
 *   similarCase is additive context, not a dependency.
 * POST /api/consultancy/solution    → solution plan generation
 * POST /api/consultancy/refine      → refine solution after satisfaction feedback
 * POST /api/consultancy/escalate    → email Ma'in + log case to DB
 */
import { Router } from 'express';
import { openai } from '@workspace/integrations-openai-ai-server';
import { db } from '@workspace/db';
import { submissionsTable } from '@workspace/db';
import { sql } from 'drizzle-orm';
import { logger } from '../lib/logger';
import { OPENAI_MODEL, friendlyAIError } from '../lib/aiConfig';
import { leadsRateLimiter } from '../lib/rateLimit';
import { requireSession }   from '../middlewares/requireSession';
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

You speak with authority, warmth, and commercial precision. No generic advice. No vague platitudes. Every output must be industry-specific, process-specific, region-specific, and maturity-specific.

INVESTIGATOR MODE (#156): you diagnose, you probe, you ask what's missing -- you do not just answer. Every finding should read like a consultant actively working the case, not a report reciting facts back at the client.

DECISION-READY OUTPUT (#155): never hand the reader a raw number and leave them to translate it into a decision themselves -- do that translation for them. "Supplier OTIF decreased to 72%" is not acceptable; "Supplier ABC's promise-date reliability has deteriorated -- four production-critical POs are exposed" is. Every sentence you write should already state the decision-relevant fact, not just the metric behind it.`;

// ── POST /api/consultancy/diagnose ────────────────────────────────────────────
router.post('/diagnose', requireSession, leadsRateLimiter, async (req, res) => {
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

  // ── #176 Similar Case Matching: this user's own most recent prior
  //    diagnostic submission with a matching industry (+ subIndustry, when
  //    given). Best-effort -- a lookup failure never blocks the diagnosis. ──
  const userId = req.session.userId ?? null;
  let similarCase: {
    challenge: string; challengeSummary: string | null;
    industry: string; subIndustry: string | null; takenAt: string;
  } | null = null;

  if (userId) {
    try {
      const subIndustryFilter = subIndustry ? sql`AND inputs->>'subIndustry' = ${subIndustry}` : sql``;
      const priorResult = await db.execute(sql`
        SELECT inputs, outputs, created_at
        FROM submissions
        WHERE user_id = ${userId}
          AND tool = 'diagnostic'
          AND inputs->>'industry' = ${industry}
          ${subIndustryFilter}
        ORDER BY created_at DESC
        LIMIT 1
      `);
      const priorRows = ((priorResult as any).rows ?? priorResult) as Array<{
        inputs: { challenge?: string; industry?: string; subIndustry?: string } | null;
        outputs: { challengeSummary?: string } | null;
        created_at: string;
      }>;
      const prior = priorRows[0];
      if (prior?.inputs?.challenge) {
        similarCase = {
          challenge:        prior.inputs.challenge,
          challengeSummary: prior.outputs?.challengeSummary ?? null,
          industry:         prior.inputs.industry ?? industry,
          subIndustry:      prior.inputs.subIndustry ?? null,
          takenAt:          prior.created_at,
        };
      }
    } catch (err) {
      logger.error({ err, userId }, '[consultancy/diagnose] similar-case lookup failed');
      // similarCase stays null -- the diagnosis itself still proceeds normally.
    }
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
  "problems": [
    {
      "id": "P1",
      "status": "Active",
      "title": "short problem name, 5-8 words",
      "severityScore": <0-100>,
      "confidence": <0-100, how confident this diagnosis is given the information provided -- calibrate honestly: 85-100 only with verified assessment data or highly specific client detail behind it; 60-84 for a solid but partly-assumed picture; below 60 when working mostly from a short free-text description. Do not default high out of politeness>,
      "framework": "e.g. SCOR Source reliability gap",
      "chain": {
        "symptom": "what the client actually observes or reports",
        "trigger": "the immediate event or condition that set this off",
        "immediateCause": "the direct, proximate cause of the symptom",
        "contributingCauses": ["secondary factor 1", "secondary factor 2"],
        "rootCause": "the underlying systemic cause -- the thing that, if fixed, prevents recurrence",
        "downstreamEffects": ["effect 1 if left unresolved", "effect 2 if left unresolved"]
      }
    }
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
  "considerAlso": "The strongest honest counter-argument to your own top problem/recommendation above -- e.g. a reason it might not be the real priority, a cheaper alternative explanation, or a condition under which acting on it would be premature. Must be specific to this diagnosis, never a generic caveat like \"more data could change this\". One or two sentences. Never omit this even when confident.",
  "evidenceSummary": {
    "dataUsed": ["specific input this diagnosis is grounded in, e.g. \"maturity indicator: Procurement 2.1/5\"", "the challenge description itself"],
    "assumptions": ["assumption made where information was not provided, stated plainly"],
    "confidence": "<0-100, overall confidence in this diagnosis given what was actually provided -- same calibration as above: 85-100 only with verified data or highly specific detail, 60-84 for a partly-assumed picture, below 60 for a thin free-text description>"
  },
  "consultantNote": "Personal diagnostic note from Ma'in — 2 sentences, specific to their industry and challenge"
}

Rules:
- problems: 3-5 items, ids sequential P1, P2, P3...; status is always "Active" for a first-time diagnosis (this field exists so a future retake can mark a problem "Resolved" or "Recurring" against the same id); contributingCauses: 1-3 items; downstreamEffects: 2-3 items
- urgentActions: 3 items
- Be industry-specific: ${industryFull} benchmarks, not generic supply chain
- Ground every problem's chain in a named framework
- evidenceSummary.dataUsed: 2-4 items, each naming an actual input this specific diagnosis used (industry, company size, maturity indicator if present, specifics from the challenge text) -- never a generic methodology name
- evidenceSummary.assumptions: 1-3 items; if nothing had to be assumed, say so explicitly rather than omitting the field
- maturityAssessment: if a "Maturity Indicator" is provided above, it is real, completed assessment data for this client — treat it as ground truth for any segment it covers and let it anchor your level/score/keyGaps rather than re-estimating from scratch. If the challenge concerns a topic the indicator does not cover, or no indicator is provided, produce your own independent estimate as usual — do not withhold a diagnosis and do not force-fit unrelated data to make them agree`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
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

    res.json({ ok: true, diagnosis, similarCase });
  } catch (err) {
    logger.error({ err }, '[consultancy/diagnose] failed');
    const { message, status } = friendlyAIError(err);
    res.status(status).json({ ok: false, error: message });
  }
});

// ── POST /api/consultancy/solution ────────────────────────────────────────────
router.post('/solution', requireSession, leadsRateLimiter, async (req, res) => {
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
  "considerAlso": "The strongest honest counter-argument to this solution's central approach -- e.g. a reason a lighter-touch fix might work first, a dependency that could delay it, or a condition under which a different phase order would be better. Must be specific to this solution, never a generic caveat like \"more data could change this\". One or two sentences. Never omit this even when confident.",
  "evidenceSummary": {
    "dataUsed": ["specific element of the diagnosis this solution is built from, e.g. \"P1: <problem title>\"", "industry/company-size context"],
    "assumptions": ["assumption made where the diagnosis did not specify enough to plan precisely"],
    "confidence": "<0-100, overall confidence this solution fits the diagnosed problem given what was actually provided -- calibrate honestly: 85-100 only when the diagnosis itself was well-evidenced, 60-84 when reasonable but partly assumed, below 60 when the diagnosis was thin. Do not default high out of politeness>"
  },
  "consultantNote": "Ma'in's personal recommendation — 2 sentences"
}

Rules:
- solutionPhases: 3-4 phases
- authorityMatrix: 3-4 entries relevant to ${industryFull}
- kpiDashboard: 4-6 KPIs with GCC benchmark targets
- riskMitigations: 3-4 mitigations
- evidenceSummary.dataUsed: 2-4 items citing specific problems/fields from the diagnosis JSON above, not generic methodology names
- evidenceSummary.assumptions: 1-3 items; if nothing had to be assumed, say so explicitly rather than omitting the field
- All SAR figures calibrated to the company context from the diagnosis`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
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
    const { message, status } = friendlyAIError(err);
    res.status(status).json({ ok: false, error: message });
  }
});

// ── POST /api/consultancy/refine ──────────────────────────────────────────────
router.post('/refine', requireSession, leadsRateLimiter, async (req, res) => {
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
      model: OPENAI_MODEL,
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
    const { message, status } = friendlyAIError(err);
    res.status(status).json({ ok: false, error: message });
  }
});

// ── POST /api/consultancy/escalate ────────────────────────────────────────────
// Triggers human escalation: sends a structured brief to Ma'in via email
// and logs the full case to the submissions table.
router.post('/escalate', requireSession, async (req, res) => {
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
    // #368 (22 Aug 2026): the 4-business-hour response SLA is a monthly-subscription
    // benefit (Ma'in's personal, informal commitment to active paying clients), not a
    // guarantee owed to every signed-in user who reaches this free diagnostic flow --
    // requireSession only checks login state, not plan/billing status (#364 billing
    // gate is still open). Until #364 lands, don't print an SLA promise we can't yet
    // verify is backed by a real subscription; keep the human commitment honest instead.
    res.json({ ok: true, message: 'Escalation sent to Ma\'in Alhaqash. Monthly-plan clients are contacted within 4 business hours; other users are contacted as soon as possible.' });
  } catch (err) {
    logger.error({ err }, '[consultancy/escalate] failed');
    res.status(500).json({ ok: false, error: 'Escalation failed', detail: String(err) });
  }
});

export default router;
