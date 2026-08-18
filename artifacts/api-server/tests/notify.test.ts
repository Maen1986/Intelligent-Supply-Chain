import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, makeLoggerMock } from './helpers';

vi.mock('../src/lib/logger', () => makeLoggerMock());

const sendMailMock = vi.fn();

// notify.ts now sends via the Resend HTTP API (global fetch) instead of
// nodemailer. This mock intercepts those fetch calls, forwards the parsed
// JSON body to sendMailMock (awaiting it so a rejection propagates the same
// way a nodemailer sendMail() rejection used to), and returns a fetch-shaped
// Response so notify.ts's res.ok check passes. Every other assertion below
// (call counts, mail content, attachments) is unchanged.
vi.stubGlobal('fetch', vi.fn(async (_url: string, opts: { body: string }) => {
  const body = JSON.parse(opts.body);
  const result = await sendMailMock(body);
  return { ok: true, text: async () => '', json: async () => (result ?? { id: 'test' }) };
}));

// Keep retry delay at 0 in tests — must be set before the module is imported.
process.env.EMAIL_RETRY_DELAY_MS = '0';
process.env.RESEND_API_KEY = 'test-api-key';

const notifyModule = await import('../src/routes/notify');
const notifyRouter = notifyModule.default;
const { sendBriefingEmail, sendEscalationEmail } = notifyModule;

const lead = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  mobile: '+966500000000',
  designation: 'CPO',
  company: 'Acme',
};

// Count only genuine sendMail(mailOptions) invocations
const realCalls = () => sendMailMock.mock.calls.filter(c => c.length > 0).length;

beforeEach(() => {
  sendMailMock.mockReset();
  sendMailMock.mockResolvedValue({ id: 'test' });
  vi.stubEnv('RESEND_API_KEY', 'test-api-key');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/notify/lead', () => {
  it('emails all recipients and returns sent: true', async () => {
    const app = makeApp('/api/notify', notifyRouter);
    const res = await request(app).post('/api/notify/lead').send(lead);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.sent).toBe(true);
    expect(sendMailMock).toHaveBeenCalledTimes(2); // both notify addresses
    expect(sendMailMock.mock.calls[0][0].subject).toContain(lead.fullName);
  });

  it('returns 503 with a reason when email is not configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const app = makeApp('/api/notify', notifyRouter);
    const res = await request(app).post('/api/notify/lead').send(lead);
    expect(res.status).toBe(503);
    expect(res.body.sent).toBe(false);
    expect(res.body.reason).toMatch(/RESEND_API_KEY/);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('recovers from a transient per-recipient failure via retry', async () => {
    // Second recipient fails once; the automatic retry succeeds.
    sendMailMock
      .mockResolvedValueOnce({ messageId: 'ok' })
      .mockRejectedValueOnce(new Error('mailbox full'));
    const app = makeApp('/api/notify', notifyRouter);
    const res = await request(app).post('/api/notify/lead').send(lead);
    expect(res.status).toBe(200);
    expect(res.body.sent).toBe(true);
    expect(res.body.errors).toBeUndefined();
    expect(realCalls()).toBe(3); // 2 attempts + 1 retry
  });

  it('reports per-recipient errors when a recipient fails even after the retry', async () => {
    const failing = 'yahoo';
    sendMailMock.mockImplementation((opts?: { to: string }) =>
      opts && opts.to.includes(failing)
        ? Promise.reject(new Error('mailbox full'))
        : Promise.resolve({ messageId: 'ok' })
    );
    const app = makeApp('/api/notify', notifyRouter);
    const res = await request(app).post('/api/notify/lead').send(lead);
    expect(res.status).toBe(200);
    expect(res.body.sent).toBe(true);
    expect(res.body.errors).toEqual(['mailbox full']);
  });
});

describe('POST /api/notify/booking', () => {
  it('includes booking details in the email', async () => {
    const app = makeApp('/api/notify', notifyRouter);
    const res = await request(app).post('/api/notify/booking').send({
      ...lead,
      preferredDate: '2026-08-01',
      preferredTime: '10:00',
      serviceType: 'Procurement Review',
    });
    expect(res.status).toBe(200);
    expect(res.body.sent).toBe(true);
    const mail = sendMailMock.mock.calls[0][0];
    expect(mail.subject).toContain('2026-08-01');
    expect(mail.html).toContain('Procurement Review');
  });
});

describe('POST /api/notify/diagnostic', () => {
  it('includes score and segment breakdown', async () => {
    const app = makeApp('/api/notify', notifyRouter);
    const res = await request(app).post('/api/notify/diagnostic').send({
      ...lead,
      overallScore: 68,
      scores: { procurement: 60, planning: 76 },
    });
    expect(res.status).toBe(200);
    const mail = sendMailMock.mock.calls[0][0];
    expect(mail.subject).toContain('68%');
    expect(mail.html).toContain('procurement');
  });
});

