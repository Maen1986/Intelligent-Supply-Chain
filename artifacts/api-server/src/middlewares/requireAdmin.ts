import type { RequestHandler } from 'express';

/* Admin guard: reject callers without an authenticated admin session.
   Used to protect costly or sensitive endpoints (e.g. forcing an AI
   regeneration of the intelligence feed). */
export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    res.status(401).json({ ok: false, error: 'Authentication required' });
    return;
  }
  if (req.session.userRole !== 'admin') {
    res.status(403).json({ ok: false, error: 'Admin access required' });
    return;
  }
  next();
};
