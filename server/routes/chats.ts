/**
 * Chat Routes - User-specific chat thread management
 * Hybrid implementation that works with PostgreSQL in production
 */

import express from 'express';
import { z } from 'zod';
import { getDB } from '../db';
import { chats, chatCards, insertChatSchema, insertChatCardSchema } from '../../shared/schema';
import { eq, desc } from 'drizzle-orm';
import { generateLearningSnippets } from '../openai';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
      };
    }
  }
}

const router = express.Router();

// Initialize database connection when this module loads
let db = null;

try {
  if (process.env.NODE_ENV === 'production') {
    db = getDB();
    console.log('🔶 Chat routes using PostgreSQL database');
  } else {
    console.log('🔶 Chat routes running in development mode (no database)');
  }
} catch (error) {
  console.error('⚠️ Database not available, running in memory-only mode:', error);
  db = null;
}

// Zod schemas for validation
const createChatSchema = z.object({
  topic: z.string().min(1).max(255),
});

const generateContentSchema = z.object({
  topic: z.string().min(1).max(200),
  count: z.number().min(1).max(10).optional().default(5),
  chatId: z.string().uuid().optional(),
});

// GET /api/chats - List all chats for current user
router.get('/api/chats', async (req, res) => {
  try {
    // Check authentication
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Please authenticate',
      });
    }

    // Skip if no database in development
    if (!db) {
      return res.status(200).json({
        success: true,
        chats: [],
        message: 'Running in development mode - chat history not persisted'
      });
    }

    // Fetch chats for current user, ordered by most recent
    const userChats = await db.select()
      .from(chats)
      .where(eq(chats.userId, req.user.id))
      .orderBy(desc(chats.createdAt));

    res.json({
      success: true,
      chats: userChats,
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chats',
    });
  }
});

// POST /api/chats - Create new chat thread
router.post('/api/chats', async (req, res) => {
  try {
    // Check authentication
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Please authenticate',
      });
    }

    // Validate request body
    const { topic } = createChatSchema.parse(req.body);

    // Skip if no database in development
    if (!db) {
      return res.status(201).json({
        success: true,
        chat: {
          id: 'dev-' + Math.random().toString(36).substr(2, 9),
          userId: req.user.id,
          topic: topic.trim(),
          createdAt: new Date().toISOString()
        },
        message: 'Running in development mode - chat created locally'
      });
    }

    // Insert new chat
    const newChat = await db.insert(chats)
      .values({
        userId: req.user.id,
        topic: topic.trim(),
      })
      .returning();

    res.status(201).json({
      success: true,
      chat: newChat[0],
    });
  } catch (error) {
    console.error('Error creating chat:', error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create chat',
      });
    }
  }
});

// POST /api/generate-content - Generate content with optional chat association
router.post('/api/generate-content', async (req, res) => {
  try {
    // Validate request body
    const { topic, count, chatId } = generateContentSchema.parse(req.body);

    // Generate content using existing logic
    // (This would call your Gemini AI service)
    const snippets = await generateLearningSnippets(topic, count);

    // If chatId provided, store the generated content in chat_cards
    if (chatId && db) {
      // Verify chat exists and belongs to current user
      const chat = await db.select()
        .from(chats)
        .where(eq(chats.id, chatId))
        .limit(1);

      if (!chat.length) {
        return res.status(404).json({
          success: false,
          error: 'Chat not found',
        });
      }

      // Store each generated snippet as a chat card
      for (const snippet of snippets) {
        await db.insert(chatCards)
          .values({
            chatId,
            content: JSON.stringify({
              content: snippet,
              createdAt: new Date().toISOString(),
            }),
          });
      }
    }

    res.json({
      success: true,
      snippets,
      topic,
      chatId, // Return chatId if content was associated with a chat
    });
  } catch (error) {
    console.error('Error generating content:', error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to generate content',
      });
    }
  }
});

export default router;
