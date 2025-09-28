import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateLearningSnippets } from "./openai";
import { z } from "zod";

const generateContentSchema = z.object({
  topic: z.string().min(1).max(200),
  count: z.number().min(1).max(10).optional().default(5)
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate AI learning content
  app.post("/api/generate-content", async (req, res) => {
    try {
      const { topic, count } = generateContentSchema.parse(req.body);
      
      console.log(`Generating AI content for topic: ${topic}`);
      const snippets = await generateLearningSnippets(topic, count);
      
      res.json({ 
        success: true, 
        snippets,
        topic 
      });
    } catch (error) {
      console.error("Error generating content:", error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          error: "Invalid request data",
          details: error.errors
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: "Failed to generate content. Please try again." 
        });
      }
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
