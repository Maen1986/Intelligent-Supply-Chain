/**
 * /api/clm-review-extraction — Module 09 Part B.3: Review v2
 * (document upload/extraction, T2).
 *
 * POST /api/clm-review-extraction/extract
 *
 * Explicitly flagged in the Module 09 doc as "a genuine T2 build (parsing,
 * clause segmentation, mapping extracted text back to Module 02's
 * taxonomy) ... scoped as its own dedicated project once v1 proves the
 * review logic itself is sound against structured data" -- Review v1
 * (clmReviewEngine.ts, buildReviewReport()) already shipped and is
 * unchanged by this build. This route does NOT reimplement or bypass
 * Review v1's logic: it produces a Contract-shaped DRAFT of structured
 * fields from an uploaded document, which the client must review, edit,
 * and explicitly save through the existing Add/Edit Contract form before
 * it becomes a real contract record -- at which point Review v1 runs
 * against it exactly as it already does for any manually-entered
 * contract. This route never calls buildReviewReport() itself and never
 * writes to clm_contracts; it is a stateless extraction-to-draft-fields
 * assistant only.
 *
 * Grounding-data architecture -- client-computes/server-forwards, same
 * pattern established for maturityHint (#141) and Generation v1.5's
 * groundingNotes: the growing, sourced taxonomies (governing-law tracks,
 * arbitration institutions, pricing types, industry buckets, FIDIC books,
 * the 56-subclause taxonomy) live in the FRONTEND package only
 * (clmLegalTrack.ts, clmPricingTaxonomy.ts, clmIndustryStandards.ts,
 * clmClauseTaxonomy.ts) -- there is no shared-library import path to this
 * backend package. The client sends the current menu of valid id/label
 * pairs for each taxonomy in the request body; this route only forwards
 * those menus into the AI prompt as the allowed-value reference and
 * validates the AI's output against them post-hoc. It never hardcodes or
 * duplicates the taxonomy content itself. A small number of genuinely
 * stable, non-legal enums (contract type, scope definiteness, professional
 * -services track, logistics mode, counterparty type) are hardcoded here
 * since they are UI-structural, not sourced legal/industry content.
 *
 * File handling: the uploaded file is decoded, parsed to plain text, and
 * discarded at the end of the request -- nothing is persisted to disk,
 * object storage, or any database table. Stateless by design, unlike
 * maturityEvidence.ts's GCS-backed upload flow (which this route
 * deliberately does not reuse, since there is no need to retain the
 * original file once extraction completes).
 *
 * Honesty framing: every response carries a disclaimer that this is an
 * AI-assisted first draft of structured fields, not a verified legal
 * reading of the document -- the user must review and correct every
 * field before saving. This keeps the same "self-declared-consistent"
 * assurance tier Review v1 already uses honest even for extracted-then-
 * confirmed data (see clmReviewEngine.ts's ASSURANCE_META).
 */
import { Router } from 'express';
import { z } from 'zod';
import { openai } from '@workspace/integrations-openai-ai-server';
import Pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import { logger } from '../lib/logger';
import { OPENAI_MODEL, friendlyAIError } from '../lib/aiConfig';
import { aiPlanRateLimiter } from '../lib/rateLimit';
import { requireSession } from '../middlewares/requireSession';

const router = Router();

// ── File constraints -- mirrors maturityEvidence.ts's precedent (10MB cap),
//    narrowed to PDF + DOCX only (legacy .doc has no reliable pure-JS
//    text-extraction library and is honestly excluded rather than silently
//    mishandled). ─────────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB, matches maturityEvidence.ts
const MAX_EXTRACTED_CHARS = 30000; // cap sent to the AI prompt; truncation is disclosed, never silent

// ── Shared extraction identity ────────────────────────────────────────────
// Distinct from DRAFTING_IDENTITY (clmGeneration.ts, drafts NEW clause
// text) and CONSULTANT_IDENTITY (consultancy.ts, supply-chain diagnosis) --
// this persona's only job is reading an EXISTING document and mapping what
// it finds onto ISC's own structured field taxonomy, never inventing or
// improving contract content.
const EXTRACTION_IDENTITY = `You are a document-analysis assistant inside I Supply Chain's Contract Lifecycle Management (CLM) toolkit. Your only job is to read the supplied contract text and extract a structured, first-draft set of fields describing what the document actually says -- you never invent, assume, or improve on content that is not present in the text.

For every field: if the text does not clearly state or strongly imply a value, leave that field out of your JSON response entirely rather than guessing. When you are extracting an enum-constrained field (governing law track, arbitration institution, pricing type, industry bucket, FIDIC book, or a subclause id), you must choose ONLY from the exact id values given to you in the allowed-values list for that field -- never invent a new id, and never guess an id from partial similarity if no strong textual match exists.

This is NOT a legal reading of the contract and NOT legal advice. Every field you extract is a first-draft suggestion for a human to review, correct, and confirm before it is saved as real contract data.`;

