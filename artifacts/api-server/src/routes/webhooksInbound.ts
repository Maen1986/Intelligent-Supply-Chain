/**
 * POST /api/webhooks/inbound
 *
 * Two-way automation bridge: n8n (or any platform) can call back into ISC
 * to trigger actions without the client touching the UI.
 *
 * Security: every request must carry three headers:
 *   X-ISC-Timestamp  — Unix epoch seconds (integer string); must be within ±5 min of server time
 *   X-ISC-Nonce      — unique random string per request (max 256 chars); prevents replays
 *   X-ISC-Signature  — HMAC-SHA256("<timestamp>\n<nonce>\n<rawBody>", INBOUND_WEBHOOK_SECRET) hex-encoded
 *
 * If INBOUND_WEBHOOK_SECRET is not configured the endpoint returns 503.
 *
 * Supported actions (pass in body.action + body.payload):
 *   send_email          — send a transactional email via nodemailer
 *   generate_plan       — generate an AI plan and optionally save it
 *   patch_tool_data     — overwrite keys in a user's tool_data
 *   create_notification — write an in-app notification for a user
 */
import { Router }                      from "express";
import { createHmac, timingSafeEqual } from "crypto";
import nodemailer                       from "nodemailer";
import { sql }                          from "drizzle-orm";
import { db, notificationsTable, inboundWebhookLogTable } from "@workspace/db";
import { patchToolData }                from "../lib/toolData";
import { OPENAI_MODEL, friendlyAIError } from "../lib/aiConfig";
import { logger }                       from "../lib/logger";

const router = Router();

/* ── Replay-protection nonce store ───────────────────────────────────────── */
// Nonces are kept for twice the clock-skew window so a request at the edge of
// the window can never be replayed after it ages out of the freshness check.

const CLOCK_SKEW_MS  = 5 * 60 * 1000; // 5 minutes
const NONCE_TTL_MS   = CLOCK_SKEW_MS * 2;

// Map<nonce, expiresAtMs>
const usedNonces = new Map<string, number>();

