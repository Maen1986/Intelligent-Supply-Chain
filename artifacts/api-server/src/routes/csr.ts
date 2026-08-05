/**
 * POST /api/csr-report
 *
 * Free CSR tool: an AI-generated SME supply chain action plan, grounded in
 * the client's actual typed challenge and industry. This is a pro-bono
 * lead-gen tool, but it must still produce a genuinely personalised report —
 * the whole point of the CSR program is real, useful help for a small
 * business, not filler.
 *
 * Rate-limited via the shared leads limiter (same throttle as /diagnostic).
 */

import { Router }            from 'express';
import { openai }            from '@workspace/integrations-openai-ai-server';
import { OPENAI_MODEL, friendlyAIError } from '../lib/aiConfig';
import { leadsRateLimiter }  from '../lib/rateLimit';

const router = Router();

interface CsrInput {
  industry:  string;
  challenge: string;
  language?: 'en' | 'ar';
}

async function generateCsrReportViaAI(input: CsrInput): Promise<Record<string, unknown>> {
  const lang = input.language === 'ar' ? 'Arabic' : 'English';

  const systemPrompt = `You are Ma'in Alhaqash, MCIPS · CPSM · MSc · MIPP, founder of I Supply Chain — a GCC supply chain and procurement consultancy. This tool is a free, pro-bono CSR service for small businesses and startups who cannot afford a full consulting engagement. You produce short, genuinely useful, practical supply chain action plans grounded in real procurement and supply chain best practice (CIPS, APICS), scaled to the realities of a small business — no dedicated procurement team, limited budget, informal processes. You never give generic advice that ignores what the client actually told you: every recommendation must trace directly back to their stated challenge, not just their industry category.

LANGUAGE INSTRUCTION: Generate ALL text values in ${lang}.`;

  const userPrompt = `An SME/startup has requested a free CSR supply chain action plan.

INDUSTRY: ${input.industry}
THEIR STATED CHALLENGE (the most important input — every section below must directly engage with this, not just the industry label):
"${input.challenge.trim()}"

Produce a short, practical, personalised SME-scale action plan grounded in the ${input.industry} sector and their specific stated challenge. Recommendations must be realistic for a small business with limited resources.

Return ONLY valid JSON (no markdown, no code fences) matching this EXACT structure:
{
  "summary": "2-3 sentences directly addressing their stated challenge and industry context — must reference specifics from what they wrote, not generic industry text",
  "gaps": ["Gap 1 — specific to their stated challenge", "Gap 2", "Gap 3"],
  "risks": ["Contract/commercial risk 1 relevant to their situation", "Risk 2"],
  "roadmap": ["Month 1: specific first action addressing their challenge", "Month 2: specific action", "Month 3: specific action"]
}

Rules:
- gaps: exactly 3 items
- risks: exactly 2 items
- roadmap: exactly 3 items, each starting with "Month N:"
- Every item must clearly follow from their stated challenge — do not produce generic SME advice that could apply to any business regardless of what they typed`;

  const response = await openai.chat.completions.create({
    model:           OPENAI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    max_completion_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No content returned from AI');
  return JSON.parse(content) as Record<string, unknown>;
}

/* POST /api/csr-report — public, rate-limited */
router.post('/csr-report', leadsRateLimiter, async (req, res) => {
  const { industry, challenge, language } = req.body as CsrInput;

  if (!industry || !challenge || !challenge.trim()) {
    return res.status(400).json({ error: 'Missing required fields: industry, challenge' });
  }

  try {
    const aiReport = await generateCsrReportViaAI({ industry, challenge, language });
    return res.json({
      success: true,
      report: {
        industry,
        ...aiReport,
      },
    });
  } catch (err) {
    console.error('[csr-report] AI generation failed', err);
    const { message, status } = friendlyAIError(err);
    return res.status(status).json({ error: message });
  }
});

export default router;
