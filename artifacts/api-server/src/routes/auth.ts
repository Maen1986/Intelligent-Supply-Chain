import { Router } from 'express';
import { db } from '@workspace/db';
import { usersTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { logger } from '../lib/logger';
import { loginRateLimiter } from '../lib/rateLimit';

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
  password:    z.string().min(6),
  mobile:      z.string().optional(),
  designation: z.string().optional(),
  company:     z.string().optional(),
});

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

function establishSession(req: Parameters<Parameters<typeof router.post>[1]>[0], user: typeof usersTable.$inferSelect) {
  req.session.userId          = user.id;
  req.session.userEmail       = user.email;
  req.session.userFullName    = user.fullName;
  req.session.userMobile      = user.mobile ?? null;
  req.session.userDesignation = user.designation ?? null;
  req.session.userCompany     = user.company ?? null;
  req.session.userRole        = user.role;
}

function publicUser(user: typeof usersTable.$inferSelect) {
  return {
    id:          user.id,
    email:       user.email,
    fullName:    user.fullName,
    mobile:      user.mobile,
    designation: user.designation,
    company:     user.company,
    role:        user.role,
  };
}

/* ── POST /api/auth/register ─────────────────────────────────────────────────
   Creates a user with a bcrypt-hashed password and establishes a server-side
   session. Legacy profile-only accounts (no password hash) may claim their
   account by registering again with the same email.                          */
router.post('/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'Invalid registration data', details: parsed.error.format() });
    return;
  }
  const { email, fullName, password, mobile, designation, company } = parsed.data;

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

    if (!user) {
      const [created] = await db
        .insert(usersTable)
        .values({ email, fullName, mobile, designation, company, role: 'user', passwordHash })
        .returning();
      user = created;
      logger.info({ userId: user.id, email }, '[auth] New user registered');
    } else if (!user.passwordHash) {
      // Legacy account without a password — let them set one now
      const [updated] = await db
        .update(usersTable)
        .set({ fullName, mobile, designation, company, passwordHash })
        .where(eq(usersTable.id, user.id))
        .returning();
      user = updated;
      logger.info({ userId: user.id, email }, '[auth] Legacy user set a password');
    } else {
      res.status(409).json({ ok: false, error: 'An account with this email already exists. Please sign in.' });
      return;
    }

    // Write server-side session
    establishSession(req, user);

    req.session.save(err => {
      if (err) {
        // Use console.error so the raw message definitely surfaces in workflow logs
        console.error('[auth] SESSION SAVE ERROR:', err);
        logger.error({ err }, '[auth] Session save failed');
        res.status(500).json({ ok: false, error: 'Session could not be created', detail: String(err) });
        return;
      }
      res.json({ ok: true, user: publicUser(user) });
    });
  } catch (err) {
    logger.error({ err }, '[auth] Registration error');
    res.status(500).json({ ok: false, error: 'Registration failed' });
  }
});

/* ── POST /api/auth/login ────────────────────────────────────────────────────
   Verifies email + password against the bcrypt hash and establishes a
   server-side session. Works from any device/browser.                        */
router.post('/login', loginRateLimiter, async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'Invalid login data' });
    return;
  }
  const { email, password } = parsed.data;

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || !user.passwordHash) {
      // Same message whether the account is missing or has no password yet —
      // don't leak which emails are registered.
      res.status(401).json({ ok: false, error: 'Invalid email or password.' });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ ok: false, error: 'Invalid email or password.' });
      return;
    }

    establishSession(req, user);
    req.session.save(err => {
      if (err) {
        logger.error({ err }, '[auth] Session save failed');
        res.status(500).json({ ok: false, error: 'Session could not be created' });
        return;
      }
      logger.info({ userId: user.id, email }, '[auth] User signed in');
      res.json({ ok: true, user: publicUser(user) });
    });
  } catch (err) {
    logger.error({ err }, '[auth] Login error');
    res.status(500).json({ ok: false, error: 'Login failed' });
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
