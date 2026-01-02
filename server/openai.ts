import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("❌ GEMINI_API_KEY is not defined. Check PM2 environment config.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Gemini model configuration
 * - flash = fast + cheap
 * - temperature low → consistent output
 */
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.4,
    maxOutputTokens: 800,
    responseMimeType: "application/json",
  },
});

/**
 * Hard timeout wrapper to avoid stuck requests
 */
function withTimeout<T>(promise: Promise<T>, ms = 15_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Gemini request timed out")),
      ms
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
  count = 5
): Promise<string[]> {
  try {
    if (!topic || topic.trim().length === 0) {
      throw new Error("Topic is required");
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

    const result = await withTimeout(
      model.generateContent(prompt)
    );

    const text = result.response.text();

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

  } catch (error) {
    console.error("❌ Gemini generation failed:", error instanceof Error ? error.message : error);

    // Safe fallback (never break user flow)
    return [
      `${topic}: Learn the core idea and why it matters.`,
      `Key insight: ${topic} works best when understood conceptually, not memorized.`,
      `Practical tip: Apply ${topic} in small, real examples.`,
      `Remember: Consistency beats intensity when learning ${topic}.`,
      `Expert advice: Focus on fundamentals before advanced ${topic} concepts.`,
    ];
  }
}

