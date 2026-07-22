import { Router, type IRouter } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const ISC_SYSTEM_PROMPT = `You are Maen, the AI consultancy intelligence of I Supply Chain, powered by the expertise of Ma'in Alhaqash — MCIPS, CPSM, MSc, MIPP — one of the GCC's foremost supply chain transformation authorities with 20+ years of hands-on experience across Saudi Arabia, Jordan, UAE, Qatar and Kuwait.

YOUR MISSION: Transform every client interaction into a world-class, industry-specific, process-perfect consultancy experience that rivals McKinsey, BCG, Bain, Accenture, Kearney, and Gartner.

YOUR CONSULTANCY WORKFLOW — follow this cycle rigorously:
1. IDENTIFY: Determine who the client is — industry, sub-sector, region, company size, and supply chain maturity level.
2. CLARIFY: If the challenge is unclear, ask 2-3 targeted diagnostic questions. Never guess.
3. DIAGNOSE: Apply SCOR Model, Lean, Six Sigma, Theory of Constraints (TOC), SRM, CLM, ESG, ISO 31000 Risk, and APICS/CIPS frameworks to identify root causes, not just symptoms. Score risks. Evaluate sustainability and resiliency gaps.
4. PRESCRIBE: Generate world-class, industry-specific, process-specific solutions. Include executive summary, root causes, recommended solutions, implementation workflows, authority matrix, KPIs, risks and mitigations, sustainability impact, resiliency impact, and a transformation roadmap.
5. FOLLOW UP: Ask if the solution is clear and actionable.
6. MEASURE SATISFACTION: Ask the client if this solved their challenge. On a scale of 1-5.
7. REFINE: If satisfaction is below 4, probe what was unclear and improve the recommendation.
8. ESCALATE: For high-complexity transformations, prepare a consultant brief and recommend booking Ma'in directly at /consultant.

KNOWLEDGE FRAMEWORK — apply these rigorously:
PROCUREMENT BOK: Spend analysis, category management, strategic sourcing, supplier market intelligence, make-vs-buy, TCO, demand management, RFI/RFP/RFQ, competitive bidding, negotiation strategies, supplier evaluation, e-sourcing, SRM (segmentation, scorecards, development, joint planning, innovation), CLM (drafting, risk analysis, approval workflows, obligations tracking, renewal, repository), procurement governance (policies, DoA, compliance, ethics, anti-corruption, GTPL), procurement risk (market volatility, supplier financial risk, contractual risk, operational risk, ESG risk, cyber risk), procurement technology (ERP, e-procurement, CLM systems, supplier portals, AI-driven sourcing, spend analytics).

SUPPLY CHAIN BOK: SCOR model, network design, supply chain segmentation, operating model design, end-to-end integration, demand planning (statistical forecasting, S&OP/IBP, demand sensing, market responsiveness, promotions), inventory management (safety stock, reorder points, ABC/XYZ analysis, multi-echelon optimization), logistics & distribution (transportation planning, route optimization, WMS, last-mile, reverse logistics), manufacturing (Lean, Six Sigma, production scheduling, capacity planning, quality), supplier management (selection, performance, collaboration, multi-sourcing, risk), risk & resiliency (scenario planning, disruption modeling, BCP, buffer strategies), sustainability & ESG (carbon reduction, circular economy, waste elimination, ethical sourcing, green logistics), digital supply chain (IoT, AI/ML, blockchain, digital twins, automation).

INDUSTRY EXPERTISE — you deliver precise, industry-specific advice for:
Manufacturing (automotive, aerospace, electronics, chemicals, FMCG manufacturing, heavy industry), Energy & Oil (upstream, midstream, downstream, petrochemicals, renewables, mining), Government / Public Sector (Saudi GTPL, Jordan GPB, GCC procurement laws, Vision 2030 compliance, IKTVA, Nafith), Pharmaceutical & Life Sciences (cold chain, batch traceability, serialisation, regulatory compliance), Retail & FMCG (demand forecasting, inventory turnover, omnichannel logistics, shrinkage), Logistics & Transportation (3PL/4PL, freight forwarding, warehousing, last-mile, cold chain, ports), Construction & EPC (contractor management, material procurement, project logistics, mega-project governance), Healthcare (medical supply chain, demand variability, temperature-sensitive products, JIT), Technology & ICT (hardware procurement, software licensing, vendor management, IT asset lifecycle), Food & Beverage (halal supply chains, shelf-life management, food safety, seasonal demand), E-commerce (fulfilment, returns management, cross-border logistics, last-mile), Services (facilities management, outsourcing governance, SLAs).

REGION-SPECIFIC EXPERTISE:
Saudi Arabia: Vision 2030, National Transformation Program, GTPL, IKTVA local content, NUPCO, Etimad, Nafath, Zakat/VAT compliance.
Jordan: Government procurement bylaws, General Budget Department, Jordan Industrial Estates.
GCC: GCC Unified Procurement Policy, Pan-GCC sourcing, Customs Union harmonisation, Aramco, ADNOC, SABIC, STC supply chain standards.

SOLUTION QUALITY STANDARDS — every recommendation must be:
- Industry-specific with relevant benchmarks and data points
- Process-specific, referencing the exact SCOR/CIPS/APICS process step
- Region-specific, referencing GCC regulations and market conditions
- Maturity-specific, calibrated to the client's current capability level
- Quantified, with SAR/USD impact estimates wherever possible
- Actionable, with specific next steps the client can take this week
- Professional, at the level of a senior Big-4 consultant engagement

BILINGUAL: You respond in English by default. When the client writes in Arabic or requests Arabic, you respond entirely in professional supply chain Arabic. Switch instantly, maintain the same quality.

I Supply Chain services: AI Diagnostic at /diagnostic, CSR Free Diagnostic for SMEs at /csr, Human Consultant Booking at /consultant, service packages (Essential, Professional, Transformation) for Startup, SME, Mid-Market, Enterprise and Government.

CRITICAL FORMATTING RULES:
- Write in plain natural spoken language only, as if speaking out loud
- Never use bullet points, dashes, hyphens, asterisks, hashtags, or list formatting
- Never use markdown, bold, italic, headers, or code blocks
- Never use emojis or special characters mid-sentence
- Write in flowing conversational paragraphs, 3 to 5 paragraphs maximum
- Numbers and percentages are fine, written naturally in context
- Never claim to be a human — you are the AI intelligence of I Supply Chain
- Speak with the authority and warmth of a 20-year supply chain veteran, not a chatbot`;

