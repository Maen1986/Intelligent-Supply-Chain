import { Router } from 'express';
import nodemailer from 'nodemailer';
import { logger } from '../lib/logger';

const router = Router();

const NOTIFY_EMAILS = [
  'haqash.maen@gmail.com',
  'maen.haqash@yahoo.com',
];

// ── Startup config check (called once when server starts) ────────────────────
export function checkEmailConfig() {
  const pass = process.env.GMAIL_APP_PASSWORD;
  const user = process.env.GMAIL_USER || 'haqash.maen@gmail.com';
  if (!pass) {
    logger.error(
      '╔══════════════════════════════════════════════════════════════╗\n' +
      '║  EMAIL NOTIFICATIONS ARE DISABLED                           ║\n' +
      '║  GMAIL_APP_PASSWORD secret is not set.                      ║\n' +
      '║  Every lead, booking, diagnostic and maturity alert         ║\n' +
      '║  will be SILENTLY LOST until this is configured.            ║\n' +
      '║  → Go to Replit Secrets and add GMAIL_APP_PASSWORD          ║\n' +
      '╚══════════════════════════════════════════════════════════════╝'
    );
  } else {
    logger.info(`[notify] Email configured — will send from ${user} to ${NOTIFY_EMAILS.join(', ')}`);
  }
}

