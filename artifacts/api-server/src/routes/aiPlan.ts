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

  const systemPrompt = lang === 'ar'
    ? 'أنت مستشار خبير في سلسلة الإمداد والمشتريات يعمل مع شركات خليجية. قدّم توصياتك باللغة العربية بشكل منظّم مع عناوين واضحة (##) ونقاط (-) وأولويات [عالية]/[متوسطة]/[منخفضة] حيثما يلزم. كن محدّداً وقابلاً للتطبيق — استند إلى الأرقام الفعلية المُدخَلة.'
    : 'You are a senior supply chain and procurement consultant working with GCC organisations. Respond in clear, structured English. Use ## headings for sections, - bullet points for actions, and [HIGH]/[MEDIUM]/[LOW] priority labels where appropriate. Be specific and actionable — reference the actual numbers provided in the user message.';

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
