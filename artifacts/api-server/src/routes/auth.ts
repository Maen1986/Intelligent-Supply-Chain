import { Router } from 'express';
import { db } from '@workspace/db';
import { usersTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '../lib/logger';

// ── Session type augmentation ────────────────────────────────────────────────
declare module 'express-session' {
  interface SessionData {
    userId:          number;
    userEmail:       string;
    userFullName:    string;
    userMobile:      string | null;
    userDesignation: string | null;
    userCompany:     string | null;
    userRole:        string;
  }
}

const router = Router();

const RegisterSchema = z.object({
  email:       z.string().email(),
  fullName:    z.string().min(2),
  mobile:      z.string().optional(),
  designation: z.string().optional(),
  company:     z.string().optional(),
});

/* ── POST /api/auth/register ─────────────────────────────────────────────────
   Creates or retrieves a user by email and establishes a server-side session.
   No password required — this is contact-profile auth for lead capture.       */
router.post('/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'Invalid registration data', details: parsed.error.format() });
    return;
  }
  const { email, fullName, mobile, designation, company } = parsed.data;

  try {
    // Upsert: find existing user by email or create a new one
    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

    if (!user) {
      const [created] = await db
        .insert(usersTable)
        .values({ email, fullName, mobile, designation, company, role: 'user' })
        .returning();
      user = created;
      logger.info({ userId: user.id, email }, '[auth] New user registered');
    } else {
      // Update profile fields on each re-registration
      const [updated] = await db
        .update(usersTable)
        .set({ fullName, mobile, designation, company })
        .where(eq(usersTable.id, user.id))
        .returning();
      user = updated;
      logger.info({ userId: user.id, email }, '[auth] Existing user profile updated');
    }

    // Write server-side session
    req.session.userId          = user.id;
    req.session.userEmail       = user.email;
    req.session.userFullName    = user.fullName;
    req.session.userMobile      = user.mobile ?? null;
    req.session.userDesignation = user.designation ?? null;
    req.session.userCompany     = user.company ?? null;
    req.session.userRole        = user.role;

    req.session.save(err => {
      if (err) {
        // Use console.error so the raw message definitely surfaces in workflow logs
        console.error('[auth] SESSION SAVE ERROR:', err);
        logger.error({ err }, '[auth] Session save failed');
        res.status(500).json({ ok: false, error: 'Session could not be created', detail: String(err) });
        return;
      }
      res.json({
        ok: true,
        user: {
          id:          user.id,
          email:       user.email,
          fullName:    user.fullName,
          mobile:      user.mobile,
          designation: user.designation,
          company:     user.company,
          role:        user.role,
        },
      });
    });
  } catch (err) {
    logger.error({ err }, '[auth] Registration error');
    res.status(500).json({ ok: false, error: 'Registration failed' });
  }
});

/* ── GET /api/auth/me ────────────────────────────────────────────────────────
   Validates the session cookie server-side and returns the user profile.
   Returns 401 if no valid session exists — client-side localStorage cannot
   fake this response.                                                          */
router.get('/me', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ ok: false, error: 'Not authenticated' });
    return;
  }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      req.session.destroy(() => {});
      res.status(401).json({ ok: false, error: 'User not found' });
      return;
    }
    res.json({
      ok: true,
      user: {
        id:          user.id,
        email:       user.email,
        fullName:    user.fullName,
        mobile:      user.mobile,
        designation: user.designation,
        company:     user.company,
        role:        user.role,
      },
    });
  } catch (err) {
    logger.error({ err }, '[auth] /me error');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ── POST /api/auth/logout ───────────────────────────────────────────────────
   Destroys the server-side session. After this, no cookie can claim auth.     */
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      logger.error({ err }, '[auth] Logout error');
      res.status(500).json({ ok: false, error: 'Logout failed' });
      return;
    }
    res.clearCookie('isc.sid');
    res.json({ ok: true });
  });
});

export default router;