// ── Zod schema for the request body ──────────────────────────────────────
const TaxonomyOptionSchema = z.object({ id: z.string(), label: z.string() });

const SubclauseOptionSchema = z.object({ id: z.string(), label: z.string() });
const CategoryMenuSchema = z.object({
  categoryLabel: z.string(),
  subclauses: z.array(SubclauseOptionSchema).max(20),
});

const TaxonomyMenusSchema = z.object({
  governingLawTracks: z.array(TaxonomyOptionSchema).max(30),
  arbitrationInstitutions: z.array(TaxonomyOptionSchema).max(20),
  pricingTypes: z.array(TaxonomyOptionSchema).max(20),
  industryBuckets: z.array(TaxonomyOptionSchema).max(10),
  fidicBooks: z.array(TaxonomyOptionSchema).max(10),
  subclausesByCategory: z.record(z.string(), CategoryMenuSchema),
});

const ExtractDocumentRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.enum([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
  fileBase64: z.string().min(1),
  taxonomyMenus: TaxonomyMenusSchema,
});

const DISCLAIMER_EN = 'These fields were drafted by AI from your uploaded document -- this is NOT a verified legal reading of the contract. Review and correct every field before saving; nothing here is used until you confirm it in the contract form.';
const DISCLAIMER_AR = 'صيغت هذه الحقول بواسطة الذكاء الاصطناعي استناداً إلى المستند الذي رفعتموه -- وهذه ليست قراءة قانونية موثقة للعقد. يُرجى مراجعة كل حقل وتصحيحه قبل الحفظ؛ لن يُستخدم أي منها حتى تؤكدوه في نموذج العقد.';

const HARDCODED_ENUMS = {
  contractType: ['goods', 'services', 'framework', 'msa', 'nda', 'lease', 'it-saas', 'logistics'],
  counterpartyType: ['government', 'private'],
  scopeDefiniteness: ['well-defined', 'evolving', 'uncertain'],
  professionalServicesTrack: ['engineering-consultancy', 'broader-professional'],
  logisticsMode: ['road', 'sea', 'air', 'rail', 'multimodal'],
};

function buildPrompt(
  text: string,
  taxonomyMenus: z.infer<typeof TaxonomyMenusSchema>,
): string {
  const menuLine = (label: string, opts: { id: string; label: string }[]) =>
    `${label}: ${opts.map(o => `${o.id}="${o.label}"`).join(', ')}`;

  const subclauseLines = Object.entries(taxonomyMenus.subclausesByCategory).map(([catId, cat]) =>
    `CATEGORY "${catId}" (${cat.categoryLabel}) subclause ids: ${cat.subclauses.map(s => `${s.id}="${s.label}"`).join(', ')}`
  ).join('\n');

  return `Read the following contract document text and extract a structured JSON draft of fields.

ALLOWED VALUES FOR ENUM FIELDS (use ONLY these exact ids, never invent new ones):
${menuLine('governingLawClause', taxonomyMenus.governingLawTracks)}
${menuLine('arbitrationInstitution', taxonomyMenus.arbitrationInstitutions)}
${menuLine('pricingPrimary', taxonomyMenus.pricingTypes)}
${menuLine('industryBucket', taxonomyMenus.industryBuckets)}
${menuLine('fidicBook (only if industryBucket is construction)', taxonomyMenus.fidicBooks)}
type: ${HARDCODED_ENUMS.contractType.join(', ')}
counterpartyType: ${HARDCODED_ENUMS.counterpartyType.join(', ')}
scopeDefiniteness: ${HARDCODED_ENUMS.scopeDefiniteness.join(', ')}
professionalServicesTrack (only if industryBucket is professional-services): ${HARDCODED_ENUMS.professionalServicesTrack.join(', ')}
logisticsMode (only if industryBucket is logistics): ${HARDCODED_ENUMS.logisticsMode.join(', ')}

CLAUSE-PRESENCE CHECKLIST -- for each category below, list the subclause ids (from the exact ids given) whose subject matter you can find addressed somewhere in the document text. If a whole category's subject matter is clearly and deliberately absent from a document of this type (e.g. no Commercial/Payment terms in what is clearly a pure confidentiality agreement), you may add that category's id to "clauseCategoriesNotApplicable" instead:
${subclauseLines}

DOCUMENT TEXT (may be partial/truncated):
"""
${text}
"""

Return JSON exactly in this shape (omit any field you could not find, never guess):
{
  "name": "contract title, if stated",
  "supplier": "counterparty/vendor name, if stated",
  "type": "one of the allowed type ids, if clearly determinable",
  "startDate": "YYYY-MM-DD, if stated",
  "endDate": "YYYY-MM-DD, if stated",
  "counterpartyType": "government or private, if determinable",
  "governingLawClause": "an allowed id, if a governing-law clause is present",
  "arbitrationInstitution": "an allowed id, if a named institution is present",
  "counterpartyJurisdiction": "free text, if stated",
  "performanceLocation": "free text, if stated",
  "pricingPrimary": "an allowed id, if determinable",
  "scopeDefiniteness": "an allowed id, if determinable",
  "pricingHasCapOrMilestones": true or false, only if pricingPrimary is time-and-materials-like and this is determinable,
  "industryBucket": "an allowed id, if determinable",
  "fidicBook": "an allowed id, only if industryBucket is construction and a specific book is named",
  "professionalServicesTrack": "an allowed id, only if industryBucket is professional-services",
  "logisticsMode": "an allowed id, only if industryBucket is logistics",
  "clausesPresent": { "category-id": ["subclause-id", "..."] },
  "clauseCategoriesNotApplicable": ["category-id", "..."],
  "extractionNotesEn": "1-3 sentences, in English, on what was and was not found",
  "extractionNotesAr": "same note, in Arabic"
}`;
}

