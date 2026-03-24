/**
 * Topic Routes - User-specific topic preferences
 * Hybrid implementation that works with PostgreSQL in production
 */

import express from 'express';
import { sql } from 'drizzle-orm';
import { getDB } from '../db';

const router = express.Router();

const DEFAULT_TOPICS = [
  "Quantum Computing", "Neuroplasticity", "Dark Matter", "Biohacking",
  "Blockchain", "AI Ethics", "Space Colonization", "Cryptography",
  "Genetic Engineering", "Renewable Energy", "Consciousness", "Time Dilation"
];

let db: any = null;

try {
  if (process.env.NODE_ENV === 'production') {
    db = getDB();
    console.log('🔶 Topic routes using PostgreSQL database');
  } else {
    console.log('🔶 Topic routes running in development mode (no database)');
  }
} catch (error) {
  console.error('⚠️ Database not available, running in memory-only mode:', error);
  db = null;
}

// Save topic interactions from client
router.post('/api/topic-interactions', async (req, res) => {
  try {
    const { userId, interactions } = req.body;

    if (!db) {
      return res.status(200).json({
        success: true,
        message: 'Topic interactions stored locally in development'
      });
    }

    if (!userId || !interactions || !Array.isArray(interactions)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request format'
      });
    }

    // Process each interaction
    for (const interaction of interactions) {
      if (!interaction.topic) continue;

      try {
        if (db) {
          await db.execute(sql`
            INSERT INTO user_topic_interactions
              (user_id, topic, interaction_count, is_liked, last_interaction)
            VALUES
              (${userId}, ${interaction.topic}, ${interaction.count || 1}, ${interaction.isLiked || false}, NOW())
            ON CONFLICT (user_id, topic)
            DO UPDATE SET
              interaction_count = EXCLUDED.interaction_count,
              is_liked = EXCLUDED.is_liked,
              last_interaction = NOW()
          `);
        }
      } catch (queryError) {
        console.error('Error saving topic interaction:', queryError);
        // Continue with other interactions even if one fails
      }
    }

    res.json({
      success: true,
      message: 'Topic interactions saved successfully'
    });
  } catch (error) {
    console.error('Error saving topic interactions:', error);
    res.status(500).json({
      success: false,
      error: 'Database error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Get popular topics for a specific user
router.get('/api/popular-topics', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    if (!db) {
      return res.json({
        topics: DEFAULT_TOPICS,
        source: 'default'
      });
    }
    const result = await db.execute(sql`
      SELECT topic, interaction_count, is_liked, last_interaction
      FROM user_topic_interactions
      WHERE user_id = ${String(userId)}
      ORDER BY
        is_liked DESC,
        interaction_count DESC,
        last_interaction DESC
      LIMIT 12
    `);
    const rows = result.rows ?? [];

    // If user has no interactions, return some default popular topics
    if (rows.length === 0) {
      return res.json({
        topics: DEFAULT_TOPICS,
        source: 'default'
      });
    }

    res.json({
      topics: rows.map((row: any) => row.topic),
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching popular topics:', error);
    res.status(500).json({
      success: false,
      error: 'Database error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Get global popular topics (across all users)
router.get('/api/global-popular-topics', async (req, res) => {
  try {
    if (!db) {
      return res.json({
        topics: DEFAULT_TOPICS.map((topic, index) => ({
          topic,
          popularity: DEFAULT_TOPICS.length - index
        }))
      });
    }
    const result = await db.execute(sql`
      SELECT topic, SUM(interaction_count) as total_count
      FROM user_topic_interactions
      GROUP BY topic
      ORDER BY total_count DESC
      LIMIT 20
    `);
    const rows = result.rows ?? [];

    res.json({
      topics: rows.map((row: any) => ({
        topic: row.topic,
        popularity: row.total_count
      }))
    });
  } catch (error) {
    console.error('Error fetching global popular topics:', error);
    res.status(500).json({
      success: false,
      error: 'Database error'
    });
  }
});

export default router;
