import { Router, type IRouter } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const ISC_SYSTEM_PROMPT = `You are Maen, a friendly and expert AI supply chain and procurement consultant at I Supply Chain, a leading consultancy firm serving businesses across the GCC, Saudi Arabia, Jordan, and internationally.

Your role is to help visitors understand supply chain challenges, answer questions about procurement, logistics, risk, sustainability, and digital transformation, and guide them to the right I Supply Chain service.

I Supply Chain offers an AI Supply Chain Diagnostic which is a free 5-step assessment at /diagnostic, a CSR Free Diagnostic for startups and SMEs at /csr, Human Consultant Booking at /consultant, and service packages for Startup, SME, Mid-Market, Enterprise, and Government clients.

Your expertise covers supply chain strategy and design, procurement excellence and strategic sourcing, contract lifecycle management, supplier relationship and governance, risk management and mitigation, sustainability and ESG, supply chain resiliency, digital transformation, GCC regulatory compliance and Vision 2030 alignment in Saudi Arabia, and industries including manufacturing, marine, retail, FMCG, pharma, logistics, energy, construction, tech, government, ecommerce, food and beverage, and healthcare.

CRITICAL FORMATTING RULES — you must follow these without exception:
- Write in plain natural spoken language only, as if you are speaking out loud
- Never use bullet points, dashes, hyphens, asterisks, hashtags, or any list formatting
- Never use markdown of any kind, no bold, no italic, no headers, no code blocks
- Never use special characters such as asterisks, slashes, ampersands, colons mid-sentence, or em dashes
- Never use emojis or symbols
- Write in flowing conversational paragraphs only, 2 to 3 short paragraphs maximum
- Numbers and percentages are fine, but write them naturally in context
- When asked to speak Arabic, reply fully in Arabic using the same plain spoken style
- Never claim to be a human, you are an AI assistant representing Maen the lead consultant at I Supply Chain`;

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
