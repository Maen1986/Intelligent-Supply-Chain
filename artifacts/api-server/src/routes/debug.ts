import { Router } from 'express';
import pg from 'pg';

const router = Router();

/* GET /api/debug/pg — verifies the pool can connect and query */
router.get('/pg', async (req, res) => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
  try {
    const result = await pool.query('SELECT NOW() as now, current_database() as db');
    res.json({ ok: true, ...result.rows[0] });
  } catch (err: any) {
    console.error('[debug] PG pool error:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await pool.end();
  }
});

/* GET /api/debug/session — verifies session middleware is wired */
router.get('/session', (req, res) => {
  req.session.userId = 9999;
  req.session.save(err => {
    if (err) {
      console.error('[debug] session save error:', err);
      res.status(500).json({ ok: false, error: String(err) });
    } else {
      res.json({ ok: true, sessionId: req.session.id });
    }
  });
});

export default router;
