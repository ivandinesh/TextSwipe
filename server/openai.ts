/**
 * OpenRouter API integration for Meta Llama
 * Uses meta-llama/llama-3.3-70b-instruct:free model
 */

import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Simple in-memory cache
const snippetCache = new Map<string, string[]>();

/**
 * Generates learning snippets using OpenRouter API with Meta Llama
 */
export async function generateLearningSnippets(
  topic: string,
  count: number = 5,
): Promise<string[]> {
  try {
    // Check cache first
    const cacheKey = `${topic}:${count}`;
    if (snippetCache.has(cacheKey)) {
      console.log(`⚡ Cache hit for topic: ${topic}`);
      return snippetCache.get(cacheKey)!;
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.warn("⚠️ OPENROUTER_API_KEY is not set. Using fallback content.");
      return getFallbackContent(topic, count);
    }

    if (!topic || topic.trim().length === 0) {
      throw new Error("Topic is required");
    }

    // Improved prompt for better results
    const prompt = `
You are an expert educator creating engaging, bite-sized learning content.

GUIDELINES:
- Create exactly ${count} concise learning snippets about: "${topic}"
- Each snippet: 1-2 sentences max
- Focus on practical, actionable insights
- Use simple, clear language
- Avoid jargon and complex terms
- Make it engaging and memorable

EXAMPLE FORMAT:
{
  "snippets": [
    "First insight about ${topic}",
    "Second practical tip about ${topic}"
  ]
}

RESPONSE FORMAT: STRICT JSON ONLY
`.trim();

    // OpenRouter API call
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that creates concise learning snippets.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter API error:", errorData);

      // Check for rate limit error
      if (response.status === 429) {
        console.warn("⚠️ OpenRouter rate limit exceeded");
        return getFallbackContent(topic, count);
      }

      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.choices || !result.choices[0]?.message?.content) {
      throw new Error("Invalid response format from OpenRouter");
    }

    // Parse the JSON response
    let snippets;
    try {
      const content = result.choices[0].message.content;
      const parsed = JSON.parse(content);
      snippets = parsed.snippets;
    } catch (e) {
      console.error("Failed to parse OpenRouter response:", e);
      throw new Error("Invalid JSON format from OpenRouter");
    }

    // Cache the result
    snippetCache.set(cacheKey, snippets);

    return snippets;
  } catch (error) {
    console.error("❌ OpenRouter generation failed:", error instanceof Error ? error.message : error);
    return getFallbackContent(topic, count);
  }
}

/**
 * Fallback content when API fails
 */
function getFallbackContent(topic: string, count: number): string[] {
  const fallbackSnippets = [
    `Discover the fundamentals of ${topic} and why it matters in today's world.`,
    `Key insight: ${topic} becomes more powerful when you understand its core principles.`,
    `Practical tip: Start applying ${topic} concepts in small, real-world scenarios.`,
    `Remember: Mastering ${topic} requires consistent practice and curiosity.`,
    `Expert advice: Focus on the fundamentals of ${topic} before diving into advanced concepts.`,
    `Did you know? ${topic} has fascinating applications across various industries.`,
    `Pro tip: Break down ${topic} into smaller, manageable learning modules.`,
  ];

  return fallbackSnippets.slice(0, count);
}
