import express from "express";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { chats, chatCards } from "../../shared/schema";
import { db as initializedDb } from "../db";
import { generateLearningSnippets } from "../openai";
import { requireAuth } from "../authz";

const router = express.Router();

const createChatSchema = z.object({
  topic: z.string().min(1).max(255),
});

const generateContentSchema = z.object({
  topic: z.string().min(1).max(200),
  count: z.number().min(1).max(10).optional().default(5),
  chatId: z.string().uuid().optional(),
});

function getRouteDb() {
  return initializedDb;
}

router.get("/api/chats", async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const db = getRouteDb();
    if (!db) {
      return res.status(200).json({
        success: true,
        chats: [],
        message: "Running in development mode - chat history not persisted",
      });
    }

    const userChats = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, user.id))
      .orderBy(desc(chats.createdAt));

    return res.json({
      success: true,
      chats: userChats,
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch chats",
    });
  }
});

router.post("/api/chats", async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { topic } = createChatSchema.parse(req.body);
    const db = getRouteDb();

    if (!db) {
      return res.status(201).json({
        success: true,
        chat: {
          id: `dev-${Math.random().toString(36).slice(2, 11)}`,
          userId: user.id,
          topic: topic.trim(),
          createdAt: new Date().toISOString(),
        },
        message: "Running in development mode - chat created locally",
      });
    }

    const newChat = await db
      .insert(chats)
      .values({
        userId: user.id,
        topic: topic.trim(),
      })
      .returning();

    return res.status(201).json({
      success: true,
      chat: newChat[0],
    });
  } catch (error) {
    console.error("Error creating chat:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid request data",
        details: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to create chat",
    });
  }
});

router.post("/api/generate-content", async (req, res) => {
  try {
    const { topic, count, chatId } = generateContentSchema.parse(req.body);
    const { snippets, options } = await generateLearningSnippets(topic, count, true);
    const db = getRouteDb();

    if (chatId && db) {
      const user = await requireAuth(req, res);
      if (!user) return;

      const chat = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);

      if (!chat.length) {
        return res.status(404).json({
          success: false,
          error: "Chat not found",
        });
      }

      if (chat[0].userId !== user.id) {
        return res.status(403).json({
          success: false,
          error: "You do not have access to this chat",
        });
      }

      for (const snippet of snippets) {
        await db.insert(chatCards).values({
          chatId,
          content: JSON.stringify({
            content: snippet,
            createdAt: new Date().toISOString(),
          }),
        });
      }
    }

    return res.json({
      success: true,
      snippets,
      options: options ?? [],
      topic,
      chatId,
    });
  } catch (error) {
    console.error("Error generating content:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid request data",
        details: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to generate content",
    });
  }
});

export default router;
