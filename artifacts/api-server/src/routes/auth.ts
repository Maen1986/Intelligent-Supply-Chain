import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '@workspace/db';
import { usersTable, organizationsTable } from '@workspace/db';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { logger } from '../lib/logger';
import { loginRateLimiter, authRateLimiter, registerEmailRateLimiter, forgotPasswordRateLimiter } from '../lib/rateLimit';
import { sendPasswordResetEmail } from './notify';
import { dispatchEvent } from '../lib/webhookDispatch';

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
router.post('/register', authRateLimiter, registerEmailRateLimiter, async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'Invalid registration data', details: parsed.error.format() });
    return;
  }
  const { email, fullName, password, mobile, designation, company } = parsed.data;

  // Block the admin email from open registration unconditionally — even before
  // the admin user row exists — to close the pre-claim privilege-escalation vector.
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && email.trim().toLowerCase() === adminEmail) {
    res.status(403).json({ ok: false, error: 'This account requires admin sign-in' });
    return;
  }

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

    // #367 (Engine 4) — every account that reaches this point is becoming a
    // real, activated customer for the first time (brand-new signup, or a
    // legacy profile-only account just setting its first password). Give it
    // an organisation if it doesn't already have one. Guarded by
    // organizationId so this only ever fires once per account — safe to
    // leave in place even after #364 (Stripe) eventually adds its own
    // org-aware flows. Deliberately does NOT search for an existing
    // organisation by company name and join it — one org per signup, no
    // multi-seat/invite mechanic yet (that's a separate, later feature).
    if (!user.organizationId) {
      const orgName = (company && company.trim()) || `${fullName}'s workspace`;
      const [org] = await db.insert(organizationsTable).values({ name: orgName }).returning();
      await db.update(usersTable).set({ organizationId: org.id }).where(eq(usersTable.id, user.id));
      user = { ...user, organizationId: org.id };
      logger.info({ userId: user.id, organizationId: org.id }, '[auth] Organisation created for account (#367)');
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
      // Fire event after session is confirmed saved
      dispatchEvent(user.id, 'user.registered', {
        email:   user.email,
        company: user.company ?? null,
      });
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

  // If the submitted email matches ADMIN_EMAIL, validate against the env-var
  // password and use the same upsert logic as /auth/admin-login so the admin
  // can sign in from the regular login page without a separate URL.
  const adminEmail    = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && email.trim().toLowerCase() === adminEmail) {
    if (!adminPassword || !safeEqual(password, adminPassword)) {
      res.status(401).json({ ok: false, error: 'Invalid email or password.' });
      return;
    }
    try {
      let [user] = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail)).limit(1);
      if (!user) {
        const [created] = await db
          .insert(usersTable)
          .values({ email: adminEmail, fullName: 'Administrator', role: 'admin' })
          .returning();
        user = created;
      } else if (user.role !== 'admin') {
        const [updated] = await db
          .update(usersTable)
          .set({ role: 'admin', passwordHash: null })
          .where(eq(usersTable.id, user.id))
          .returning();
        user = updated;
      }
      establishSession(req, user);
      req.session.save(err => {
        if (err) {
          logger.error({ err }, '[auth] Admin session save failed');
          res.status(500).json({ ok: false, error: 'Session could not be created' });
          return;
        }
        logger.info({ userId: user.id, email }, '[auth] Admin signed in via /login');
        res.json({ ok: true, user: publicUser(user) });
      });
    } catch (err) {
      logger.error({ err }, '[auth] Admin login error');
      res.status(500).json({ ok: false, error: 'Login failed' });
    }
    return;
  }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || !user.passwordHash || user.role === 'admin') {
      // Same message for all failure cases — don't leak which emails are registered.
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
      dispatchEvent(user.id, 'user.login', {
        email:   user.email,
        company: user.company ?? null,
      });
      res.json({ ok: true, user: publicUser(user) });
    });
  } catch (err) {
    logger.error({ err }, '[auth] Login error');
    res.status(500).json({ ok: false, error: 'Login failed' });
  }
});

/* ── POST /api/auth/forgot-password ──────────────────────────────────────────
   Issues a short-lived (15 min) one-time reset code and emails it to the
   account's address. Always responds 200 with the same body regardless of
   whether the email exists — don't leak which emails are registered.         */
const ForgotSchema = z.object({
  email: z.string().email(),
  lang:  z.enum(['en', 'ar']).optional(),
});

const RESET_CODE_TTL_MS = 15 * 60 * 1000;

