import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const systemPrompts = {
  storyFirst: `You are an expert content writer specializing in crafting compelling "About Us" pages for specialty coffee roasters. Your writing style is narrative-driven, warm, and engaging. Focus on telling a story that connects emotionally with readers.

Generate a JSON object with this structure:
{
  "content": "The main content text...",
  "pullQuote": "An impactful quote from the content",
  "stats": [
    {"label": "Founded", "value": "YYYY"},
    {"label": "Origin Countries", "value": "X+"},
    {"label": "Third stat", "value": "something meaningful"}
  ]
}

Content formatting:
- Opens with a captivating story hook (1-2 short paragraphs)
- Weaves the founder's journey naturally throughout
- Uses vivid, sensory language
- Creates emotional connection
- Use "### Heading Text" format for section headings (2-3 sections)
- CRITICAL: Keep paragraphs SHORT (2-3 sentences maximum, 40-60 words each)
- Separate paragraphs with DOUBLE line breaks (\n\n)
- Use conversational, scannable language
- Break up dense text - no walls of text
- Ends with a brief invitation to visit or connect (1-2 sentences)

Pull quote: Extract the most impactful, emotionally resonant sentence (10-15 words max)

Stats: Create 3 value cards from their core values/key principles. Each should be:
- A single word or short phrase (1-3 words max) for "value"
- A brief description (3-5 words) for "label"
Example: {"label": "Direct Trade Relationships", "value": "Ethical"}

Target length: 300-400 words total, broken into 6-8 short, digestible paragraphs.
Do not include a title - it will be added separately. Start directly with content.
DO NOT use any HTML tags in content. Use ### for headings and double line breaks for paragraphs.
Return ONLY valid JSON, no markdown code blocks.`,

  valuesFirst: `You are an expert content writer specializing in crafting professional "About Us" pages for specialty coffee roasters. Your writing style is clear, values-driven, and trustworthy. Focus on establishing credibility and showcasing principles.

Generate a JSON object with this structure:
{
  "content": "The main content text...",
  "pullQuote": "An impactful statement about values",
  "stats": [
    {"label": "Founded", "value": "YYYY"},
    {"label": "Origin Countries", "value": "X+"},
    {"label": "Third stat", "value": "something meaningful"}
  ]
}

Content formatting:
- Opens with a clear, concise mission statement (1-2 sentences)
- Highlights core values prominently
- Emphasizes quality, sourcing, and process
- Uses professional, confident tone
- Use "### Heading Text" format for section headings (2-3 sections)
- CRITICAL: Keep paragraphs SHORT (2-3 sentences maximum, 40-60 words each)
- Separate paragraphs with DOUBLE line breaks (\n\n)
- Use clear, scannable language
- Break up dense text into bite-sized pieces

Pull quote: Extract the most powerful statement about their mission or values (10-15 words max)

Stats: Create 3 value cards from their core values/key principles. Each should be:
- A single word or short phrase (1-3 words max) for "value"
- A brief description (3-5 words) for "label"
Example: {"label": "Direct Trade Relationships", "value": "Ethical"}

Target length: 300-400 words total, broken into 6-8 short, digestible paragraphs.
Do not include a title - it will be added separately. Start directly with content.
DO NOT use any HTML tags in content. Use ### for headings and double line breaks for paragraphs.
Return ONLY valid JSON, no markdown code blocks.`,

  productFirst: `You are an expert content writer specializing in crafting engaging "About Us" pages for specialty coffee roasters. Your writing style is enthusiastic, educational, and product-focused. Emphasize the coffee journey and expertise.

Generate a JSON object with this structure:
{
  "content": "The main content text...",
  "pullQuote": "An exciting statement about the coffee",
  "stats": [
    {"label": "Founded", "value": "YYYY"},
    {"label": "Origin Countries", "value": "X+"},
    {"label": "Third stat", "value": "something meaningful"}
  ]
}

Content formatting:
- Opens with what makes the coffee special (1-2 sentences)
- Focuses on sourcing, roasting, and flavor
- Educates readers about the process
- Uses enthusiastic but informative tone
- Use "### Heading Text" format for section headings (2-3 sections)
- CRITICAL: Keep paragraphs SHORT (2-3 sentences maximum, 40-60 words each)
- Separate paragraphs with DOUBLE line breaks (\n\n)
- May include specific origins and methods briefly
- Use energetic, scannable language
- Break complex ideas into simple, digestible chunks
- Ends with brief invitation to explore the selection (1-2 sentences)

Pull quote: Extract the most compelling statement about the coffee or process (10-15 words max)

Stats: Create 3 value cards from their core values/key principles. Each should be:
- A single word or short phrase (1-3 words max) for "value"
- A brief description (3-5 words) for "label"
Example: {"label": "Direct Trade Relationships", "value": "Ethical"}

Target length: 300-400 words total, broken into 6-8 short, digestible paragraphs.
Do not include a title - it will be added separately. Start directly with content.
DO NOT use any HTML tags in content. Use ### for headings and double line breaks for paragraphs.
Return ONLY valid JSON, no markdown code blocks.`,
};

