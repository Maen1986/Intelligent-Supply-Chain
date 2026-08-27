/**
 * /api/clm-generation — Module 09 Part A.3, Option 2: Generation v1.5
 * (AI-drafted clause language + mandatory review disclaimer).
 *
 * POST /api/clm-generation/draft-clauses
 *
 * Stage 2 of the two-stage flow item 47 established: Stage 1 (already live,
 * clmGenerationEngine.ts) produces a structural skeleton -- a classified
 * clause outline with guidance notes, no clause language. This route is
 * Stage 2, the explicit, separately-requested step where the client asks
 * the engine to draft real clause text INTO an already-approved skeleton.
 * The engine never silently upgrades a skeleton into AI-drafted text --
 * this endpoint only fires when the client clicks "Draft Clause Language"
 * in CLMTools.tsx, never automatically alongside skeleton generation.
 *
 * Per Module 09 Part A.3, Option 2's own framing: drafted text is grounded
 * in the same sourced constraints already in Modules 01/02/04/05 (riba-
 * sensitivity substitution, FIDIC-book-consistent risk allocation,
 * jurisdiction-correct governing-law wording) and carries the same
 * "This is not legal advice; consult a licensed attorney for binding
 * guidance" disclaimer Module 00's Tier 2 schema already specifies --
 * architecturally the same AI-grounded-output pattern CONSULTANT_IDENTITY
 * already uses elsewhere on this platform (consultancy.ts), though this
 * route defines its own persona rather than importing that one: contract
 * drafting is a distinct competency from supply-chain diagnosis, and the
 * two personas should not be conflated.
 *
 * Grounding-data architecture: the domain libraries that resolve governing-
 * law practice notes, industry/FIDIC standard notes, and riba/foreground-IP
 * flags (clmLegalTrack.ts, clmIndustryStandards.ts, clmClauseTaxonomy.ts)
 * live in the FRONTEND package (artifacts/i-supply-chain), not this
 * backend package -- there is no shared-library import path between them
 * (separate pnpm workspace packages, frontend-only Vite/React code). Same
 * convention already established for maturityHint (#141): the client
 * resolves the grounding text using its own already-tested libraries and
 * sends the resolved strings in the request body; this route never
 * re-derives or second-guesses that grounding, it only forwards it into
 * the AI prompt. This keeps a single source of truth for the legal/
 * industry logic (the frontend libs) rather than duplicating it here.
 *
 * Scope: drafts clause language for EVERY subclause the client sends (both
 * mandatory and optional) across every APPLICABLE category of the already-
 * generated skeleton -- i.e. the full body the client approved at Stage 1,
 * not a partial document. Not-applicable categories (e.g. Commercial/
 * Payment on a pure NDA) are never sent by the client and never drafted.
 */
import { Router } from 'express';
import { z } from 'zod';
import { openai } from '@workspace/integrations-openai-ai-server';
import { logger } from '../lib/logger';
import { OPENAI_MODEL, friendlyAIError } from '../lib/aiConfig';
import { aiPlanRateLimiter } from '../lib/rateLimit';
import { requireSession } from '../middlewares/requireSession';

const router = Router();

// ── Shared drafting identity ──────────────────────────────────────────────
// Distinct from consultancy.ts's CONSULTANT_IDENTITY (supply-chain
// diagnosis persona) -- this one is scoped specifically to contract-clause
// drafting, and is explicit and unambiguous that it is not a lawyer.
const DRAFTING_IDENTITY = `You are an expert commercial contract drafter working inside I Supply Chain's Contract Lifecycle Management (CLM) toolkit. You draft real, professional, industry-standard clause language for GCC and international commercial contracts (NDAs, MSAs, and related agreements), grounded in the specific classification, governing-law track, and industry standard already resolved for this document.

You are NOT a lawyer and this is NOT legal advice. Every clause you draft must be immediately usable as a strong first draft for a qualified lawyer to review and adapt -- never present it as final, binding, or reviewed. When the grounding notes provided below name a specific real-world practice (a named arbitration institution, a specific statute, a riba-sensitivity requirement, a FIDIC risk-allocation convention), your drafted clause must reflect that named practice specifically -- never generic boilerplate when a specific, sourced practice was given to you.

Style: precise, professional commercial-contract drafting language (the register a GCC-region law firm would use), never casual, never padded with unnecessary preamble. Each clause should be a complete, usable paragraph (or numbered sub-points where the subject matter genuinely calls for them), not a one-line summary.`;

// ── Zod schema for the request body ──────────────────────────────────────
const SubclauseInputSchema = z.object({
  id: z.string().min(1).max(80),
  labelEn: z.string().min(1).max(200),
  mandatory: z.boolean(),
  guidanceEn: z.string().max(1000),
});

const CategoryInputSchema = z.object({
  category: z.string().min(1).max(80),
  labelEn: z.string().min(1).max(200),
  subclauses: z.array(SubclauseInputSchema).min(1).max(20),
});

const GroundingNotesSchema = z.object({
  governingLawPracticeNoteEn: z.string().max(4000).optional(),
  industryStandardNoteEn:     z.string().max(2000).optional(),
  ribaFlagNoteEn:              z.string().max(2000).optional(),
  fidicRiskMismatchNoteEn:     z.string().max(2000).optional(),
}).optional();

