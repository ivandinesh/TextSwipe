import express, { type Express, type Request, type Response } from "express";
import { generateLearningSnippets } from "./openai";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";

// Rate limiting for API endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 generation chains per window
  message: 'Too many generation requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting to API routes
  app.use("/api/generate", limiter);
  // NEW: Learning snippets generation endpoint with continuation support
  app.post("/api/generate", async (req: Request, res: Response) => {
    try {
      const { topic, previousSnippet, page = 0 } = req.body;
      // For now, use IP as user identifier until auth is implemented
      const userId = req.ip;

      if (!topic || typeof topic !== "string") {
        return res
          .status(400)
          .json({ error: "Topic is required and must be a string" });
      }

      // Generate snippets with continuation support
      const result = await generateLearningSnippets(
        topic,
        10,
        previousSnippet,
        userId,
        page,
        true, // generateOptions
      );

      // Final validation: ensure no repetitive patterns in response
      const validatedSnippets = result.snippets.map((content) => {
        if (/additional insights about .* - point \d+/i.test(content)) {
          const timestamp = Date.now();
          const uniqueId = (timestamp + page * 1000)
            .toString(36)
            .substring(0, 6);
          return `Unique insight ${uniqueId}: ${topic} has ${["fundamental", "advanced", "practical", "theoretical", "applied"][page % 5]} aspects worth exploring`;
        }
        return content;
      });

      // Return cards with continuation token, page info, and options for infinite scroll
      // Return cards with continuation token, page info, and options for infinite scroll
      res.json({
        cards: validatedSnippets.map((content) => ({ content })),
        nextPrevious: result.continuationToken,
        page: page + 1,
        options: result.options,
      });
    } catch (error) {
      console.error("Generation error:", error);
      res.status(500).json({
        error: "Failed to generate learning snippets",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // EXISTING: Keep the old endpoint for backward compatibility
  app.post("/api/generate-content", async (req: Request, res: Response) => {
    try {
      const { topic, page = 0 } = req.body;

      if (!topic || typeof topic !== "string") {
        return res
          .status(400)
          .json({ error: "Topic is required and must be a string" });
      }

      // Call the new function but without continuation for backward compatibility
      const result = await generateLearningSnippets(
        topic,
        10,
        undefined,
        req.ip,
        page,
        true, // generateOptions
      );

      // Final validation: ensure no repetitive patterns in response
      const validatedSnippets = result.snippets.map((content) => {
        if (/additional insights about .* - point \d+/i.test(content)) {
          const timestamp = Date.now();
          const uniqueId = (timestamp + page * 1000)
            .toString(36)
            .substring(0, 6);
          return `Unique insight ${uniqueId}: ${topic} has ${["fundamental", "advanced", "practical", "theoretical", "applied"][page % 5]} aspects worth exploring`;
        }
        return content;
      });

      // Return the old format with page info and options for backward compatibility
      res.json({
        success: true,
        snippets: result.snippets,
        page: page + 1,
        options: result.options,
      });
    } catch (error) {
      console.error("Generation error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate content. Please try again.",
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
