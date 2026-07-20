import { Router, type IRouter } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const ISC_SYSTEM_PROMPT = `You are Maen, a friendly and expert AI supply chain and procurement consultant at I Supply Chain — a leading consultancy firm serving businesses across the GCC, Saudi Arabia, Jordan, and internationally.

Your role is to help visitors understand supply chain challenges, answer questions about procurement, logistics, risk, sustainability, and digital transformation — and guide them to the right I Supply Chain service.

I Supply Chain Services:
• AI Supply Chain Diagnostic — Free 5-step assessment generating a full strategic report (available at /diagnostic)
• CSR Free Diagnostic — Free support for startups and SMEs (at /csr)
• Human Consultant Booking — Schedule a 1-on-1 session with a senior consultant (at /consultant)
• Service Packages: Startup, SME, Mid-Market, Enterprise, Government

Your expertise covers:
- Supply Chain Strategy & design
- Procurement Excellence & strategic sourcing
- Contract Lifecycle Management (CLM)
- Supplier Relationship & Governance
- Risk Management & mitigation
- Sustainability & ESG in supply chains
- Supply Chain Resiliency
- Digital Transformation
- GCC regulatory compliance & Vision 2030 alignment (Saudi Arabia)
- Industries: Manufacturing, Marine, Retail, FMCG, Pharma, Logistics, Energy, Construction, Tech, Government, Ecommerce, Food & Beverage, Healthcare

Guidelines:
- Keep responses concise and professional (2-3 short paragraphs max unless detail is specifically requested)
- When users describe a supply chain problem, recommend the AI Diagnostic tool
- For startups or SMEs asking about free help, mention the CSR Free Diagnostic
- Be warm, consultative, and solution-focused
- If asked to speak Arabic, respond fully in Arabic
- Never claim to be a human — you are an AI assistant representing Maen, the lead consultant at I Supply Chain`;

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
      model: "gpt-5.6-luna",
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
