import express from "express";
import { z } from "zod";
import {
  getDashboardSummary,
  getRecommendedTopics,
  getUserLikedCards,
  recordLearningSession,
  toggleLikedCard,
  trackTopicInteraction,
} from "../accountStore";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const router = express.Router();

function requireAuth(
  req: express.Request,
  res: express.Response,
): string | null {
  if (!req.session.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return req.session.userId;
}

const learningSessionSchema = z.object({
  topic: z.string().min(1).max(255),
  durationSeconds: z.number().min(0).max(86400),
  cardsCompleted: z.number().min(0).max(1000),
  startedAt: z.string(),
  endedAt: z.string(),
});

const likedCardSchema = z.object({
  topic: z.string().min(1).max(255),
  content: z.string().min(1),
  liked: z.boolean(),
});

const topicInteractionSchema = z.object({
  topic: z.string().min(1).max(255),
  increment: z.number().min(0).max(1000).optional(),
  isLiked: z.boolean().optional(),
});

router.get("/api/dashboard/summary", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const summary = await getDashboardSummary(userId);
  res.json(summary);
});

router.get("/api/dashboard/liked-cards", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const likedCards = await getUserLikedCards(userId);
  res.json({ likedCards });
});

router.get("/api/dashboard/recommended-topics", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const topics = await getRecommendedTopics(userId);
  res.json({ topics });
});

router.post("/api/dashboard/learning-sessions", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const payload = learningSessionSchema.parse(req.body);
  await recordLearningSession({ userId, ...payload });
  await trackTopicInteraction({
    userId,
    topic: payload.topic,
    increment: Math.max(payload.cardsCompleted, 1),
  });
  res.status(201).json({ success: true });
});

router.post("/api/dashboard/liked-cards", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const payload = likedCardSchema.parse(req.body);
  await toggleLikedCard({ userId, ...payload });
  res.status(201).json({ success: true });
});

router.post("/api/dashboard/topic-interactions", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const payload = topicInteractionSchema.parse(req.body);
  await trackTopicInteraction({ userId, ...payload });
  res.status(201).json({ success: true });
});

export default router;
