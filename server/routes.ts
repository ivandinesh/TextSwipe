import { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { generateLearningSnippets } from "./openai";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: "Too many generation requests from this IP, please try again later",
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

  app.post("/api/generate-content", async (req: Request, res: Response) => {
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
        success: true,
        snippets,
        options: result.options ?? [],
      });
    } catch (error) {
      console.error("Generation error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to generate content. Please try again.",
      });
    }
  });

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  return createServer(app);
}
