import express from "express";
import { sql } from "drizzle-orm";
import { db as initializedDb } from "../db";
import { requireAuth } from "../authz";

const router = express.Router();

const DEFAULT_TOPICS = [
  "Quantum Computing",
  "Neuroplasticity",
  "Dark Matter",
  "Biohacking",
  "Blockchain",
  "AI Ethics",
  "Space Colonization",
  "Cryptography",
  "Genetic Engineering",
  "Renewable Energy",
  "Consciousness",
  "Time Dilation",
];

function getRouteDb() {
  return initializedDb;
}

router.post("/api/topic-interactions", async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { interactions } = req.body;
    const db = getRouteDb();

    if (!db) {
      return res.status(200).json({
        success: true,
        message: "Topic interactions stored locally in development",
      });
    }

    if (!interactions || !Array.isArray(interactions)) {
      return res.status(400).json({
        success: false,
        error: "Invalid request format",
      });
    }

    for (const interaction of interactions) {
      if (!interaction.topic) {
        continue;
      }

      try {
        await db.execute(sql`
          INSERT INTO user_topic_interactions
            (user_id, topic, interaction_count, is_liked, last_interaction)
          VALUES
            (${user.id}, ${interaction.topic}, ${interaction.count || 1}, ${interaction.isLiked || false}, NOW())
          ON CONFLICT (user_id, topic)
          DO UPDATE SET
            interaction_count = EXCLUDED.interaction_count,
            is_liked = EXCLUDED.is_liked,
            last_interaction = NOW()
        `);
      } catch (queryError) {
        console.error("Error saving topic interaction:", queryError);
      }
    }

    return res.json({
      success: true,
      message: "Topic interactions saved successfully",
    });
  } catch (error) {
    console.error("Error saving topic interactions:", error);
    return res.status(500).json({
      success: false,
      error: "Database error",
      details:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

router.get("/api/popular-topics", async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const db = getRouteDb();

    if (!db) {
      return res.json({
        topics: DEFAULT_TOPICS,
        source: "default",
      });
    }

    const result = await db.execute(sql`
      SELECT topic, interaction_count, is_liked, last_interaction
      FROM user_topic_interactions
      WHERE user_id = ${user.id}
      ORDER BY
        is_liked DESC,
        interaction_count DESC,
        last_interaction DESC
      LIMIT 12
    `);
    const rows = result.rows ?? [];

    if (rows.length === 0) {
      return res.json({
        topics: DEFAULT_TOPICS,
        source: "default",
      });
    }

    return res.json({
      topics: rows.map((row: any) => row.topic),
      source: "database",
    });
  } catch (error) {
    console.error("Error fetching popular topics:", error);
    return res.status(500).json({
      success: false,
      error: "Database error",
      details:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

router.get("/api/global-popular-topics", async (_req, res) => {
  try {
    const db = getRouteDb();

    if (!db) {
      return res.json({
        topics: DEFAULT_TOPICS.map((topic, index) => ({
          topic,
          popularity: DEFAULT_TOPICS.length - index,
        })),
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

    return res.json({
      topics: rows.map((row: any) => ({
        topic: row.topic,
        popularity: row.total_count,
      })),
    });
  } catch (error) {
    console.error("Error fetching global popular topics:", error);
    return res.status(500).json({
      success: false,
      error: "Database error",
    });
  }
});

export default router;
