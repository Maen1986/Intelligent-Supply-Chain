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
 */

import { Router } from 'express';
import { asc, eq } from 'drizzle-orm';
import { db, regulatoryCountriesTable, regulatoryFrameworksTable } from '@workspace/db';
import { logger } from '../lib/logger';

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

export default router;