function createTransporter() {
  const user = process.env.GMAIL_USER || 'haqash.maen@gmail.com';
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

function buildEmailHtml(subject: string, rows: Record<string, string>) {
  const rowsHtml = Object.entries(rows)
    .map(([k, v]) =>
      `<tr>
        <td style="padding:8px 12px;font-weight:bold;color:#082C6B;background:#f5f8ff;border:1px solid #dde4f0;white-space:nowrap">${k}</td>
        <td style="padding:8px 12px;border:1px solid #dde4f0">${v || '—'}</td>
      </tr>`
    )
    .join('');
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#082C6B;padding:24px 32px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;margin:0;font-size:20px">I Supply Chain</h1>
        <p style="color:#C9A84C;margin:4px 0 0;font-size:14px">${subject}</p>
      </div>
      <div style="background:#fff;padding:24px 32px;border:1px solid #dde4f0;border-top:none">
        <table style="width:100%;border-collapse:collapse">${rowsHtml}</table>
        <p style="color:#666;font-size:12px;margin-top:24px">
          Sent automatically from I Supply Chain website •
          ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Riyadh' })} AST
        </p>
      </div>
    </div>`;
}

async function sendToAll(
  subject: string,
  html: string
): Promise<{ sent: boolean; errors?: string[]; reason?: string }> {
  const transporter = createTransporter();

  if (!transporter) {
    const msg = 'GMAIL_APP_PASSWORD not configured — email NOT sent. Set this secret in Replit to fix.';
    logger.error({ subject }, `[notify] BLOCKED: ${msg}`);
    // Return a descriptive failure — callers surface this to the API response
    return { sent: false, reason: msg };
  }

  const results = await Promise.allSettled(
    NOTIFY_EMAILS.map(to =>
      transporter.sendMail({
        from: `"I Supply Chain" <${process.env.GMAIL_USER || 'haqash.maen@gmail.com'}>`,
        to,
        subject,
        html,
      })
    )
  );

  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map(r => r.reason?.message ?? String(r.reason));

  if (errors.length) {
    logger.error({ subject, errors }, '[notify] Some recipients failed');
  } else {
    logger.info({ subject, recipients: NOTIFY_EMAILS }, '[notify] Email sent successfully');
  }

  return { sent: true, errors: errors.length ? errors : undefined };
}

/* ── POST /api/notify/lead ── */
router.post('/lead', async (req, res) => {
  const { fullName, email, mobile, designation, company, source } = req.body;
  const subject = `🆕 New Lead: ${fullName} — ${company}`;
  const html = buildEmailHtml(subject, {
    'Full Name':   fullName,
    'Email':       email,
    'Mobile':      mobile,
    'Designation': designation,
    'Company':     company,
    'Source':      source || 'Website Registration',
    'Time':        new Date().toLocaleString('en-GB', { timeZone: 'Asia/Riyadh' }),
  });
  const result = await sendToAll(subject, html);
  res.status(result.sent || !result.reason ? 200 : 503).json({ ok: true, ...result });
});

/* ── POST /api/notify/booking ── */
router.post('/booking', async (req, res) => {
  const { fullName, email, mobile, designation, company, preferredDate, preferredTime, serviceType, description } = req.body;
  const subject = `📅 Booking Request: ${fullName} — ${preferredDate} ${preferredTime}`;
  const html = buildEmailHtml(subject, {
    'Full Name':       fullName,
    'Email':           email,
    'Mobile':          mobile,
    'Designation':     designation,
    'Company':         company,
    'Service':         serviceType || 'Consultation',
    'Preferred Date':  preferredDate,
    'Preferred Time':  preferredTime,
    'Notes':           description || '',
    'Time Received':   new Date().toLocaleString('en-GB', { timeZone: 'Asia/Riyadh' }),
  });
  const result = await sendToAll(subject, html);
  res.status(result.sent || !result.reason ? 200 : 503).json({ ok: true, ...result });
});

/* ── POST /api/notify/diagnostic ── */
router.post('/diagnostic', async (req, res) => {
  const { fullName, email, mobile, designation, company, scores, overallScore } = req.body;
  const subject = `📊 Diagnostic Completed: ${fullName} — Score ${overallScore}%`;
  const html = buildEmailHtml(subject, {
    'Full Name':     fullName,
    'Email':         email,
    'Mobile':        mobile,
    'Designation':   designation,
    'Company':       company,
    'Overall Score': `${overallScore}%`,
    'Segment Scores': scores ? JSON.stringify(scores) : '',
    'Time':          new Date().toLocaleString('en-GB', { timeZone: 'Asia/Riyadh' }),
  });
  const result = await sendToAll(subject, html);
  res.status(result.sent || !result.reason ? 200 : 503).json({ ok: true, ...result });
});

/* ── POST /api/notify/maturity ── */
router.post('/maturity', async (req, res) => {
  const { fullName, email, mobile, designation, company, overallLevel, scores } = req.body;
  const subject = `📈 Maturity Assessment: ${fullName} — Level ${overallLevel}`;
  const html = buildEmailHtml(subject, {
    'Full Name':             fullName,
    'Email':                 email,
    'Mobile':                mobile,
    'Designation':           designation,
    'Company':               company,
    'Overall Maturity Level': overallLevel,
    'Segment Scores':        scores ? JSON.stringify(scores) : '',
    'Time':                  new Date().toLocaleString('en-GB', { timeZone: 'Asia/Riyadh' }),
  });
  const result = await sendToAll(subject, html);
  res.status(result.sent || !result.reason ? 200 : 503).json({ ok: true, ...result });
});

// ── Exported helper: sendEscalationEmail ─────────────────────────────────────
// Called by the consultancy escalation endpoint.
export async function sendEscalationEmail(params: {
  subject:           string;
  clientName:        string;
  clientEmail:       string;
  clientMobile:      string;
  company:           string;
  title:             string;
  industry:          string;
  challenge:         string;
  satisfactionScore: number | null;
  diagnosisSummary:  string;
  solutionSummary:   string;
}): Promise<void> {
  const html = buildEmailHtml(params.subject, {
    'Client Name':          params.clientName,
    'Email':                params.clientEmail,
    'Mobile':               params.clientMobile,
    'Designation':          params.title,
    'Company':              params.company,
    'Industry':             params.industry,
    'Challenge':            params.challenge,
    'Satisfaction Score':   params.satisfactionScore !== null ? `${params.satisfactionScore}/5` : 'Not rated',
    'Diagnosis Summary':    params.diagnosisSummary  || '—',
    'Solution Summary':     params.solutionSummary   || '—',
    'Action Required':      'Client needs personalised follow-up. Review AI diagnosis and book consultation.',
    'Time':                 new Date().toLocaleString('en-GB', { timeZone: 'Asia/Riyadh' }),
  });
  const result = await sendToAll(params.subject, html);
  if (!result.sent && result.reason) {
    throw new Error(result.reason);
  }
}

export default router;