function pickString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim().length > 0 ? v : undefined;
}

function pickBoolean(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined;
}

function pickEnum(v: unknown, allowed: readonly string[]): string | undefined {
  return typeof v === 'string' && allowed.includes(v) ? v : undefined;
}

function pickFromMenu(v: unknown, menu: { id: string }[]): string | undefined {
  return typeof v === 'string' && menu.some(m => m.id === v) ? v : undefined;
}

/**
 * Sanitizes the AI's raw JSON output against the exact allowed-value menus
 * the client sent -- never trusts the model's output as-is, even though
 * the prompt already constrains it. Any value not present in the relevant
 * menu/enum is dropped (field omitted), never coerced or guessed.
 */
function sanitizeExtractedFields(
  raw: Record<string, unknown>,
  taxonomyMenus: z.infer<typeof TaxonomyMenusSchema>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  const name = pickString(raw.name); if (name) out.name = name;
  const supplier = pickString(raw.supplier); if (supplier) out.supplier = supplier;
  const type = pickEnum(raw.type, HARDCODED_ENUMS.contractType); if (type) out.type = type;
  const startDate = pickString(raw.startDate); if (startDate) out.startDate = startDate;
  const endDate = pickString(raw.endDate); if (endDate) out.endDate = endDate;
  const counterpartyType = pickEnum(raw.counterpartyType, HARDCODED_ENUMS.counterpartyType); if (counterpartyType) out.counterpartyType = counterpartyType;
  const governingLawClause = pickFromMenu(raw.governingLawClause, taxonomyMenus.governingLawTracks); if (governingLawClause) out.governingLawClause = governingLawClause;
  const arbitrationInstitution = pickFromMenu(raw.arbitrationInstitution, taxonomyMenus.arbitrationInstitutions); if (arbitrationInstitution) out.arbitrationInstitution = arbitrationInstitution;
  const counterpartyJurisdiction = pickString(raw.counterpartyJurisdiction); if (counterpartyJurisdiction) out.counterpartyJurisdiction = counterpartyJurisdiction;
  const performanceLocation = pickString(raw.performanceLocation); if (performanceLocation) out.performanceLocation = performanceLocation;
  const pricingPrimary = pickFromMenu(raw.pricingPrimary, taxonomyMenus.pricingTypes); if (pricingPrimary) out.pricingPrimary = pricingPrimary;
  const scopeDefiniteness = pickEnum(raw.scopeDefiniteness, HARDCODED_ENUMS.scopeDefiniteness); if (scopeDefiniteness) out.scopeDefiniteness = scopeDefiniteness;
  const pricingHasCapOrMilestones = pickBoolean(raw.pricingHasCapOrMilestones); if (pricingHasCapOrMilestones !== undefined) out.pricingHasCapOrMilestones = pricingHasCapOrMilestones;
  const industryBucket = pickFromMenu(raw.industryBucket, taxonomyMenus.industryBuckets); if (industryBucket) out.industryBucket = industryBucket;
  const fidicBook = pickFromMenu(raw.fidicBook, taxonomyMenus.fidicBooks); if (fidicBook) out.fidicBook = fidicBook;
  const professionalServicesTrack = pickEnum(raw.professionalServicesTrack, HARDCODED_ENUMS.professionalServicesTrack); if (professionalServicesTrack) out.professionalServicesTrack = professionalServicesTrack;
  const logisticsMode = pickEnum(raw.logisticsMode, HARDCODED_ENUMS.logisticsMode); if (logisticsMode) out.logisticsMode = logisticsMode;

  // clausesPresent: keep only known category ids, and within each, only
  // subclause ids present in that category's own menu.
  const clausesPresentRaw = raw.clausesPresent;
  if (clausesPresentRaw && typeof clausesPresentRaw === 'object') {
    const clausesPresent: Record<string, string[]> = {};
    for (const [catId, subIds] of Object.entries(clausesPresentRaw as Record<string, unknown>)) {
      const catMenu = taxonomyMenus.subclausesByCategory[catId];
      if (!catMenu || !Array.isArray(subIds)) continue;
      const validIds = subIds.filter((sid): sid is string =>
        typeof sid === 'string' && catMenu.subclauses.some(s => s.id === sid));
      if (validIds.length > 0) clausesPresent[catId] = validIds;
    }
    if (Object.keys(clausesPresent).length > 0) out.clausesPresent = clausesPresent;
  }

  // clauseCategoriesNotApplicable: keep only known category ids.
  const notApplicableRaw = raw.clauseCategoriesNotApplicable;
  if (Array.isArray(notApplicableRaw)) {
    const validCats = notApplicableRaw.filter((cid): cid is string =>
      typeof cid === 'string' && Boolean(taxonomyMenus.subclausesByCategory[cid]));
    if (validCats.length > 0) out.clauseCategoriesNotApplicable = validCats;
  }

  const extractionNotesEn = pickString(raw.extractionNotesEn); if (extractionNotesEn) out.extractionNotesEn = extractionNotesEn;
  const extractionNotesAr = pickString(raw.extractionNotesAr); if (extractionNotesAr) out.extractionNotesAr = extractionNotesAr;

  return out;
}

