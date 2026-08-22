/**
 * POST /api/ai/plan
 *
 * Generates a structured AI action plan for a toolkit tool.
 * Accepts { prompt: string, language: 'en' | 'ar' } from authenticated users
 * (session cookie OR Bearer API key — uses requireApiKeyOrSession).
 *
 * Returns { ok: true, text: string } on success.
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
  const systemPrompt = consultantPersona(lang);

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
        max_completion_tokens: 2000,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`OpenAI API ${resp.status}: ${errText}`);
    }

    const data = await resp.json() as { choices: { message: { content: string } }[] };
    const text = data.choices?.[0]?.message?.content ?? '';

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

    res.json({ ok: true, text });
  } catch (err) {
    console.error('[ai-plan] generation failed', err);
    const { message, status } = friendlyAIError(err);
    res.status(status).json({ ok: false, error: message });
  }
});

export default router;
