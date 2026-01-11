import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateLearningSnippets } from "./openai";
import { z } from "zod";
import rateLimit from "express-rate-limit";

const generateContentSchema = z.object({
  topic: z.string().min(1).max(200),
  count: z.number().min(1).max(10).optional().default(5),
});

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting to all API routes
  app.use("/api/", limiter);

  // Generate AI learning content
  app.post("/api/generate-content", async (req: Request, res: Response) => {
    try {
      const { topic, count } = generateContentSchema.parse(req.body) as {
        topic: string;
        count: number;
      };

      // Sanitize input to prevent injection attacks
      const sanitizedTopic = topic.trim().replace(/[^\w\s\-]/gi, '');
      if (sanitizedTopic !== topic) {
        console.warn(`Input sanitization: Original "${topic}" -> "${sanitizedTopic}"`);
      }

      console.log(`Generating AI content for topic: ${sanitizedTopic}`);
      const snippets = await generateLearningSnippets(sanitizedTopic, count);

      res.json({
        success: true,
        snippets,
        topic,
      });
    } catch (error: unknown) {
      console.error("Error generating content:", error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Invalid request data",
          details: error.errors,
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Failed to generate content. Please try again.",
        });
      }
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
