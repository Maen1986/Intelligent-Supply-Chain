/**
 * POST /api/ai/plan
 *
 * Generates a structured AI action plan for a toolkit tool.
 * Accepts { prompt: string, language: 'en' | 'ar' } from authenticated users
 * (session cookie OR Bearer API key — uses requireApiKeyOrSession).
 *
 * Returns { ok: true, text: string, evidenceSummary?: {...} } on success.
 * #158 (23 Aug 2026): added structured evidenceSummary, same badge pattern
 * as the other five AI surfaces -- see lib/consultantPersona.ts and the
 * response-shape note below for how this stays a contained, 4-file change
 * (this route, useAIPlan.ts, AIPlan.tsx, AIPlanPanel.tsx) rather than a
 * 14+ file rewrite: every toolkit tool consumes the plan through the
 * shared hook/panel, none of them touch the response shape directly.
 * `text` keeps rendering as markdown exactly as before -- only the
 * transport shape (now one JSON object instead of raw completion text)
 * changed, so AIPlanContent's markdown-lite renderer needed no changes.
 * The prompt is built client-side; this route only wraps the OpenAI call.
 */
import { Router } from 'express';
import { OPENAI_MODEL, friendlyAIError } from '../lib/aiConfig';
import { requireApiKeyOrSession } from '../middlewares/requireApiKeyOrSession';
import { aiPlanRateLimiter } from '../lib/rateLimit';
import { dispatchEvent } from '../lib/webhookDispatch';
import { consultantPersona } from '../lib/consultantPersona';

const router = Router();

router.post('/ai/plan', requireApiKeyOrSession, aiPlanRateLimiter, async (req, res) => {
  const { prompt, language } = (req.body ?? {}) as { prompt?: unknown; language?: unknown };

  if (typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ ok: false, error: 'prompt is required' });
    return;
  }

  const lang = language === 'ar' ? 'ar' : 'en';

  const baseUrl = process.env['AI_INTEGRATIONS_OPENAI_BASE_URL'];
  const apiKey  = process.env['AI_INTEGRATIONS_OPENAI_API_KEY'];
  if (!baseUrl || !apiKey) {
    res.status(503).json({ ok: false, error: 'AI service is not configured on this server.' });
    return;
  }

  // #380 (23 Aug 2026): this system prompt is shared by every toolkit "Generate
  // AI Plan" tool (Risk, CLM, Procurement, Resiliency, Training, Lean/Agile,
  // Decision Lab, Kraljic Matrix, and more -- confirmed by grep, 14+ surfaces).
  // It previously carried none of the persona/evidence discipline the flagship
  // engines (diagnostic.ts, consultancy.ts, assessment.ts, reportGenerator.ts)
  // already have, despite this being the layer users touch most. Now reuses the
  // single shared persona source (lib/consultantPersona.ts) instead of pasting
  // a ninth copy of the text -- see that file's header for why. Markdown form,
  // not JSON, since every caller renders free-text markdown, not JSON --
  // changing the output shape would break 14+ components and was not requested.
  // #158: append a JSON-wrapper instruction on top of the shared persona --
  // the persona's own markdown-formatting rules (##, -, [HIGH]) still govern
  // the "plan" field's content, only the outer transport is now JSON so we
  // can carry evidenceSummary alongside it without inventing a second call.
  const jsonWrapperInstruction = lang === 'ar'
    ? '\n\nأعد الإجابة بصيغة JSON صالحة فقط (بدون أسوار كود) بالشكل التالي بالضبط: {"plan": "<نص الخطة الكامل بصيغة Markdown كما هو موصوف أعلاه>", "evidenceSummary": {"dataUsed": ["ما استند إليه هذا التحليل تحديدًا من بيانات المستخدم الفعلية"], "assumptions": ["أي افتراض اتُّخذ"], "confidence": "<0-100، ثقة صادقة، لا تفترض ثقة عالية من باب المجاملة>"}}'
    : '\n\nReturn ONLY valid JSON (no code fences) in exactly this shape: {"plan": "<the full plan text in markdown, formatted exactly as described above>", "evidenceSummary": {"dataUsed": ["what this analysis is specifically grounded in from the user\'s actual entered data"], "assumptions": ["any assumption made"], "confidence": "<0-100, honest confidence -- do not default high out of politeness>"}}';

  const systemPrompt = consultantPersona(lang) + jsonWrapperInstruction;

  try {
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: prompt },
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 2200,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`OpenAI API ${resp.status}: ${errText}`);
    }

    const data = await resp.json() as { choices: { message: { content: string } }[] };
    const raw = data.choices?.[0]?.message?.content ?? '';

    // Defensive parse: if the model ever returns non-JSON despite the
    // response_format constraint, fall back to treating the raw text as
    // the plan with no evidence badge, rather than breaking the whole
    // response for 14+ live surfaces over one malformed reply.
    let text = raw;
    let evidenceSummary: { dataUsed?: string[]; assumptions?: string[]; confidence?: number | string } | undefined;
    try {
      const parsed = JSON.parse(raw) as { plan?: string; evidenceSummary?: typeof evidenceSummary };
      if (typeof parsed.plan === 'string' && parsed.plan.trim()) {
        text = parsed.plan;
        evidenceSummary = parsed.evidenceSummary;
      }
    } catch {
      console.warn('[ai-plan] response was not valid JSON, falling back to raw text with no evidence badge');
    }

    // Fire event — userId comes from requireApiKeyOrSession → res.locals.userId
    const uid = res.locals.userId as number | undefined;
    if (uid) {
      dispatchEvent(uid, 'ai_plan.generated', {
        language:     lang,
        promptLength: (prompt as string).length,
        userEmail:    req.session.userEmail    ?? null,
        userName:     req.session.userFullName ?? null,
        userPhone:    req.session.userMobile   ?? null,
      });
    }

    res.json({ ok: true, text, evidenceSummary });
  } catch (err) {
    console.error('[ai-plan] generation failed', err);
    const { message, status } = friendlyAIError(err);
    res.status(status).json({ ok: false, error: message });
  }
});

export default router;