router.post('/forgot-password', forgotPasswordRateLimiter, async (req, res) => {
  const parsed = ForgotSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'Invalid email' });
    return;
  }
  const { email, lang } = parsed.data;
  const genericResponse = { ok: true, message: 'If an account exists for that email, a reset code has been sent.' };

  // Block the admin email — the admin account is credential-managed via env
  // vars and must never be reset through the self-service flow.
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && email.trim().toLowerCase() === adminEmail) {
    // Return the same generic response so the admin email is not enumerable.
    res.json(genericResponse);
    return;
  }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || !user.passwordHash) {
      // No account (or a legacy profile with no password to reset) — same reply.
      res.json(genericResponse);
      return;
    }

    // 6-digit numeric code, cryptographically random
    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    const resetTokenHash = await bcrypt.hash(code, 10);
    await db
      .update(usersTable)
      .set({ resetTokenHash, resetTokenExpiresAt: new Date(Date.now() + RESET_CODE_TTL_MS) })
      .where(eq(usersTable.id, user.id));

    const result = await sendPasswordResetEmail({ to: user.email, fullName: user.fullName, code, lang });
    if (!result.sent) {
      // Email genuinely failed — be explicit rather than stranding the user.
      logger.error({ userId: user.id, reason: result.reason }, '[auth] Reset email could not be sent');
      res.status(503).json({ ok: false, error: 'The reset email could not be sent right now. Please try again later.' });
      return;
    }
    logger.info({ userId: user.id }, '[auth] Password reset code issued');
    res.json(genericResponse);
  } catch (err) {
    logger.error({ err }, '[auth] Forgot-password error');
    res.status(500).json({ ok: false, error: 'Could not process the request' });
  }
});

/* ── POST /api/auth/reset-password ───────────────────────────────────────────
   Verifies the emailed code, sets the new password, clears the token, and
   invalidates every existing session for that account.                       */
const ResetSchema = z.object({
  email:       z.string().email(),
  code:        z.string().min(4).max(12),
  newPassword: z.string().min(6),
});

router.post('/reset-password', forgotPasswordRateLimiter, async (req, res) => {
  const parsed = ResetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'Invalid reset data' });
    return;
  }
  const { email, code, newPassword } = parsed.data;

  // Block the admin email — even with a valid code, the admin password is
  // controlled exclusively by the ADMIN_PASSWORD env var.
  const adminEmailGuard = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmailGuard && email.trim().toLowerCase() === adminEmailGuard) {
    res.status(403).json({ ok: false, error: 'This account cannot use the self-service password reset.' });
    return;
  }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    const invalid = () => res.status(400).json({ ok: false, error: 'Invalid or expired reset code.' });

    if (!user || !user.resetTokenHash || !user.resetTokenExpiresAt) { invalid(); return; }
    if (user.resetTokenExpiresAt.getTime() < Date.now())            { invalid(); return; }
    const codeOk = await bcrypt.compare(code, user.resetTokenHash);
    if (!codeOk)                                                     { invalid(); return; }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(usersTable)
      .set({ passwordHash, resetTokenHash: null, resetTokenExpiresAt: null })
      .where(eq(usersTable.id, user.id));

    // Invalidate every existing session for this account — anyone holding an
    // old cookie (including a potential attacker) is signed out.
    try {
      await db.execute(sql`DELETE FROM "session" WHERE sess ->> 'userId' = ${String(user.id)}`);
    } catch (err) {
      logger.error({ err, userId: user.id }, '[auth] Failed to invalidate old sessions after reset');
    }

    logger.info({ userId: user.id }, '[auth] Password reset completed; old sessions invalidated');
    res.json({ ok: true, message: 'Password updated. Please sign in with your new password.' });
  } catch (err) {
    logger.error({ err }, '[auth] Reset-password error');
    res.status(500).json({ ok: false, error: 'Could not reset the password' });
  }
});

/* ── POST /api/auth/change-password ─────────────────────────────────────────
   Lets a signed-in user rotate their password.  Requires the current password
   so an attacker who finds an unlocked screen cannot silently take over.
   After a successful change every OTHER session (other devices) is signed out;
   the requesting session is re-saved so the user stays logged in.             */
const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(6),
});

