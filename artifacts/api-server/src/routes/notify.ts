import { Router } from 'express';
import { logger } from '../lib/logger';

const router = Router();

const NOTIFY_EMAILS = [
  'haqash.maen@gmail.com',
  'maen.haqash@yahoo.com',
];

// ── Startup config check (called once when server starts) ────────────────────
export function checkEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.error(
      '╔══════════════════════════════════════════════════════════════╗\n' +
      '║  EMAIL NOTIFICATIONS ARE DISABLED                           ║\n' +
      '║  RESEND_API_KEY secret is not set.                          ║\n' +
      '║  Every lead, booking, diagnostic and maturity alert         ║\n' +
      '║  will be SILENTLY LOST until this is configured.            ║\n' +
      '║  → Go to Render → isc-backend → Environment and add         ║\n' +
      '║    RESEND_API_KEY                                           ║\n' +
      '╚══════════════════════════════════════════════════════════════╝'
    );
  } else {
    logger.info(`[notify] Email configured (Resend) — will send from ${FROM_EMAIL} to ${NOTIFY_EMAILS.join(', ')}`);
  }
}

// Delay before the single retry attempt (overridable in tests)
export const EMAIL_RETRY_DELAY_MS = Number(process.env.EMAIL_RETRY_DELAY_MS ?? 2000);

// Verified-domain sender for Resend (iscsupplychain.com must be verified in the
// Resend dashboard for this to send — see RESEND_API_KEY setup).
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'I Supply Chain <notifications@iscsupplychain.com>';

type SendMailArgs = {
  from: string;
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
};