const DraftClausesRequestSchema = z.object({
  contractTypeLabelEn: z.enum(['NDA', 'MSA']),
  cover: z.object({
    partiesEn:        z.string().max(2000),
    purposeEn:        z.string().max(2000),
    scopeSummaryEn:   z.string().max(2000),
    governingLawEn:   z.string().max(500),
    disputeForumEn:   z.string().max(500),
  }),
  body: z.array(CategoryInputSchema).min(1).max(6),
  groundingNotes: GroundingNotesSchema,
});

const DISCLAIMER_EN = 'These clauses were drafted by AI, grounded in the classification and sourced practice notes for this document. This is NOT legal advice and this is NOT a finished, reviewed contract -- have qualified legal counsel review and adapt every clause before use.';
const DISCLAIMER_AR = 'صيغت هذه البنود بواسطة الذكاء الاصطناعي، استناداً إلى التصنيف وملاحظات الممارسة المصدرية لهذه الوثيقة. هذا ليس استشارة قانونية وليس عقداً نهائياً تمت مراجعته -- يجب أن يراجع مستشار قانوني مؤهل كل بند ويُكيّفه قبل الاستخدام.';

function buildPrompt(input: z.infer<typeof DraftClausesRequestSchema>): string {
  const g = input.groundingNotes ?? {};
  const groundingLines: string[] = [];
  if (g.governingLawPracticeNoteEn) groundingLines.push(`GOVERNING-LAW PRACTICE NOTE (reflect this specifically, do not generalize away from it): ${g.governingLawPracticeNoteEn}`);
  if (g.industryStandardNoteEn)     groundingLines.push(`INDUSTRY/STANDARD-OF-CARE NOTE: ${g.industryStandardNoteEn}`);
  if (g.ribaFlagNoteEn)             groundingLines.push(`RIBA-SENSITIVITY FLAG (any interest/late-fee/financing language must use a Sharia-compliant substitute, e.g. a fixed administrative fee, never an interest rate): ${g.ribaFlagNoteEn}`);
  if (g.fidicRiskMismatchNoteEn)    groundingLines.push(`FIDIC RISK-ALLOCATION NOTE: ${g.fidicRiskMismatchNoteEn}`);

  const bodyBlock = input.body.map(section => {
    const subclauseLines = section.subclauses.map(sc =>
      `  - id="${sc.id}" | ${sc.labelEn} | ${sc.mandatory ? 'MANDATORY' : 'optional'} | Guidance: ${sc.guidanceEn}`
    ).join('\n');
    return `CATEGORY: ${section.labelEn}\n${subclauseLines}`;
  }).join('\n\n');

  return `Draft real clause language for every subclause listed below, for a ${input.contractTypeLabelEn} governed by the classification and grounding notes given.

DOCUMENT FACTS:
Parties: ${input.cover.partiesEn}
Purpose: ${input.cover.purposeEn}
Scope summary: ${input.cover.scopeSummaryEn}
Governing law: ${input.cover.governingLawEn}
Dispute forum: ${input.cover.disputeForumEn}

${groundingLines.length > 0 ? `GROUNDING NOTES:\n${groundingLines.join('\n')}\n` : ''}
SUBCLAUSES TO DRAFT (draft EVERY one listed, both mandatory and optional -- draft each as a complete, usable clause, not a placeholder):

${bodyBlock}

Return JSON exactly in this shape -- one entry per subclause id listed above, grouped by category id (use the exact "category" value given for each CATEGORY block, not the label):
{
  "sections": [
    {
      "category": "the category id",
      "subclauses": [
        { "id": "the exact subclause id given above", "en": "the full drafted clause in English", "ar": "the full drafted clause in Arabic -- a real, professional translation/adaptation, not a literal word-for-word translation of the English" }
      ]
    }
  ]
}`;
}

router.post('/clm-generation/draft-clauses', requireSession, aiPlanRateLimiter, async (req, res) => {
  const parsed = DraftClausesRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'Invalid draft-clauses request', details: parsed.error.format() });
    return;
  }

  const totalSubclauses = parsed.data.body.reduce((n, s) => n + s.subclauses.length, 0);
  if (totalSubclauses === 0) {
    res.status(400).json({ ok: false, error: 'No subclauses to draft' });
    return;
  }
  if (totalSubclauses > 60) {
    res.status(400).json({ ok: false, error: 'Too many subclauses for a single draft request (max 60)' });
    return;
  }

  const prompt = buildPrompt(parsed.data);

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: DRAFTING_IDENTITY },
        { role: 'user',   content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 16000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content from AI');
    const drafted = JSON.parse(content);

    res.json({
      ok: true,
      disclaimerEn: DISCLAIMER_EN,
      disclaimerAr: DISCLAIMER_AR,
      sections: drafted.sections ?? [],
    });
  } catch (err) {
    logger.error({ err }, '[clmGeneration/draft-clauses] failed');
    const { message, status } = friendlyAIError(err);
    res.status(status).json({ ok: false, error: message });
  }
});

export default router;
