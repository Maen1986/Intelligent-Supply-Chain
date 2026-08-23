/**
 * /api/regulatory — public read access to the country×industry regulatory
 * coverage registry (#118 v2, #147, #149). No auth required: this powers
 * the Maturity Assessment's country selector and Regional Coverage badge.
 *
 * GET /api/regulatory/countries
 *   -> all countries, sorted by sort_order.
 *
 * GET /api/regulatory/countries/:id/frameworks?industry=<industryId>
 *   -> frameworks for one country, filtered to those that apply to the
 *      given industry (or universal frameworks, applies_to_industries=["*"]).
 *      Omit ?industry to get the full unfiltered list for that country.
 *
 * PATCH /api/regulatory/countries/:id  (admin-only)
 *   -> update a country's coverage_level / notes / notes_ar / source_url /
 *      last_verified_at / verified_by. Added so coverage status can be
 *      corrected as content is authored/reviewed without a code deploy or
 *      a raw DB migration each time (the pattern used for the one-off
 *      DB coverage fix). Whitelisted fields only; every write is logged with the
 *      admin's user id for accountability.
 */

import { Router } from 'express';
import { asc, eq } from 'drizzle-orm';
import { db, regulatoryCountriesTable, regulatoryFrameworksTable } from '@workspace/db';
import { logger } from '../lib/logger';
import { requireAdmin } from '../middlewares/requireAdmin';

const router = Router();

// ── GET /api/regulatory/countries ───────────────────────────────────────────
router.get('/countries', async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(regulatoryCountriesTable)
      .orderBy(asc(regulatoryCountriesTable.sortOrder));
    res.json({ ok: true, countries: rows });
  } catch (err) {
    logger.error({ err }, '[regulatory] GET /countries failed');
    res.status(500).json({ ok: false, error: 'Failed to load countries' });
  }
});

// ── GET /api/regulatory/countries/:id/frameworks ────────────────────────────
router.get('/countries/:id/frameworks', async (req, res) => {
  const countryId = req.params.id;
  const industry = typeof req.query.industry === 'string' ? req.query.industry : undefined;

  try {
    const rows = await db
      .select()
      .from(regulatoryFrameworksTable)
      .where(eq(regulatoryFrameworksTable.countryId, countryId))
      .orderBy(asc(regulatoryFrameworksTable.sortOrder));

    const filtered = industry
      ? rows.filter((r) => {
          const industries = Array.isArray(r.appliesToIndustries) ? r.appliesToIndustries as string[] : ['*'];
          return industries.includes('*') || industries.includes(industry);
        })
      : rows;

    res.json({ ok: true, countryId, industry: industry ?? null, frameworks: filtered });
  } catch (err) {
    logger.error({ err, countryId }, '[regulatory] GET /countries/:id/frameworks failed');
    res.status(500).json({ ok: false, error: 'Failed to load frameworks' });
  }
});

// ── PATCH /api/regulatory/countries/:id ─────────────────────────────────────
router.patch('/countries/:id', requireAdmin, async (req, res) => {
  // Explicit cast: this route only ever matches a single ':id' segment, so
  // req.params.id is always a plain string at runtime. The annotation is
  // needed because drizzle's eq() overload resolution against a primaryKey
  // text column is stricter than against a plain text column (see the
  // GET /countries/:id/frameworks handler above, which does not need this)
  // -- caught by CI typecheck (2026-08-17), pre-existing at runtime.
  const countryId = req.params.id as string;
  const adminUserId = req.session.userId!;

  const ALLOWED_FIELDS = [
    'coverageLevel',
    'notes',
    'notesAr',
    'sourceUrl',
    'lastVerifiedAt',
    'verifiedBy',
  ] as const;

  const body = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = {};

  for (const field of ALLOWED_FIELDS) {
    if (field in body) {
      if (field === 'coverageLevel') {
        if (body[field] !== 'full' && body[field] !== 'partial' && body[field] !== 'roadmap') {
          res.status(400).json({ ok: false, error: "coverageLevel must be 'full', 'partial', or 'roadmap'" });
          return;
        }
      }
      if (field === 'lastVerifiedAt') {
        const parsed = body[field] === null ? null : new Date(body[field] as string);
        if (parsed !== null && Number.isNaN(parsed.getTime())) {
          res.status(400).json({ ok: false, error: 'lastVerifiedAt must be a valid date or null' });
          return;
        }
        updates.lastVerifiedAt = parsed;
        continue;
      }
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ ok: false, error: 'No recognised fields to update. Allowed: ' + ALLOWED_FIELDS.join(', ') });
    return;
  }

  try {
    const [updated] = await db
      .update(regulatoryCountriesTable)
      .set(updates)
      .where(eq(regulatoryCountriesTable.id, countryId))
      .returning();

    if (!updated) {
      res.status(404).json({ ok: false, error: 'Country not found' });
      return;
    }

    logger.info({ countryId, updates, adminUserId }, '[regulatory] Admin updated country coverage');
    res.json({ ok: true, country: updated });
  } catch (err) {
    logger.error({ err, countryId }, '[regulatory] PATCH /countries/:id failed');
    res.status(500).json({ ok: false, error: 'Failed to update country' });
  }
});

export default router;