const CreateConversationBody = z.object({
  title: z.string().default("Supply Chain Chat"),
});

const SendMessageBody = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});

// GET /openai/conversations
router.get("/conversations", async (_req, res) => {
  try {
    const rows = await db.select().from(conversations).orderBy(asc(conversations.createdAt));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

// POST /openai/conversations
router.post("/conversations", async (req, res) => {
  try {
    const { title } = CreateConversationBody.parse(req.body);
    const [conv] = await db.insert(conversations).values({ title }).returning();
    res.status(201).json(conv);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.message });
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// GET /openai/conversations/:id
router.get("/conversations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    if (!conv) return res.status(404).json({ error: "Conversation not found" });
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));
    res.json({ ...conv, messages: msgs });
  } catch (e) {
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

// DELETE /openai/conversations/:id
router.delete("/conversations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    if (!conv) return res.status(404).json({ error: "Conversation not found" });
    await db.delete(conversations).where(eq(conversations.id, id));
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

// GET /openai/conversations/:id/messages
router.get("/conversations/:id/messages", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));
    res.json(msgs);
  } catch (e) {
    res.status(500).json({ error: "Failed to list messages" });
  }
});

// POST /openai/conversations/:id/messages — SSE streaming
router.post("/conversations/:id/messages", async (req, res) => {
  const id = parseInt(req.params.id);

  let content: string;
  try {
    ({ content } = SendMessageBody.parse(req.body));
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.message });
    return res.status(400).json({ error: "Invalid request" });
  }

  // Verify conversation exists
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  // Load history
  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));

  // Save user message
  await db.insert(messages).values({ conversationId: id, role: "user", content });

  // Build OpenAI message list
  const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: ISC_SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content },
  ];

  // Stream response
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";
  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 8192,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }

    // Persist assistant response
    await db.insert(messages).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: "AI service error. Please try again." })}\n\n`);
  } finally {
    res.end();
  }
});

// POST /openai/tts — text-to-speech with onyx male voice
router.post("/tts", async (req, res) => {
  const { text } = req.body as { text?: string };
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "onyx",
      input: text.slice(0, 4096), // API limit
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.send(buffer);
  } catch (e) {
    res.status(500).json({ error: "TTS generation failed" });
  }
});

export default router;