router.post('/clm-review-extraction/extract', requireSession, aiPlanRateLimiter, async (req, res) => {
  const parsed = ExtractDocumentRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'Invalid extraction request', details: parsed.error.format() });
    return;
  }
  const { filename, mimeType, fileBase64, taxonomyMenus } = parsed.data;

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    res.status(400).json({ ok: false, error: 'File type not allowed. Accepted: PDF, DOCX.' });
    return;
  }

  let fileBuffer: Buffer;
  try {
    fileBuffer = Buffer.from(fileBase64, 'base64');
  } catch {
    res.status(400).json({ ok: false, error: 'Could not decode file content' });
    return;
  }
  if (fileBuffer.byteLength === 0) {
    res.status(400).json({ ok: false, error: 'Uploaded file is empty' });
    return;
  }
  if (fileBuffer.byteLength > MAX_FILE_BYTES) {
    res.status(400).json({ ok: false, error: 'File exceeds 10 MB limit.' });
    return;
  }

  let extractedText = '';
  try {
    if (mimeType === 'application/pdf') {
      const result = await Pdf(fileBuffer);
      extractedText = result.text ?? '';
    } else {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      extractedText = result.value ?? '';
    }
  } catch (err) {
    logger.error({ err, filename }, '[clmReviewExtraction] document parsing failed');
    res.status(422).json({ ok: false, error: 'Could not parse this file -- it may be corrupted, password-protected, or scanned (image-only) without a text layer.' });
    return;
  }

  extractedText = extractedText.trim();
  if (extractedText.length === 0) {
    res.status(422).json({ ok: false, error: 'No extractable text found in this file -- it may be scanned (image-only) without a text layer.' });
    return;
  }

  const truncated = extractedText.length > MAX_EXTRACTED_CHARS;
  const textForPrompt = truncated ? extractedText.slice(0, MAX_EXTRACTED_CHARS) : extractedText;

  const prompt = buildPrompt(textForPrompt, taxonomyMenus);

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: EXTRACTION_IDENTITY },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content from AI');
    const rawFields = JSON.parse(content) as Record<string, unknown>;
    const extractedFields = sanitizeExtractedFields(rawFields, taxonomyMenus);

    res.json({
      ok: true,
      extractedFields,
      disclaimerEn: DISCLAIMER_EN,
      disclaimerAr: DISCLAIMER_AR,
      truncated,
      extractedCharCount: extractedText.length,
    });
  } catch (err) {
    logger.error({ err }, '[clmReviewExtraction/extract] failed');
    const { message, status } = friendlyAIError(err);
    res.status(status).json({ ok: false, error: message });
  }
});

export default router;
