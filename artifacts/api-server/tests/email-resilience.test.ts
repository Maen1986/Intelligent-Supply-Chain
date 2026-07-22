import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, dbState, resetDbState, makeDbMock, makeLoggerMock } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());

const { sendBriefingEmail } = vi.hoisted(() => ({ sendBriefingEmail: vi.fn() }));
vi.mock('../src/routes/notify', () => ({ sendBriefingEmail }));

import submissionsRouter from '../src/routes/submissions';
import { db } from '@workspace/db';

const flush = () => new Promise(r => setTimeout(r, 20));

beforeEach(() => {
  resetDbState();
  sendBriefingEmail.mockReset();
  (db.update as ReturnType<typeof vi.fn>).mockClear();
});

const briefingBody = {
  tool: 'command_centre',
  contactEmail: 'lead@example.com',
  inputs: { industry: 'FMCG', revenueBand: '10-50M' },
  outputs: { maturityScore: 55, maturityLevel: 'Developing' },
};

describe('POST /api/submissions — email outcome tracking', () => {
  it('marks emailSentAt when the briefing email is delivered', async () => {
    dbState.insertRows = [{ id: 10 }];
    sendBriefingEmail.mockResolvedValue({ sent: true });
    const app = makeApp('/api/submissions', submissionsRouter);
    const res = await request(app).post('/api/submissions').send(briefingBody);
    expect(res.status).toBe(200);
    await flush();
    expect(db.update).toHaveBeenCalledTimes(1);
  });

  it('records emailError on the row when the send fails, without failing the API response', async () => {
    dbState.insertRows = [{ id: 11 }];
    sendBriefingEmail.mockResolvedValue({ sent: false, reason: 'All recipients failed after retry: 535 Auth (test)' });
    const app = makeApp('/api/submissions', submissionsRouter);
    const res = await request(app).post('/api/submissions').send(briefingBody);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, id: 11 });
    await flush();
    expect(db.update).toHaveBeenCalledTimes(1);
  });

  it('records emailError when sendBriefingEmail throws', async () => {
    dbState.insertRows = [{ id: 12 }];
    sendBriefingEmail.mockRejectedValue(new Error('transporter exploded (test)'));
    const app = makeApp('/api/submissions', submissionsRouter);
    const res = await request(app).post('/api/submissions').send(briefingBody);
    expect(res.status).toBe(200);
    await flush();
    expect(db.update).toHaveBeenCalledTimes(1);
  });
});