// Thin wrapper over the Resend HTTP API that exposes the same sendMail(...)
// shape the rest of this file already calls, so no call site below needed to
// change when we swapped providers from Gmail SMTP to Resend.
function createTransporter() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return {
    async sendMail({ from, to, subject, html, attachments }: SendMailArgs) {
      const payload: Record<string, unknown> = { from, to, subject, html };
      if (attachments?.length) {
        payload.attachments = attachments.map(a => ({
          filename: a.filename,
          content: a.content.toString('base64'),
          content_type: a.contentType,
        }));
      }
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Resend API error ${res.status}: ${body}`);
      }
      return res.json();
    },
  };
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

type EmailAttachment = { filename: string; content: Buffer; contentType?: string };

async function sendToAll(
  subject: string,
  html: string,
  attachments?: EmailAttachment[]
): Promise<{ sent: boolean; errors?: string[]; reason?: string }> {
  const transporter = createTransporter();

  if (!transporter) {
    const msg = 'RESEND_API_KEY not configured — email NOT sent. Set this in Render env vars to fix.';
    logger.error({ subject }, `[notify] BLOCKED: ${msg}`);
    // Return a descriptive failure — callers surface this to the API response
    return { sent: false, reason: msg };
  }

  const from = FROM_EMAIL;

  // Send to each recipient with one retry on failure (covers transient Gmail
  // rate limits / outages). A recipient counts as failed only if both the
  // initial attempt AND the retry fail.
  const sendWithRetry = async (to: string): Promise<void> => {
    try {
      await transporter.sendMail({ from, to, subject, html, attachments });
    } catch (firstErr) {
      logger.warn(
        { subject, to, err: (firstErr as Error)?.message },
        '[notify] Send failed — retrying once in 2s'
      );
      await new Promise(r => setTimeout(r, EMAIL_RETRY_DELAY_MS));
      await transporter.sendMail({ from, to, subject, html, attachments });
      logger.info({ subject, to }, '[notify] Retry succeeded');
    }
  };

  const results = await Promise.allSettled(NOTIFY_EMAILS.map(sendWithRetry));

  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map(r => r.reason?.message ?? String(r.reason));

  // sent=true only if at least one recipient actually received the email
  const sent = errors.length < NOTIFY_EMAILS.length;

  if (!sent) {
    logger.error({ subject, errors }, '[notify] ALL recipients failed (after retry) — email NOT delivered');
  } else if (errors.length) {
    logger.error({ subject, errors }, '[notify] Some recipients failed (after retry)');
  } else {
    logger.info({ subject, recipients: NOTIFY_EMAILS }, '[notify] Email sent successfully');
  }

  return {
    sent,
    errors: errors.length ? errors : undefined,
    reason: sent ? undefined : `All recipients failed after retry: ${errors.join('; ')}`,
  };
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

// ── Exported helper: sendPasswordResetEmail ──────────────────────────────────
// Unlike the lead notifications above (which go to the consultant), this one
// goes to the account owner's own email address with a one-time reset code.
export async function sendPasswordResetEmail(params: {
  to:       string;
  fullName: string;
  code:     string;
  lang?:    'en' | 'ar';
}): Promise<{ sent: boolean; reason?: string }> {
  const transporter = createTransporter();
  if (!transporter) {
    const msg = 'RESEND_API_KEY not configured — password reset email NOT sent.';
    logger.error({ to: params.to }, `[notify] BLOCKED: ${msg}`);
    return { sent: false, reason: msg };
  }
  const ar = params.lang === 'ar';
  const subject = ar ? 'رمز إعادة تعيين كلمة المرور — I Supply Chain' : 'Your password reset code — I Supply Chain';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"${ar ? ' dir="rtl"' : ''}>
      <div style="background:#082C6B;padding:24px 32px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;margin:0;font-size:20px">I Supply Chain</h1>
        <p style="color:#C9A84C;margin:4px 0 0;font-size:14px">${ar ? 'إعادة تعيين كلمة المرور' : 'Password Reset'}</p>
      </div>
      <div style="background:#fff;padding:24px 32px;border:1px solid #dde4f0;border-top:none">
        <p style="color:#333">${ar ? `مرحباً ${params.fullName}،` : `Hello ${params.fullName},`}</p>
        <p style="color:#333">${ar
          ? 'استخدم الرمز التالي لإعادة تعيين كلمة المرور الخاصة بك. الرمز صالح لمدة 15 دقيقة.'
          : 'Use the code below to reset your password. It is valid for 15 minutes.'}</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#082C6B;text-align:center;background:#f5f8ff;border:1px solid #dde4f0;border-radius:8px;padding:16px 0">${params.code}</p>
        <p style="color:#666;font-size:13px">${ar
          ? 'إذا لم تطلب إعادة التعيين، يمكنك تجاهل هذه الرسالة بأمان.'
          : "If you didn't request a reset, you can safely ignore this email."}</p>
      </div>
    </div>`;
  const from = FROM_EMAIL;
  try {
    await transporter.sendMail({ from, to: params.to, subject, html });
    logger.info({ to: params.to }, '[notify] Password reset email sent');
    return { sent: true };
  } catch (firstErr) {
    logger.warn({ to: params.to, err: (firstErr as Error)?.message }, '[notify] Reset email failed — retrying once');
    await new Promise(r => setTimeout(r, EMAIL_RETRY_DELAY_MS));
    try {
      await transporter.sendMail({ from, to: params.to, subject, html });
      logger.info({ to: params.to }, '[notify] Password reset email sent on retry');
      return { sent: true };
    } catch (err) {
      const reason = (err as Error)?.message ?? String(err);
      logger.error({ to: params.to, reason }, '[notify] Password reset email failed after retry');
      return { sent: false, reason };
    }
  }
}

// ── Exported helper: sendBriefingEmail ───────────────────────────────────────
// Called by the submissions route when a Command Centre briefing lands with a
// client-rendered PDF. Sends the lead summary with the branded PDF attached.
export async function sendBriefingEmail(params: {
  contactName:  string | null;
  contactEmail: string | null;
  company:      string | null;
  industry:     string;
  revenueBand:  string;
  language:     'en' | 'ar';
  maturityScore: string;
  maturityLevel: string;
  // When PDF capture fails client-side, these are absent — the lead summary
  // email is still sent, just without an attachment.
  pdfBuffer?:   Buffer;
  pdfFilename?: string;
}): Promise<{ sent: boolean; errors?: string[]; reason?: string }> {
  const hasPdf = !!params.pdfBuffer;
  const subject = `📋 Executive Briefing Generated${params.contactName ? `: ${params.contactName}` : ''} — ${params.industry} (${params.language === 'ar' ? 'Arabic' : 'English'})`;
  const html = buildEmailHtml(subject, {
    'Contact Name':   params.contactName ?? 'Anonymous visitor',
    'Contact Email':  params.contactEmail ?? '—',
    'Company':        params.company ?? '—',
    'Industry':       params.industry,
    'Revenue Band':   params.revenueBand,
    'Language':       params.language === 'ar' ? 'Arabic (العربية)' : 'English',
    'Maturity':       `${params.maturityLevel} (${params.maturityScore}/100)`,
    'Attachment':     hasPdf
      ? 'Full branded PDF briefing attached'
      : '⚠️ PDF capture failed on the client — no attachment. Lead details above are complete.',
    'Time':           new Date().toLocaleString('en-GB', { timeZone: 'Asia/Riyadh' }),
  });
  return sendToAll(
    subject,
    html,
    hasPdf
      ? [{ filename: params.pdfFilename || 'ISC-Executive-Briefing.pdf', content: params.pdfBuffer!, contentType: 'application/pdf' }]
      : undefined
  );
}

// ── Exported helper: sendGuestResultsEmail ───────────────────────────────────
// Sends the guest their assessment results link so they can return to it later.
export async function sendGuestResultsEmail(params: {
  email:          string;
  token:          string;
  lang?:          string;
  overallScore?:  number;
  overallLevel?:  string;
  expiresInDays:  number;
}): Promise<{ sent: boolean; reason?: string }> {
  const transporter = createTransporter();
  if (!transporter) {
    const msg = 'RESEND_API_KEY not configured — guest results email NOT sent.';
    logger.error({ to: params.email }, `[notify] BLOCKED: ${msg}`);
    return { sent: false, reason: msg };
  }

  const ar = params.lang === 'ar';
  const appDomain = process.env.APP_URL || 'https://iscsupplychain.com';
  const resultsUrl = `${appDomain}/maturity?token=${params.token}`;

  const subject = ar
    ? 'نتائج تقييمكم — I Supply Chain'
    : 'Your Maturity Assessment Results — I Supply Chain';

  const scoreBlock = (params.overallScore !== undefined && params.overallLevel)
    ? (ar
        ? `<p style="font-size:28px;font-weight:bold;color:#082C6B;text-align:center;background:#f5f8ff;border:1px solid #dde4f0;border-radius:8px;padding:12px 0">
             ${params.overallScore.toFixed(1)}/5.0 · ${params.overallLevel}
           </p>`
        : `<p style="font-size:28px;font-weight:bold;color:#082C6B;text-align:center;background:#f5f8ff;border:1px solid #dde4f0;border-radius:8px;padding:12px 0">
             ${params.overallScore.toFixed(1)}/5.0 · ${params.overallLevel}
           </p>`)
    : '';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"${ar ? ' dir="rtl"' : ''}>
      <div style="background:#082C6B;padding:24px 32px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;margin:0;font-size:20px">I Supply Chain</h1>
        <p style="color:#C9A84C;margin:4px 0 0;font-size:14px">
          ${ar ? 'تقييم نضج سلسلة الإمداد والمشتريات' : 'Supply Chain & Procurement Maturity Assessment'}
        </p>
      </div>
      <div style="background:#fff;padding:24px 32px;border:1px solid #dde4f0;border-top:none">
        <p style="color:#333">
          ${ar
            ? 'لقد أكملتم تقييم نضج سلسلة الإمداد والمشتريات. استخدموا الرابط أدناه للعودة إلى نتائجكم في أي وقت.'
            : 'You\'ve completed the Supply Chain & Procurement Maturity Assessment. Use the link below to return to your results at any time.'}
        </p>
        ${scoreBlock}
        <div style="text-align:center;margin:24px 0">
          <a href="${resultsUrl}"
             style="display:inline-block;background:#C9A84C;color:#fff;font-weight:bold;font-size:16px;padding:14px 32px;border-radius:8px;text-decoration:none">
            ${ar ? 'عرض نتائجكم' : 'View My Results'}
          </a>
        </div>
        <p style="color:#666;font-size:12px;border-top:1px solid #eee;padding-top:12px;margin-top:12px">
          ${ar
            ? `هذا الرابط صالح لمدة ${params.expiresInDays} يومًا. لحفظ نتائجكم بشكل دائم، يُنصح بإنشاء حساب مجاني.`
            : `This link is valid for ${params.expiresInDays} days. To permanently save your results, consider creating a free account.`}
        </p>
        <p style="color:#aaa;font-size:11px">
          ${ar ? 'إذا لم تطلبوا هذا الرابط، يمكنكم تجاهل هذه الرسالة.' : "If you didn't request this link, you can safely ignore this email."}
        </p>
      </div>
    </div>`;

  const from = FROM_EMAIL;
  try {
    await transporter.sendMail({ from, to: params.email, subject, html });
    logger.info({ to: params.email }, '[notify] Guest results email sent');
    return { sent: true };
  } catch (firstErr) {
    logger.warn({ to: params.email, err: (firstErr as Error)?.message }, '[notify] Guest results email failed — retrying once');
    await new Promise(r => setTimeout(r, EMAIL_RETRY_DELAY_MS));
    try {
      await transporter.sendMail({ from, to: params.email, subject, html });
      logger.info({ to: params.email }, '[notify] Guest results email sent on retry');
      return { sent: true };
    } catch (err) {
      const reason = (err as Error)?.message ?? String(err);
      logger.error({ to: params.email, reason }, '[notify] Guest results email failed after retry');
      return { sent: false, reason };
    }
  }
}

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
