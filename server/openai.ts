/**
 * OpenRouter API integration with a configurable model/provider.
 * Supports generating learning cards with optional sub-topic suggestions.
 */

import * as dotenv from "dotenv";
import {
  buildTopicCacheKey,
  readTopicCache,
  writeTopicCache,
} from "./topicCache";

// Load environment variables
dotenv.config();

// Simple in-memory cache
const snippetCache = new Map<
  string,
  { snippets: string[]; options?: { title: string; description: string }[] }
>();
const inFlightGenerations = new Map<string, Promise<LearningSnippetResult>>();

export interface TopicOption {
  title: string;
  description: string;
}

export interface LearningSnippetResult {
  snippets: string[];
  options?: TopicOption[];
}

const DEFAULT_OPENROUTER_MODEL = "google/gemini-2.5-flash-lite";

function getOpenRouterModel(): string {
  return process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;
}

/**
 * Sanitize and validate JSON content before parsing
 */
function sanitizeAndValidateJson(content: string): string | null {
  try {
    // Remove any non-JSON content that might be present
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No valid JSON object found in response");
      return null;
    }

    const potentialJson = jsonMatch[0];

    // Basic validation: check for balanced braces and quotes
    let braceCount = 0;
    let inString = false;
    let prevChar = "";
    for (const char of potentialJson) {
      if (char === '"' && prevChar !== "\\") {
        inString = !inString;
      }
      if (!inString) {
        if (char === "{") braceCount++;
        if (char === "}") braceCount--;
      }
      prevChar = char;
    }

    if (braceCount !== 0) {
      console.error("Unbalanced braces in JSON content");
      return null;
    }

    // Additional validation: try to parse the JSON
    try {
      JSON.parse(potentialJson);
      return potentialJson;
    } catch (parseError) {
      console.error(
        "JSON parsing failed during validation:",
        parseError instanceof Error ? parseError.message : String(parseError),
      );
      return null;
    }
  } catch (error) {
    console.error("Error sanitizing JSON:", error);
    return null;
  }
}

/**
 * Log API requests for tracing and debugging
 */
function logRequest(
  topic: string,
  count: number,
  generateOptions: boolean,
  status: string,
  durationMs?: number,
) {
  console.info("[openrouter]", {
    timestamp: new Date().toISOString(),
    topic,
    count,
    generateOptions,
    status,
    durationMs: durationMs ? `${durationMs}ms` : "N/A",
  });
}

/**
 * Generates learning snippets using OpenRouter API
 */
