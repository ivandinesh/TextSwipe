import OpenAI from "openai";

// Using OpenRouter API with OpenAI SDK
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

export async function generateLearningSnippets(topic: string, count: number = 5): Promise<string[]> {
  try {
    const prompt = `Create ${count} educational snippets about "${topic}". Each snippet should be:
- A single, concise learning point (1-2 sentences)
- Easy to understand and memorable
- Perfect for mobile learning (like TikTok-style quick lessons)
- Practical and actionable when possible

Return the snippets as a JSON array of strings.

Example format:
["First learning snippet about the topic", "Second learning snippet with practical info", ...]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using a reliable model available on OpenRouter
      messages: [
        {
          role: "system",
          content: "You are an expert educator who creates bite-sized learning content optimized for mobile consumption."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content generated");
    }

    // Parse the JSON response
    const parsed = JSON.parse(content);
    
    // Handle different possible response formats
    if (Array.isArray(parsed)) {
      return parsed.slice(0, count);
    } else if (parsed.snippets && Array.isArray(parsed.snippets)) {
      return parsed.snippets.slice(0, count);
    } else if (parsed.lessons && Array.isArray(parsed.lessons)) {
      return parsed.lessons.slice(0, count);
    } else {
      // Fallback: extract values from object
      const values = Object.values(parsed).filter(val => typeof val === 'string');
      return values.slice(0, count) as string[];
    }

  } catch (error) {
    console.error('Error generating learning snippets:', error);
    
    // Fallback content if AI fails
    return [
      `Learn about ${topic}: This topic covers fundamental concepts and practical applications.`,
      `Key insight: ${topic} involves understanding core principles that build upon each other.`,
      `Practice tip: Apply ${topic} concepts in small, manageable steps for better retention.`,
      `Remember: ${topic} becomes easier with consistent practice and real-world application.`,
      `Expert advice: Focus on understanding the 'why' behind ${topic} concepts, not just memorizing facts.`
    ];
  }
}