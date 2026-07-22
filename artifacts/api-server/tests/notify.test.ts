import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, makeLoggerMock } from './helpers';

vi.mock('../src/lib/logger', () => makeLoggerMock());

const sendMailMock = vi.fn();
vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail: sendMailMock }) },
}));

import notifyRouter, { sendBriefingEmail, sendEscalationEmail } from '../src/routes/notify';

const lead = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  mobile: '+966500000000',
  designation: 'CPO',
  company: 'Acme',
};

beforeEach(() => {
  sendMailMock.mockReset();
  sendMailMock.mockResolvedValue({ messageId: 'test' });
  vi.stubEnv('GMAIL_APP_PASSWORD', 'test-app-password');
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
    vi.stubEnv('GMAIL_APP_PASSWORD', '');
    const app = makeApp('/api/notify', notifyRouter);
    const res = await request(app).post('/api/notify/lead').send(lead);
    expect(res.status).toBe(503);
    expect(res.body.sent).toBe(false);
    expect(res.body.reason).toMatch(/GMAIL_APP_PASSWORD/);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('reports per-recipient errors but still returns 200 when transport works', async () => {
    sendMailMock
      .mockResolvedValueOnce({ messageId: 'ok' })
      .mockRejectedValueOnce(new Error('mailbox full'));
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
    expect(mail.attachments[0].contentType).toBe('application/pdf');
  });

  it('returns a descriptive failure when email is not configured', async () => {
    vi.stubEnv('GMAIL_APP_PASSWORD', '');
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
    expect(result.reason).toMatch(/GMAIL_APP_PASSWORD/);
    expect(sendMailMock).not.toHaveBeenCalled();
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
    vi.stubEnv('GMAIL_APP_PASSWORD', '');
    await expect(sendEscalationEmail(params)).rejects.toThrow(/GMAIL_APP_PASSWORD/);
  });
});