async function generateLearningSnippetsFromApi(
  topic: string,
  count: number = 10,
  generateOptions: boolean = false,
): Promise<LearningSnippetResult> {
  try {
    const model = getOpenRouterModel();

    // Check cache first
    const cacheKey = `${model}:${topic}:${count}:${generateOptions}`;
    if (snippetCache.has(cacheKey)) {
      console.log(`⚡ Cache hit for topic: ${topic}`);
      return snippetCache.get(cacheKey)!;
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.warn("⚠️ OPENROUTER_API_KEY is not set. Using fallback content.");
      logRequest(topic, count, generateOptions, "ERROR: Missing API key");
      return getFallbackContent(topic, count, generateOptions);
    }

    if (!topic || topic.trim().length === 0) {
      throw new Error("Topic is required");
    }

    // Improved prompt for better results
    let prompt = `
You are an expert educator creating engaging, bite-sized learning content.

GUIDELINES:
- Create exactly ${count} concise learning facts about: "${topic}"
- Each fact: 1-2 sentences max
- Focus on practical, actionable insights
- Use simple, clear language
- Avoid jargon and complex terms
- Make it engaging and memorable
`;

    if (generateOptions) {
      prompt += `
 - Also suggest 3-4 related sub-topics for further exploration
 - Each sub-topic should be directly related to the main topic
 - Ensure sub-topics cover different aspects or applications of the main topic
 `;
    }

    prompt += `

EXAMPLE FORMAT:
{
  "cards": [
    {"text": "First fact about ${topic}"},
    {"text": "Second fact about ${topic}"}
  ]`;

    if (generateOptions) {
      prompt += `,
  "options": [
    {"title": "Sub-topic 1", "description": "Brief description of sub-topic 1"},
    {"title": "Sub-topic 2", "description": "Brief description of sub-topic 2"}
  ]`;
    }

    prompt += `
}

RESPONSE FORMAT: STRICT JSON ONLY
`.trim();

    // OpenRouter API call
    const requestStart = Date.now();
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that creates concise learning content.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      },
    );
    const requestDuration = Date.now() - requestStart;

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter API error:", errorData);
      logRequest(
        topic,
        count,
        generateOptions,
        `ERROR: API returned status ${response.status}`,
        requestDuration,
      );

      // Check for rate limit error
      if (response.status === 429) {
        console.warn("⚠️ OpenRouter rate limit exceeded");
        logRequest(
          topic,
          count,
          generateOptions,
          "ERROR: Rate limit exceeded",
          requestDuration,
        );
        return getFallbackContent(topic, count, generateOptions);
      }

      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    let result: any = await response.json();
    const requestEnd = Date.now();
    const totalDuration = requestEnd - requestStart;

    const responseStructure = {
      hasChoices: !!result?.choices,
      choicesLength: result?.choices?.length,
      hasFirstChoice: !!result?.choices?.[0],
      hasMessage: !!result?.choices?.[0]?.message,
      hasContent: !!result?.choices?.[0]?.message?.content,
    };

    // Check if response has the expected structure
    if (!result?.choices?.[0]?.message?.content) {
      console.error("Invalid response format from OpenRouter");
      console.error("Response structure:", responseStructure);

      // Try to extract content from alternative response formats
      let fallbackContent = null;

      // Check for completely missing choices array
      if (!result?.choices) {
        console.error("Response is missing 'choices' array entirely");

        // Try to extract content from other possible fields
        if (result?.content) {
          fallbackContent = result.content;
          console.warn("Using 'content' field as fallback");
        } else if (result?.text) {
          fallbackContent = result.text;
          console.warn("Using 'text' field as fallback");
        } else if (result?.output) {
          fallbackContent = result.output;
          console.warn("Using 'output' field as fallback");
        } else if (result?.message) {
          fallbackContent = result.message;
          console.warn("Using 'message' field as fallback");
        } else if (result?.response) {
          fallbackContent = result.response;
          console.warn("Using 'response' field as fallback");
        } else if (result?.result) {
          fallbackContent = result.result;
          console.warn("Using 'result' field as fallback");
        }
      }
      // Check for alternative response formats when choices exist
      else if (result?.choices?.[0]?.text) {
        fallbackContent = result.choices[0].text;
        console.warn("Using 'text' field as fallback for content");
      } else if (result?.output) {
        fallbackContent = result.output;
        console.warn("Using 'output' field as fallback for content");
      } else if (result?.choices?.[0]?.delta?.content) {
        fallbackContent = result.choices[0].delta.content;
        console.warn("Using 'delta.content' field as fallback for content");
      }

      if (fallbackContent) {
        // Create a mock response with the fallback content
        const mockResult = {
          choices: [
            {
              message: {
                content: fallbackContent,
              },
            },
          ],
        };

        console.warn("Recovered content from alternative response format");
        logRequest(
          topic,
          count,
          generateOptions,
          "WARNING: Used alternative response format",
          totalDuration,
        );

        // Continue processing with the mock result
        result = mockResult;
      } else {
        // No recoverable content found
        console.error("No recoverable content found in response");
        logRequest(
          topic,
          count,
          generateOptions,
          "ERROR: Invalid response format",
          totalDuration,
        );

        // Fall back to enhanced fallback content instead of throwing error
        console.warn("Falling back to enhanced content generation");
        return getFallbackContent(topic, count, generateOptions);
      }
    }

    // Log successful request
    logRequest(topic, count, generateOptions, "SUCCESS", totalDuration);

    // Parse the JSON response
    let snippets: string[];
      let options: TopicOption[] = [];

    try {
      const content = result.choices[0].message.content;

      const sanitizedJson = sanitizeAndValidateJson(content);
      if (!sanitizedJson) {
        console.error("Invalid JSON format in OpenRouter response");
        console.warn("Falling back to enhanced content generation");
        return getFallbackContent(topic, count, generateOptions);
      }

      // Additional validation before parsing
      if (sanitizedJson.length === 0) {
        console.error("Empty JSON after sanitization");
        console.warn("Falling back to enhanced content generation");
        return getFallbackContent(topic, count, generateOptions);
      }

      let parsed: any;
      try {
        parsed = JSON.parse(sanitizedJson);
      } catch (parseError) {
        console.error(
          "JSON parsing failed after sanitization:",
          parseError instanceof Error ? parseError.message : String(parseError),
        );
        console.error(
          "Problematic JSON content:",
          sanitizedJson.substring(0, 200) + "...",
        );
        throw new Error(
          "Invalid JSON format from OpenRouter after sanitization",
        );
      }

      // Handle both formats (with/without options)
      if (parsed.cards) {
        snippets = parsed.cards
          .map((card: { text: string }) => card.text)
          .slice(0, count);
        if (parsed.options) {
          options = parsed.options.slice(0, 4);
        }
      } else if (parsed.snippets) {
        // Backward compatibility
        snippets = parsed.snippets.slice(0, count);
      } else {
        throw new Error("Invalid response format: missing cards/snippets");
      }
    } catch (e) {
      console.error("Failed to parse OpenRouter response:", e);
      // Initialize with fallback content
      const fallbackContent = getFallbackContent(topic, count, generateOptions);
      snippets = fallbackContent.snippets;
      if (generateOptions) {
        options = fallbackContent.options || [];
      }
      // Log this as a warning rather than throwing to allow fallback
      console.warn("Using fallback content due to JSON parsing error");
      // Don't re-throw the error - let the function continue with fallback content
    }

    // Cache the result
    snippetCache.set(cacheKey, { snippets, options });

    return { snippets, options };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(
      "ℹ️ OpenRouter API call failed, using enhanced fallback:",
      errorMessage,
    );

    // Log the raw response for debugging if available
    // Note: result is not available in catch block, so we skip this for now

    // Ensure we always return options when requested, even in fallback
    const fallbackResult = getFallbackContent(topic, count, generateOptions);
    if (
      generateOptions &&
      (!fallbackResult.options || fallbackResult.options.length === 0)
    ) {
      console.warn("Generating fallback options for failed API call");
      fallbackResult.options = [
        {
          title: `Introduction to ${topic}`,
          description: `Learn the basics of ${topic}`,
        },
        {
          title: `Advanced ${topic}`,
          description: `Explore advanced concepts in ${topic}`,
        },
        {
          title: `Applications of ${topic}`,
          description: `Discover practical applications of ${topic}`,
        },
        {
          title: `${topic} Research`,
          description: `Explore current research in ${topic}`,
        },
      ];
    }
    return fallbackResult;
  }
}