function evictExpiredNonces(nowMs: number) {
  for (const [nonce, expiresAt] of usedNonces) {
    if (nowMs >= expiresAt) usedNonces.delete(nonce);
  }
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

/**
 * Verify the HMAC-SHA256 signature over "<timestamp>\n<nonce>\n<rawBody>".
 * Uses a timing-safe comparison to prevent timing attacks.
 */
function verifySignature(
  rawBody:   Buffer,
  timestamp: string,
  nonce:     string,
  header:    string | undefined,
  secret:    string,
): boolean {
  if (!header) return false;
  const material   = Buffer.concat([
    Buffer.from(`${timestamp}\n${nonce}\n`, "utf8"),
    rawBody,
  ]);
  const expected    = createHmac("sha256", secret).update(material).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const headerBuf   = Buffer.from(header,   "utf8");
  if (expectedBuf.length !== headerBuf.length) return false;
  return timingSafeEqual(expectedBuf, headerBuf);
}

function logInbound(action: string, bodySnippet: string, status: "ok" | "error", error?: string) {
  // id is a text primary key (production table has text column from original schema)
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  db.insert(inboundWebhookLogTable)
    .values({ id, action, bodySnippet: bodySnippet.slice(0, 300), status, error: error ?? null })
    .catch(err => logger.error({ err }, "[webhooks/inbound] Log insert failed"));
}

/* ── Route ───────────────────────────────────────────────────────────────── */

router.post("/webhooks/inbound", async (req, res) => {
  const secret = process.env.INBOUND_WEBHOOK_SECRET;
  if (!secret) {
    res.status(503).json({ ok: false, error: "Inbound webhooks are not configured on this server." });
    return;
  }

  // rawBody is stamped by the verify callback in app.ts express.json() setup
  const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;
  if (!rawBody) {
    res.status(400).json({ ok: false, error: "Could not read request body" });
    return;
  }

  // ── Timestamp freshness check ────────────────────────────────────────────
  const timestampHeader = req.headers["x-isc-timestamp"] as string | undefined;
  if (!timestampHeader || !/^\d+$/.test(timestampHeader)) {
    res.status(401).json({ ok: false, error: "Missing or invalid X-ISC-Timestamp header" });
    return;
  }
  const nowMs        = Date.now();
  const requestMs    = parseInt(timestampHeader, 10) * 1000;
  if (Math.abs(nowMs - requestMs) > CLOCK_SKEW_MS) {
    logger.warn({ requestMs, nowMs }, "[webhooks/inbound] Stale timestamp rejected");
    logInbound("unknown", rawBody.slice(0, 200).toString(), "error", "Stale timestamp");
    res.status(401).json({ ok: false, error: "Request timestamp is too old or too far in the future" });
    return;
  }

  // ── Nonce uniqueness check ───────────────────────────────────────────────
  const nonce = req.headers["x-isc-nonce"] as string | undefined;
  if (!nonce || nonce.length > 256) {
    res.status(401).json({ ok: false, error: "Missing or invalid X-ISC-Nonce header" });
    return;
  }
  evictExpiredNonces(nowMs);
  if (usedNonces.has(nonce)) {
    logger.warn({ nonce }, "[webhooks/inbound] Replayed nonce rejected");
    logInbound("unknown", rawBody.slice(0, 200).toString(), "error", "Replayed nonce");
    res.status(401).json({ ok: false, error: "Replayed request rejected" });
    return;
  }

  // ── Signature check ──────────────────────────────────────────────────────
  // Verify signature BEFORE registering the nonce so that unauthenticated
  // callers with unique nonces cannot grow the nonce map unboundedly (DoS).
  const sig = req.headers["x-isc-signature"] as string | undefined;
  if (!verifySignature(rawBody, timestampHeader, nonce, sig, secret)) {
    logger.warn("[webhooks/inbound] Invalid signature rejected");
    logInbound("unknown", rawBody.slice(0, 200).toString(), "error", "Invalid signature");
    res.status(401).json({ ok: false, error: "Invalid signature" });
    return;
  }

  // Register the nonce only after the request is authenticated so concurrent
  // duplicate requests from verified callers are also blocked.
  // (The map is in-process; sufficient for single-instance deploys.)
  usedNonces.set(nonce, nowMs + NONCE_TTL_MS);

  const body        = req.body as Record<string, unknown>;
  const action      = typeof body.action === "string" ? body.action : "";
  const payload     = (body.payload ?? {}) as Record<string, unknown>;
  const bodySnippet = rawBody.slice(0, 300).toString();

  try {
    let result: unknown;

    switch (action) {

      /* ── send_email ──────────────────────────────────────────────────── */
      case "send_email": {
        const { to, subject, html, text } = payload as {
          to?: string; subject?: string; html?: string; text?: string;
        };
        if (!to || !subject) {
          res.status(400).json({ ok: false, error: "send_email requires payload.to and payload.subject" });
          return;
        }
        const pass = process.env.GMAIL_APP_PASSWORD;
        const user = process.env.GMAIL_USER ?? "haqash.maen@gmail.com";
        if (!pass) {
          res.status(503).json({ ok: false, error: "Email is not configured on this server." });
          return;
        }
        const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
        await transporter.sendMail({
          from:    `"I Supply Chain" <${user}>`,
          to,
          subject,
          html:    html ?? `<p>${text ?? ""}</p>`,
          text:    text ?? "",
        });
        result = { sent: true, to };
        logger.info({ to, subject }, "[webhooks/inbound] send_email delivered");
        break;
      }

      /* ── generate_plan ───────────────────────────────────────────────── */
      case "generate_plan": {
        const { prompt, language, userId, toolKey } = payload as {
          prompt?: string; language?: string; userId?: number; toolKey?: string;
        };
        if (!prompt) {
          res.status(400).json({ ok: false, error: "generate_plan requires payload.prompt" });
          return;
        }
        const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
        const apiKey  = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
        if (!baseUrl || !apiKey) {
          res.status(503).json({ ok: false, error: "AI service is not configured." });
          return;
        }
        const lang = language === "ar" ? "ar" : "en";
        const systemPrompt = lang === "ar"
          ? "أنت مستشار خبير في سلسلة الإمداد والمشتريات. قدّم توصياتك باللغة العربية بشكل منظّم مع عناوين واضحة ونقاط وأولويات [عالية]/[متوسطة]/[منخفضة]."
          : "You are a senior supply chain and procurement consultant. Respond in clear, structured English. Use ## headings, bullet points, and [HIGH]/[MEDIUM]/[LOW] priority labels.";
        const resp = await fetch(`${baseUrl}/chat/completions`, {
          method:  "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body:    JSON.stringify({
            model:    OPENAI_MODEL,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user",   content: prompt },
            ],
            max_completion_tokens: 2000,
          }),
        });
        if (!resp.ok) throw new Error(`OpenAI ${resp.status}: ${await resp.text()}`);
        const data = await resp.json() as { choices: { message: { content: string } }[] };
        const text = data.choices?.[0]?.message?.content ?? "";

        // Optionally save the plan if userId + toolKey are provided
        const keyValid = toolKey && /^[a-z][a-z0-9-]{0,63}$/.test(toolKey);
        if (userId && keyValid) {
          // Merge into generatedPlans — read current plans first to avoid overwriting others
          const existing = await db.execute(sql`SELECT tool_data FROM users WHERE id = ${userId}`);
          const toolData = (existing.rows?.[0] as { tool_data: Record<string, unknown> | null } | undefined)?.tool_data ?? {};
          const plans    = (toolData.generatedPlans ?? {}) as Record<string, unknown>;
          plans[toolKey] = { text, savedAt: new Date().toISOString() };
          await patchToolData(userId, { generatedPlans: plans });
        }
        result = { text, toolKey: toolKey ?? null, saved: !!(userId && keyValid) };
        logger.info({ toolKey, userId, lang }, "[webhooks/inbound] generate_plan complete");
        break;
      }

      /* ── patch_tool_data ─────────────────────────────────────────────── */
      case "patch_tool_data": {
        const { userId, patch } = payload as { userId?: number; patch?: Record<string, unknown> };
        if (!userId || !patch || typeof patch !== "object" || Array.isArray(patch)) {
          res.status(400).json({ ok: false, error: "patch_tool_data requires payload.userId (number) and payload.patch (object)" });
          return;
        }
        await patchToolData(userId, patch);
        result = { patched: Object.keys(patch) };
        logger.info({ userId, keys: Object.keys(patch) }, "[webhooks/inbound] patch_tool_data applied");
        break;
      }

      /* ── create_notification ─────────────────────────────────────────── */
      case "create_notification": {
        const { userId, title, body: bodyText } = payload as { userId?: number; title?: string; body?: string };
        if (!userId || !title || !bodyText) {
          res.status(400).json({ ok: false, error: "create_notification requires payload.userId, payload.title, and payload.body" });
          return;
        }
        const [row] = await db
          .insert(notificationsTable)
          .values({ userId, title, body: bodyText })
          .returning({ id: notificationsTable.id });
        result = { notificationId: row.id };
        logger.info({ userId, title }, "[webhooks/inbound] notification created");
        break;
      }

      default:
        res.status(400).json({
          ok:    false,
          error: `Unknown action: "${action}". Supported: send_email, generate_plan, patch_tool_data, create_notification`,
        });
        return;
    }

    logInbound(action, bodySnippet, "ok");
    res.json({ ok: true, action, result });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error({ err, action }, "[webhooks/inbound] Action failed");
    logInbound(action, bodySnippet, "error", errMsg.slice(0, 500));
    const { message, status } = friendlyAIError(err);
    res.status(status >= 500 ? 502 : status).json({ ok: false, error: message });
  }
});

export default router;