interface WizardAnswers {
  businessName: string;
  foundingStory: string;
  uniqueApproach: string;
  coffeeSourcing: string;
  roastingPhilosophy: string;
  targetAudience: string;
  brandPersonality: string;
  keyValues: string;
  communityRole: string;
  futureVision: string;
}

function buildUserPrompt(answers: WizardAnswers): string {
  return `Generate an About page for ${answers.businessName} based on these details:

**Founding Story:**
${answers.foundingStory}

**What Makes Them Unique:**
${answers.uniqueApproach}

**Coffee Sourcing:**
${answers.coffeeSourcing}

**Roasting Philosophy:**
${answers.roastingPhilosophy}

**Target Audience:**
${answers.targetAudience}

**Brand Personality:**
${answers.brandPersonality}

**Core Values:**
${answers.keyValues}

**Community Role:**
${answers.communityRole}

**Future Vision:**
${answers.futureVision}

Generate a compelling, authentic About page that reflects these unique characteristics. The content should be 300-500 words, well-structured with HTML headings and paragraphs, and match the brand personality described above.`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { answers } = await request.json();

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Invalid wizard answers" },
        { status: 400 }
      );
    }

    const userPrompt = buildUserPrompt(answers as WizardAnswers);

    // Generate 3 variations with different styles
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Helper to parse JSON from Gemini response (strips markdown code blocks)
    const parseJsonResponse = (rawText: string, variationType: string) => {
      console.log(`\n=== ${variationType} Raw Response (first 500 chars) ===`);
      console.log(rawText.substring(0, 500));

      let jsonText = rawText.trim();
      // Remove markdown code blocks if present
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      // Try to find JSON object if response has extra text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      try {
        // First attempt: parse as-is
        const parsed = JSON.parse(jsonText);
        console.log(`${variationType} parsed successfully:`, {
          hasContent: !!parsed.content,
          hasPullQuote: !!parsed.pullQuote,
          hasStats: Array.isArray(parsed.stats),
          statsCount: parsed.stats?.length || 0,
        });
        return parsed;
      } catch (firstError) {
        console.log(
          `First parse attempt failed for ${variationType}, trying with escaped newlines...`
        );

        try {
          // Second attempt: Fix control characters by properly escaping newlines within string values
          // This regex finds string values and escapes unescaped newlines within them
          const fixedJson = jsonText.replace(
            /"content":\s*"([\s\S]*?)(?=",\s*"pullQuote")/g,
            (match, content) => {
              // Escape literal newlines within the content string
              const escaped = content
                .replace(/\n/g, "\\n")
                .replace(/\r/g, "\\r");
              return `"content": "${escaped}"`;
            }
          );

          const parsed = JSON.parse(fixedJson);
          console.log(`${variationType} parsed successfully after fixing:`, {
            hasContent: !!parsed.content,
            hasPullQuote: !!parsed.pullQuote,
            hasStats: Array.isArray(parsed.stats),
            statsCount: parsed.stats?.length || 0,
          });

          // Unescape the newlines back for display
          if (parsed.content) {
            parsed.content = parsed.content
              .replace(/\\n/g, "\n")
              .replace(/\\r/g, "\r");
          }

          return parsed;
        } catch (secondError) {
          console.error(
            `Failed to parse ${variationType} JSON after fix attempt:`,
            secondError
          );
          console.log(
            "Full attempted parse text:",
            jsonText.substring(0, 1000)
          );
          throw new Error(`Invalid JSON format from AI for ${variationType}`);
        }
      }
    };

    const variations = await Promise.all([
      // Story-first variation
      model
        .generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: systemPrompts.storyFirst + "\n\n" + userPrompt }],
            },
          ],
        })
        .then((result: any) => {
          const rawText = result.response.text();
          const parsed = parseJsonResponse(rawText, "Story");
          console.log("Story variation content length:", parsed.content.length);
          return {
            style: "story" as const,
            title: "Story-First Approach",
            description: "Narrative-driven, warm, and emotionally engaging",
            content: parsed.content,
            pullQuote: parsed.pullQuote,
            stats: parsed.stats,
          };
        }),

      // Values-first variation
      model
        .generateContent({
          contents: [
            {
              role: "user",
              parts: [
                { text: systemPrompts.valuesFirst + "\n\n" + userPrompt },
              ],
            },
          ],
        })
        .then((result: any) => {
          const rawText = result.response.text();
          try {
            const parsed = parseJsonResponse(rawText, "Values");
            console.log(
              "Values variation content length:",
              parsed.content.length
            );
            return {
              style: "values" as const,
              title: "Values-First Approach",
              description: "Professional, trustworthy, principles-focused",
              content: parsed.content,
              pullQuote: parsed.pullQuote,
              stats: parsed.stats,
            };
          } catch (error) {
            console.error("Values variation failed, using fallback");
            // Return a fallback structure if parsing fails
            return {
              style: "values" as const,
              title: "Values-First Approach",
              description: "Professional, trustworthy, principles-focused",
              content:
                rawText.substring(0, 500) +
                "\n\n(AI generation encountered an error. Please regenerate.)",
              pullQuote: "Quality and integrity in every cup",
              stats: [
                { label: "Core Values", value: "3+" },
                { label: "Quality Focus", value: "100%" },
                { label: "Community", value: "Strong" },
              ],
            };
          }
        }),

      // Product-first variation
      model
        .generateContent({
          contents: [
            {
              role: "user",
              parts: [
                { text: systemPrompts.productFirst + "\n\n" + userPrompt },
              ],
            },
          ],
        })
        .then((result: any) => {
          const rawText = result.response.text();
          const parsed = parseJsonResponse(rawText, "Product");
          console.log(
            "Product variation content length:",
            parsed.content.length
          );
          return {
            style: "product" as const,
            title: "Product-First Approach",
            description: "Educational, enthusiastic, coffee-focused",
            content: parsed.content,
            pullQuote: parsed.pullQuote,
            stats: parsed.stats,
          };
        }),
    ]);

    return NextResponse.json({
      variations,
      answers, // Include answers for reference
    });
  } catch (error) {
    console.error("Error generating About page:", error);

    // Check if it's a rate limit error
    const errorMessage = error instanceof Error ? error.message : "";
    const isRateLimitError =
      errorMessage.includes("429") ||
      errorMessage.includes("quota") ||
      errorMessage.includes("Too Many Requests");

    return NextResponse.json(
      {
        error: isRateLimitError
          ? "The AI service is busy right now. Please wait a moment and try again."
          : "Failed to generate content. Please try again.",
      },
      { status: isRateLimitError ? 429 : 500 }
    );
  }
}