export async function generateLearningSnippets(
  topic: string,
  count: number = 10,
  generateOptions: boolean = false,
): Promise<LearningSnippetResult> {
  const model = getOpenRouterModel();
  const cacheKey = buildTopicCacheKey({
    topic,
    model,
    count,
    generateOptions,
  });

  if (snippetCache.has(cacheKey)) {
    console.log(`âš¡ Cache hit for topic: ${topic}`);
    return snippetCache.get(cacheKey)!;
  }

  const persistedCache = await readTopicCache({
    topic,
    model,
    count,
    generateOptions,
  });
  if (persistedCache) {
    console.log(`âš¡ Persistent cache hit for topic: ${topic}`);
    snippetCache.set(cacheKey, persistedCache);
    return persistedCache;
  }

  const existingGeneration = inFlightGenerations.get(cacheKey);
  if (existingGeneration) {
    return existingGeneration;
  }

  const generationPromise = (async () => {
    const result = await generateLearningSnippetsFromApi(
      topic,
      count,
      generateOptions,
    );

    snippetCache.set(cacheKey, result);

    if (process.env.OPENROUTER_API_KEY) {
      await writeTopicCache(
        {
          topic,
          model,
          count,
          generateOptions,
        },
        result,
      );
    }

    return result;
  })();

  inFlightGenerations.set(cacheKey, generationPromise);

  try {
    return await generationPromise;
  } finally {
    inFlightGenerations.delete(cacheKey);
  }
}

