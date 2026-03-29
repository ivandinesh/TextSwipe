import { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { generateLearningSnippets } from "./openai";
import { getPool } from "./db";
import { isSmtpConfigured } from "./mailer";
import { getTopicCacheHealth } from "./topicCache";

const DEFAULT_GENERATION_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_GENERATION_MAX_REQUESTS = 10;

function getPositiveIntegerEnv(name: string, fallback: number) {
  const rawValue = process.env[name];
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const generationRateLimitWindowMs = getPositiveIntegerEnv(
  "GENERATION_RATE_LIMIT_WINDOW_MS",
  DEFAULT_GENERATION_WINDOW_MS,
);
const generationRateLimitMaxRequests = getPositiveIntegerEnv(
  "GENERATION_RATE_LIMIT_MAX_REQUESTS",
  DEFAULT_GENERATION_MAX_REQUESTS,
);

const limiter = rateLimit({
  windowMs: generationRateLimitWindowMs,
  max: generationRateLimitMaxRequests,
  message:
    "Generation limit reached for this window. Please wait a bit before creating more cards.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ""),
});

function normalizeSnippets(topic: string, snippets: string[]) {
  return snippets.map((content, index) => {
    if (/additional insights about .* - point \d+/i.test(content)) {
      const uniqueId = (Date.now() + index * 1000)
        .toString(36)
        .substring(0, 6);
      return `Unique insight ${uniqueId}: ${topic} has ${
        ["fundamental", "advanced", "practical", "theoretical", "applied"][
          index % 5
        ]
      } aspects worth exploring`;
    }

    return content;
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use("/api/generate", limiter);
  app.use("/api/generate-content", limiter);

  app.post("/api/generate", async (req: Request, res: Response) => {
    try {
      const { topic, count = 10, generateOptions = true } = req.body;

      if (!topic || typeof topic !== "string") {
        return res
          .status(400)
          .json({ error: "Topic is required and must be a string" });
      }

      const result = await generateLearningSnippets(
        topic,
        Number.isFinite(count) ? Number(count) : 10,
        Boolean(generateOptions),
      );
      const snippets = normalizeSnippets(topic, result.snippets);

      return res.json({
        cards: snippets.map((content) => ({ content })),
        options: result.options ?? [],
      });
    } catch (error) {
      console.error("Generation error:", error);
      return res.status(500).json({
        error: "Failed to generate learning snippets",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/health", async (_req: Request, res: Response) => {
    const pool = getPool();
    let database = "disabled";

    if (pool) {
      try {
        await pool.query("SELECT 1");
        database = "up";
      } catch {
        database = "down";
      }
    }

    const topicCache = await getTopicCacheHealth();
    const services = {
      database,
      sessionStore:
        process.env.NODE_ENV === "production"
          ? pool
            ? "postgres"
            : "misconfigured"
          : "memory",
      smtp: isSmtpConfigured() ? "configured" : "not_configured",
      openrouter: process.env.OPENROUTER_API_KEY ? "configured" : "not_configured",
      topicCache: topicCache.status,
    };
    const isHealthy =
      (process.env.NODE_ENV !== "production" || database !== "down") &&
      topicCache.status !== "down";

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      services,
    });
  });

  return createServer(app);
}
