import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables explicitly
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Validate API key format
if (!GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY is not set. Using fallback content.");
} else if (!GEMINI_API_KEY.startsWith('AIza') || GEMINI_API_KEY.length !== 39) {
  console.warn("⚠️ GEMINI_API_KEY format appears invalid. Expected format: AIza... (39 chars)");
}

// Only initialize Gemini if API key is available
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  /**
   * Gemini model configuration
   * - flash = fast + cheap
   * - temperature low → consistent output
   */
  model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 800,
      responseMimeType: "application/json",
    },
  });
}

/**
 * Gemini model configuration
 * - flash = fast + cheap
 * - temperature low → consistent output
 */
if (genAI) {
  model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 800,
      responseMimeType: "application/json",
    },
  });
}

/**
 * Hard timeout wrapper to avoid stuck requests
 */
function withTimeout<T>(promise: Promise<T>, ms = 15_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Gemini request timed out")),
      ms,
    );

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Generates bite-sized learning snippets
 */
export async function generateLearningSnippets(
  topic: string,
  count: number = 5,
): Promise<string[]> {
  try {
    if (!topic || topic.trim().length === 0) {
      throw new Error("Topic is required");
    }

    // If no API key or model is available, return fallback content
    if (!GEMINI_API_KEY || !model) {
      console.log(
        "🔑 No GEMINI_API_KEY available or model not initialized, using fallback content",
      );
      return getFallbackContent(topic, count);
    }

    const prompt = `
You are an expert educator creating short-form mobile learning content.

TASK:
Create exactly ${count} learning snippets about: "${topic}"

RULES:
- Each snippet must be 1–2 sentences
- Clear, practical, and memorable
- No emojis
- No markdown
- No numbering
- No explanations outside the array

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "snippets": [
    "First snippet",
    "Second snippet"
  ]
}
`;

    const result = await withTimeout(model.generateContent(prompt));

    const text = (result as any).response.text();

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON returned by Gemini");
    }

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "snippets" in parsed &&
      Array.isArray((parsed as any).snippets)
    ) {
      return (parsed as any).snippets.slice(0, count);
    }

    throw new Error("Unexpected Gemini response shape");
  } catch (error: unknown) {
    console.error(
      "❌ Gemini generation failed:",
      error instanceof Error ? error.message : error,
    );

    // Safe fallback (never break user flow)
    return getFallbackContent(topic, count);
  }
}

function getFallbackContent(topic: string, count: number): string[] {
  const fallbackSnippets = [
    `${topic}: Learn the core idea and why it matters.`,
    `Key insight: ${topic} works best when understood conceptually, not memorized.`,
    `Practical tip: Apply ${topic} in small, real examples.`,
    `Remember: Consistency beats intensity when learning ${topic}.`,
    `Expert advice: Focus on fundamentals before advanced ${topic} concepts.`,
    `Did you know? ${topic} has many practical applications in real-world scenarios.`,
    `Pro tip: Break down ${topic} into smaller, manageable parts for easier learning.`,
    `Common mistake: Many beginners struggle with the basics of ${topic} - master them first.`,
  ];

  return fallbackSnippets.slice(0, count);
}