/**
 * Fallback content when API fails
 */
function getFallbackContent(
  topic: string,
  count: number,
  generateOptions: boolean = false,
): LearningSnippetResult {
  const fallbackSnippets = [
    `Discover the fundamentals of ${topic} and why it matters in today's world.`,
    `Key insight: ${topic} becomes more powerful when you understand its core principles.`,
    `Practical tip: Start applying ${topic} concepts in small, real-world scenarios.`,
    `Remember: Mastering ${topic} requires consistent practice and curiosity.`,
    `Expert advice: Focus on the fundamentals of ${topic} before diving into advanced concepts.`,
    `Did you know? ${topic} has fascinating applications across various industries.`,
    `Pro tip: Break down ${topic} into smaller, manageable learning modules.`,
    `Interesting fact: ${topic} connects multiple disciplines in unexpected ways.`,
    `Tip: Use ${topic} to solve practical, everyday problems.`,
    `Note: Understanding ${topic} can open doors to many opportunities.`,
  ];

  // Generate options if requested
  let options: TopicOption[] = [];
  if (generateOptions) {
    // Topic-specific options that are more relevant
    const topicLower = topic.toLowerCase();

    if (
      topicLower.includes("science") ||
      topicLower.includes("biology") ||
      topicLower.includes("neuroscience")
    ) {
      options = [
        {
          title: `Biological Basis of ${topic}`,
          description: `Explore the fundamental biological mechanisms behind ${topic}`,
        },
        {
          title: `Applications in Medicine`,
          description: `Learn how ${topic} is applied in medical research and treatments`,
        },
        {
          title: `Cognitive Aspects`,
          description: `Understand the cognitive and psychological dimensions of ${topic}`,
        },
        {
          title: `Future Research`,
          description: `Discover cutting-edge research and future directions in ${topic}`,
        },
      ];
    } else if (
      topicLower.includes("physics") ||
      topicLower.includes("quantum")
    ) {
      options = [
        {
          title: `Fundamental Principles`,
          description: `Dive deep into the core principles that govern ${topic}`,
        },
        {
          title: `Practical Applications`,
          description: `Explore real-world applications and technologies based on ${topic}`,
        },
        {
          title: `Historical Development`,
          description: `Trace the evolution of our understanding of ${topic}`,
        },
        {
          title: `Current Research`,
          description: `Learn about the latest discoveries and experiments in ${topic}`,
        },
      ];
    } else if (
      topicLower.includes("ai") ||
      topicLower.includes("artificial") ||
      topicLower.includes("machine")
    ) {
      options = [
        {
          title: `AI Fundamentals`,
          description: `Understand the core concepts and algorithms behind ${topic}`,
        },
        {
          title: `Ethical Considerations`,
          description: `Explore the ethical implications and societal impact of ${topic}`,
        },
        {
          title: `Real-World Applications`,
          description: `See how ${topic} is transforming industries and daily life`,
        },
        {
          title: `Future of AI`,
          description: `Discover emerging trends and future possibilities in ${topic}`,
        },
      ];
    } else {
      // Generic fallback options
      options = [
        {
          title: `History of ${topic}`,
          description: `Trace the historical development and key milestones of ${topic}`,
        },
        {
          title: `Types of ${topic}`,
          description: `Explore the different variations and classifications of ${topic}`,
        },
        {
          title: `Applications`,
          description: `Learn about practical uses and real-world applications of ${topic}`,
        },
        {
          title: `Future Trends`,
          description: `Discover emerging trends and innovations in ${topic}`,
        },
      ];
    }
  }

  return {
    snippets: fallbackSnippets.slice(0, count),
    options: generateOptions ? options : undefined,
  };
}
