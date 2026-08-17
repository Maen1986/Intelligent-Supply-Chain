/**
 * GET /api/claim/:token
 *
 * Engine 2 Part B (Platform Strategy Review v5, Task #205/#189). The
 * landing point for the claim-link email sent on every diagnostic
 * submission with a contact email (see submissions.ts). Finds-or-creates a
 * passwordless account for that email -- the same "legacy profile-only
 * account" concept auth.ts's /register already supports -- converts the
 * diagnostic's recommendations into findings_actions rows owned by that
 * account, establishes a session, and redirects into the app. Hit by a
 * direct browser navigation (someone clicking a link in an email), so
 * responses are redirects / plain text, not JSON.
 *
 * Idempotent: clicking an already-claimed link re-establishes a session
 * for the same account rather than erroring -- someone may reasonably
 * click the same email link twice.
 */
import { Router, type Request } from 'express';
import { db } from '@workspace/db';
import { usersTable, claimTokensTable, submissionsTable } from '@workspace/db';
import { eq, sql } from 'drizzle-orm';
import { authRateLimiter } from '../lib/rateLimit';
import { logger } from '../lib/logger';
import { dispatchEvent } from '../lib/webhookDispatch';

const router = Router();

interface DiagnosticOutputs {
  recommendations?: unknown;
}

function establishClaimSession(req: Request, user: typeof usersTable.$inferSelect) {
  req.session.userId          = user.id;
  req.session.userEmail       = user.email;
  req.session.userFullName    = user.fullName;
  req.session.userMobile      = user.mobile ?? null;
  req.session.userDesignation = user.designation ?? null;
  req.session.userCompany     = user.company ?? null;
  req.session.userRole        = user.role;
}

router.get('/claim/:token', authRateLimiter, async (req, res) => {
  const token = String(req.params.token || '');
  if (!token) {
    res.status(400).send('Missing claim token.');
    return;
  }

  try {
    const [claim] = await db.select().from(claimTokensTable).where(eq(claimTokensTable.token, token)).limit(1);
    if (!claim) {
      res.status(404).send('This link is invalid.');
      return;
    }

    // Already claimed -- re-establish a session for the same account
    // rather than erroring; the same email link may reasonably be clicked
    // more than once.
    if (claim.claimedAt && claim.userId) {
      const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.id, claim.userId)).limit(1);
      if (existingUser) {
        establishClaimSession(req, existingUser);
        req.session.save(() => res.redirect('https://isupplychain.io/action-tracker'));
        return;
      }
      // Fall through to the full claim flow if the linked user somehow vanished.
    }

    if (claim.expiresAt.getTime() < Date.now()) {
      res.status(410).send('This link has expired. Please run a new diagnostic to get a fresh link.');
      return;
    }

    // Find-or-create a passwordless account for this email -- same pattern
    // auth.ts's /register uses for "legacy profile-only accounts".
    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, claim.email)).limit(1);

    const [submission] = await db.select().from(submissionsTable).where(eq(submissionsTable.id, claim.submissionId)).limit(1);
    const fallbackName = claim.email.split('@')[0] || 'ISC Client';

    if (!user) {
      const [created] = await db
        .insert(usersTable)
        .values({
          email:    claim.email,
          fullName: submission?.contactName ?? fallbackName,
          company:  submission?.contactCompany ?? null,
          role:     'user',
        })
        .returning();
      user = created;
      logger.info({ userId: user.id, email: claim.email }, '[claim] New passwordless account created from diagnostic claim');
    }

    // Convert the diagnostic's recommendations into findings_actions rows.
    // Idempotent via the UNIQUE(user_id, source, source_ref_id, item_key)
    // constraint -- re-claiming never duplicates or clobbers progress.
    const outputs = (submission?.outputs ?? {}) as DiagnosticOutputs;
    const recs = Array.isArray(outputs.recommendations) ? (outputs.recommendations as unknown[]) : [];
    for (let i = 0; i < recs.length; i++) {
      const action = typeof recs[i] === 'string' ? (recs[i] as string) : null;
      if (!action) continue;
      try {
        await db.execute(sql`
          INSERT INTO findings_actions (user_id, source, source_ref_id, item_key, action)
          VALUES (${user.id}, 'diagnostic', ${claim.submissionId}, ${`rec-${i}`}, ${action})
          ON CONFLICT (user_id, source, source_ref_id, item_key) DO NOTHING
        `);
      } catch (err) {
        logger.error({ err, userId: user.id, submissionId: claim.submissionId }, '[claim] findings_actions insert failed');
      }
    }

    await db.update(claimTokensTable).set({ claimedAt: new Date(), userId: user.id }).where(eq(claimTokensTable.id, claim.id));

    dispatchEvent(user.id, 'diagnostic.claimed', {
      submissionId: claim.submissionId,
      itemCount:    recs.length,
    });

    establishClaimSession(req, user);
    req.session.save(err => {
      if (err) {
        logger.error({ err }, '[claim] Session save failed');
        res.status(500).send('Could not establish your session. Please try the link again.');
        return;
      }
      res.redirect('https://isupplychain.io/action-tracker');
    });
  } catch (err) {
    logger.error({ err, token }, '[claim] Claim failed');
    res.status(500).send('Something went wrong claiming your account. Please try again.');
  }
});

export default router;
