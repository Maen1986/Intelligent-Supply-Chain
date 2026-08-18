/**
 * Shared email helpers used by the scheduler and kpiAlerts.
 *
 * These are thin wrappers around the Resend HTTP API — a sibling
 * implementation to notify.ts's own transporter (kept separate to avoid
 * circular imports and keep notify.ts as a pure Express Router module).
 */

import { logger } from "./logger";

const NOTIFY_EMAILS = [
  "haqash.maen@gmail.com",
  "maen.haqash@yahoo.com",
];

const FROM_EMAIL = process.env["RESEND_FROM_EMAIL"] || "I Supply Chain <notifications@iscsupplychain.com>";

function createTransporter() {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) return null;
  return {
    async sendMail({ from, to, subject, html }: { from: string; to: string; subject: string; html: string }) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, subject, html }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Resend API error ${res.status}: ${body}`);
      }
      return res.json();
    },
  };
}

export function buildAlertHtml(subject: string, rows: Record<string, string>): string {
  const rowsHtml = Object.entries(rows)
    .map(
      ([k, v]) =>
        `<tr>
          <td style="padding:8px 12px;font-weight:bold;color:#082C6B;background:#f5f8ff;border:1px solid #dde4f0;white-space:nowrap">${k}</td>
          <td style="padding:8px 12px;border:1px solid #dde4f0">${v || "—"}</td>
        </tr>`,
    )
    .join("");
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#082C6B;padding:24px 32px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;margin:0;font-size:20px">I Supply Chain</h1>
        <p style="color:#C9A84C;margin:4px 0 0;font-size:14px">${subject}</p>
      </div>
      <div style="background:#fff;padding:24px 32px;border:1px solid #dde4f0;border-top:none">
        <table style="width:100%;border-collapse:collapse">${rowsHtml}</table>
        <p style="color:#666;font-size:12px;margin-top:24px">
          Sent automatically from I Supply Chain •
          ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Riyadh" })} AST
        </p>
      </div>
    </div>`;
}

/**
 * Send an alert/digest email to the admin recipients.
 * Fire-and-forget safe — never throws, returns sent status.
 */
export async function sendAlertEmail(
  subject: string,
  rows: Record<string, string>,
): Promise<{ sent: boolean; reason?: string }> {
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn({ subject }, "[notifyHelpers] RESEND_API_KEY not set — alert email skipped");
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  const html = buildAlertHtml(subject, rows);
  const from = FROM_EMAIL;

  const results = await Promise.allSettled(
    NOTIFY_EMAILS.map(to =>
      transporter.sendMail({ from, to, subject, html }).catch(async err => {
        logger.warn({ subject, to, err }, "[notifyHelpers] Send failed — retrying once in 2s");
        await new Promise(r => setTimeout(r, 2000));
        return transporter.sendMail({ from, to, subject, html });
      }),
    ),
  );

  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map(r => String(r.reason?.message ?? r.reason));

  const sent = errors.length < NOTIFY_EMAILS.length;
  if (!sent) {
    logger.error({ subject, errors }, "[notifyHelpers] All recipients failed");
  } else {
    logger.info({ subject, recipients: NOTIFY_EMAILS.length }, "[notifyHelpers] Alert email sent");
  }

  return { sent, reason: sent ? undefined : errors.join("; ") };
}

/**
 * Send a digest/report email to a SINGLE specific address (for per-user digests).
 */
export async function sendDigestEmail(params: {
  to:      string;
  subject: string;
  rows:    Record<string, string>;
}): Promise<{ sent: boolean; reason?: string }> {
  const transporter = createTransporter();
  if (!transporter) {
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  const html = buildAlertHtml(params.subject, params.rows);
  const from = FROM_EMAIL;

  try {
    await transporter.sendMail({ from, to: params.to, subject: params.subject, html });
    logger.info({ to: params.to, subject: params.subject }, "[notifyHelpers] Digest email sent");
    return { sent: true };
  } catch (err) {
    logger.warn({ to: params.to, err }, "[notifyHelpers] Digest send failed — retrying once");
    await new Promise(r => setTimeout(r, 2000));
    try {
      await transporter.sendMail({ from, to: params.to, subject: params.subject, html });
      return { sent: true };
    } catch (err2) {
      const reason = (err2 as Error)?.message ?? String(err2);
      logger.error({ to: params.to, reason }, "[notifyHelpers] Digest email failed after retry");
      return { sent: false, reason };
    }
  }
}