router.post('/change-password', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ ok: false, error: 'Not authenticated' });
    return;
  }

  // Block the admin account from rotating its password via the self-service form —
  // the admin credential is owned exclusively by the ADMIN_PASSWORD env var.
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && req.session.userEmail?.trim().toLowerCase() === adminEmail) {
    res.status(403).json({ ok: false, error: 'The admin account password cannot be changed via this form.' });
    return;
  }

  const parsed = ChangePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'New password must be at least 6 characters.' });
    return;
  }
  const { currentPassword, newPassword } = parsed.data;

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user || !user.passwordHash) {
      res.status(400).json({ ok: false, error: 'No password is set on this account.' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(400).json({ ok: false, error: 'Current password is incorrect.' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(usersTable)
      .set({ passwordHash, resetTokenHash: null, resetTokenExpiresAt: null })
      .where(eq(usersTable.id, user.id));

    // Invalidate every OTHER session for this account so other devices are
    // signed out, but keep the current session alive (user stays logged in).
    const currentSid = (req.session as unknown as { id: string }).id;
    try {
      await db.execute(
        sql`DELETE FROM "session" WHERE sess ->> 'userId' = ${String(user.id)} AND sid != ${currentSid}`
      );
    } catch (err) {
      logger.error({ err, userId: user.id }, '[auth] Failed to invalidate other sessions after password change');
    }

    logger.info({ userId: user.id }, '[auth] Password changed; other sessions invalidated');
    res.json({ ok: true, message: 'Password updated successfully.' });
  } catch (err) {
    logger.error({ err }, '[auth] Change-password error');
    res.status(500).json({ ok: false, error: 'Could not update the password' });
  }
});

/* ── POST /api/auth/update-profile ───────────────────────────────────────────
   Lets a signed-in user update their name, mobile, designation, and company.
   Updates the DB row and refreshes the session so the UI reflects the change
   immediately without requiring a fresh login.                                */
const UpdateProfileSchema = z.object({
  fullName:    z.string().min(2),
  mobile:      z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  company:     z.string().optional().nullable(),
});

router.post('/update-profile', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ ok: false, error: 'Not authenticated' });
    return;
  }

  const parsed = UpdateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'Invalid profile data', details: parsed.error.format() });
    return;
  }
  const { fullName, mobile, designation, company } = parsed.data;

  try {
    const [user] = await db
      .update(usersTable)
      .set({
        fullName,
        mobile:      mobile      ?? null,
        designation: designation ?? null,
        company:     company     ?? null,
      })
      .where(eq(usersTable.id, userId))
      .returning();

    if (!user) {
      res.status(404).json({ ok: false, error: 'User not found' });
      return;
    }

    // Refresh session fields so /me and subsequent requests reflect the new values
    establishSession(req, user);
    req.session.save(err => {
      if (err) {
        logger.error({ err }, '[auth] Session save failed after profile update');
        res.status(500).json({ ok: false, error: 'Profile updated but session could not be refreshed' });
        return;
      }
      logger.info({ userId }, '[auth] User updated profile');
      res.json({ ok: true, user: publicUser(user) });
    });
  } catch (err) {
    logger.error({ err }, '[auth] Update-profile error');
    res.status(500).json({ ok: false, error: 'Could not update profile' });
  }
});

/* ── POST /api/auth/admin-login ──────────────────────────────────────────────
   Password-protected sign-in for the consultant. Credentials come from the
   ADMIN_EMAIL / ADMIN_PASSWORD environment secrets; on success the matching
   user row is upserted with role 'admin' and an admin session is created.    */
const AdminLoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

router.post('/admin-login', async (req, res) => {
  const adminEmail    = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    res.status(503).json({ ok: false, error: 'Admin sign-in is not configured' });
    return;
  }
  const parsed = AdminLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'Email and password are required' });
    return;
  }
  const email    = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;

  // Compare both factors; timing-safe on the password.
  if (!safeEqual(email, adminEmail) || !safeEqual(password, adminPassword)) {
    logger.warn({ email }, '[auth] Failed admin login attempt');
    res.status(401).json({ ok: false, error: 'Invalid admin credentials' });
    return;
  }

  try {
    // Upsert the admin user row so submissions/session data stay consistent.
    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail)).limit(1);
    if (!user) {
      const [created] = await db
        .insert(usersTable)
        .values({ email: adminEmail, fullName: 'Administrator', role: 'admin' })
        .returning();
      user = created;
      logger.info({ userId: user.id }, '[auth] Admin user created');
    } else if (user.role !== 'admin') {
      // Clear any existing passwordHash so a pre-registered attacker-controlled
      // account cannot later sign in via /auth/login with the stolen password.
      const [updated] = await db
        .update(usersTable)
        .set({ role: 'admin', passwordHash: null, resetTokenHash: null, resetTokenExpiresAt: null })
        .where(eq(usersTable.id, user.id))
        .returning();
      user = updated;
      logger.info({ userId: user.id }, '[auth] User promoted to admin; previous credentials cleared');
    }

    // Prevent session fixation: issue a fresh session id for the admin.
    req.session.regenerate(regenErr => {
      if (regenErr) {
        logger.error({ err: regenErr }, '[auth] Admin session regenerate failed');
        res.status(500).json({ ok: false, error: 'Session could not be created' });
        return;
      }
      req.session.userId          = user.id;
      req.session.userEmail       = user.email;
      req.session.userFullName    = user.fullName;
      req.session.userMobile      = user.mobile ?? null;
      req.session.userDesignation = user.designation ?? null;
      req.session.userCompany     = user.company ?? null;
      req.session.userRole        = 'admin';
      req.session.save(err => {
        if (err) {
          logger.error({ err }, '[auth] Admin session save failed');
          res.status(500).json({ ok: false, error: 'Session could not be created' });
          return;
        }
        logger.info({ userId: user.id }, '[auth] Admin signed in');
        res.json({
          ok: true,
          user: {
            id:          user.id,
            email:       user.email,
            fullName:    user.fullName,
            mobile:      user.mobile,
            designation: user.designation,
            company:     user.company,
            role:        'admin',
          },
        });
      });
    });
  } catch (err) {
    logger.error({ err }, '[auth] Admin login error');
    res.status(500).json({ ok: false, error: 'Admin sign-in failed' });
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
