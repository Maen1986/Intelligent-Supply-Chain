import express, { type Express, type Router, type RequestHandler } from 'express';
import { vi } from 'vitest';

/* ── Shared fake-DB state ────────────────────────────────────────────────────
   Tests mutate this state to control what the mocked drizzle chains return. */
export const dbState = {
  selectRows: [] as any[],
  insertRows: [] as any[],
  updateRows: [] as any[],
  /** When true, the next awaited db chain rejects with an Error. */
  failNext: false,
  insertedValues: [] as any[],
};

export function resetDbState() {
  dbState.selectRows = [];
  dbState.insertRows = [];
  dbState.updateRows = [];
  dbState.failNext = false;
  dbState.insertedValues = [];
}

/** A drizzle-like chain: every builder method returns itself; awaiting it
    resolves to the configured rows (or rejects when failNext is set). */
function chain(rowsGetter: () => any[], recordValues = false) {
  const c: any = {};
  for (const m of ['from', 'where', 'orderBy', 'limit', 'offset', 'set', 'returning']) {
    c[m] = () => c;
  }
  c.values = (v: any) => {
    if (recordValues) dbState.insertedValues.push(v);
    return c;
  };
  const exec = (): Promise<any[]> => {
    if (dbState.failNext) {
      dbState.failNext = false;
      return Promise.reject(new Error('db failure (test)'));
    }
    return Promise.resolve(rowsGetter());
  };
  c.then = (res: any, rej: any) => exec().then(res, rej);
  c.catch = (fn: any) => exec().catch(fn);
  return c;
}

/** Factory used by vi.mock('@workspace/db', ...) in each test file. */
export function makeDbMock() {
  return {
    db: {
      select: vi.fn(() => chain(() => dbState.selectRows)),
      insert: vi.fn(() => chain(() => dbState.insertRows, true)),
      update: vi.fn(() => chain(() => dbState.updateRows)),
      execute: vi.fn(async () => ({ rows: [] })),
    },
    usersTable: { email: 'email', id: 'id' },
    submissionsTable: { tool: 'tool', createdAt: 'createdAt' },
    feedbackTable: { tool: 'tool', rating: 'rating', nps: 'nps', comment: 'comment', createdAt: 'createdAt' },
    pool: {},
  };
}

/** Silent logger mock factory. */
export function makeLoggerMock() {
  const noop = () => {};
  return { logger: { info: noop, warn: noop, error: noop, debug: noop, child: () => ({ info: noop, warn: noop, error: noop, debug: noop }) } };
}

export type SessionData = Record<string, unknown>;

/** Build a minimal express app that mounts a router with a fake session. */
export function makeApp(basePath: string, router: Router, session: SessionData = {}): Express {
  const app = express();
  // Mirror the real app (src/app.ts): trust the first proxy hop so req.ip
  // reflects X-Forwarded-For, matching per-IP rate limiting behind Replit's proxy.
  app.set('trust proxy', 1);
  app.use(express.json());
  const fakeSession: RequestHandler = (req, _res, next) => {
    (req as any).session = {
      ...session,
      save: (cb: (err?: unknown) => void) => cb(),
      destroy: (cb: (err?: unknown) => void) => cb(),
    };
    next();
  };
  app.use(fakeSession);
  app.use(basePath, router);
  return app;
}