describe('POST /api/notify/maturity', () => {
  it('includes the maturity level in the subject', async () => {
    const app = makeApp('/api/notify', notifyRouter);
    const res = await request(app).post('/api/notify/maturity').send({
      ...lead,
      overallLevel: 'Developing',
      scores: { procurement: 2 },
    });
    expect(res.status).toBe(200);
    expect(sendMailMock.mock.calls[0][0].subject).toContain('Developing');
  });
});

describe('sendBriefingEmail', () => {
  it('attaches the PDF and reports success', async () => {
    const result = await sendBriefingEmail({
      contactName: 'Jane Doe',
      contactEmail: 'jane@example.com',
      company: 'Acme',
      industry: 'Manufacturing',
      revenueBand: 'SAR 100M–500M',
      language: 'en',
      maturityScore: '42',
      maturityLevel: 'Developing',
      pdfBuffer: Buffer.from('%PDF-1.4 test'),
      pdfFilename: 'briefing.pdf',
    });
    expect(result.sent).toBe(true);
    const mail = sendMailMock.mock.calls[0][0];
    expect(mail.attachments).toHaveLength(1);
    expect(mail.attachments[0].filename).toBe('briefing.pdf');
    expect(mail.attachments[0].content_type).toBe('application/pdf');
  });

  it('returns a descriptive failure when email is not configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const result = await sendBriefingEmail({
      contactName: null,
      contactEmail: null,
      company: null,
      industry: 'Manufacturing',
      revenueBand: 'SAR 100M–500M',
      language: 'ar',
      maturityScore: '42',
      maturityLevel: 'Developing',
      pdfBuffer: Buffer.from(''),
      pdfFilename: 'briefing.pdf',
    });
    expect(result.sent).toBe(false);
    expect(result.reason).toMatch(/RESEND_API_KEY/);
    expect(sendMailMock).not.toHaveBeenCalled();
  });
});

describe('sendBriefingEmail retry behaviour', () => {
  const baseParams = {
    contactName: 'Test Lead',
    contactEmail: 'lead@example.com',
    company: 'Acme',
    industry: 'FMCG',
    revenueBand: '10-50M',
    language: 'en' as const,
    maturityScore: '55',
    maturityLevel: 'Developing',
  };

  it('sends normally when the transporter works', async () => {
    const result = await sendBriefingEmail(baseParams);
    expect(result.sent).toBe(true);
    expect(result.errors).toBeUndefined();
    // one call per recipient (2 recipients), no retries
    expect(realCalls()).toBe(2);
  });

  it('retries once per recipient and succeeds on the retry', async () => {
    // First attempt for each recipient fails; retry succeeds.
    const failedOnce = new Set<string>();
    sendMailMock.mockImplementation((opts?: { to: string }) => {
      if (!opts) return Promise.resolve({});
      if (!failedOnce.has(opts.to)) {
        failedOnce.add(opts.to);
        return Promise.reject(new Error('454 Throttled (test)'));
      }
      return Promise.resolve({});
    });
    const result = await sendBriefingEmail(baseParams);
    expect(result.sent).toBe(true);
    expect(result.errors).toBeUndefined();
    // 2 recipients × (1 attempt + 1 retry)
    expect(realCalls()).toBe(4);
  });

  it('reports sent=false when every attempt (incl. retries) fails', async () => {
    sendMailMock.mockImplementation((opts?: unknown) =>
      opts ? Promise.reject(new Error('535 Auth failed (test)')) : Promise.resolve({}));
    const result = await sendBriefingEmail(baseParams);
    expect(result.sent).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
    expect(result.reason).toContain('All recipients failed after retry');
    expect(realCalls()).toBe(4);
  });

  it('reports sent=true when at least one recipient succeeds', async () => {
    sendMailMock.mockImplementation((opts?: { to: string }) => {
      if (!opts) return Promise.resolve({});
      // Fail all attempts for the first recipient, succeed for the second
      return opts.to.includes('yahoo')
        ? Promise.resolve({})
        : Promise.reject(new Error('mailbox full (test)'));
    });
    const result = await sendBriefingEmail(baseParams);
    expect(result.sent).toBe(true);
    expect(result.errors?.length).toBe(1);
  });
});

describe('sendEscalationEmail', () => {
  const params = {
    subject: 'Escalation: Jane Doe',
    clientName: 'Jane Doe',
    clientEmail: 'jane@example.com',
    clientMobile: '+966500000000',
    company: 'Acme',
    title: 'CPO',
    industry: 'Manufacturing',
    challenge: 'Long lead times',
    satisfactionScore: 2,
    diagnosisSummary: 'Diagnosis',
    solutionSummary: 'Solution',
  };

  it('sends the escalation to all recipients', async () => {
    await expect(sendEscalationEmail(params)).resolves.toBeUndefined();
    expect(sendMailMock).toHaveBeenCalledTimes(2);
  });

  it('throws when email is not configured so callers can react', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    await expect(sendEscalationEmail(params)).rejects.toThrow(/RESEND_API_KEY/);
  });
});
