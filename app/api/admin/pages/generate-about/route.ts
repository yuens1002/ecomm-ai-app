import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const systemPrompts = {
  storyFirst: `You are an expert content writer specializing in crafting compelling "About Us" pages for specialty coffee roasters. Your writing style is narrative-driven, warm, and engaging. Focus on telling a story that connects emotionally with readers.

Generate a JSON object with structured blocks for a page editor:
{
  "blocks": [
    {
      "type": "hero",
      "order": 0,
      "content": {
        "title": "Our Story",
        "imageUrl": "__HERO_IMAGE_URL__",
        "caption": "Brief caption about the image"
      }
    },
    {
      "type": "stat",
      "order": 1,
      "content": {
        "label": "Founded",
        "value": "YYYY"
      }
    },
    {
      "type": "stat",
      "order": 2,
      "content": {
        "label": "Origin Countries",
        "value": "X+"
      }
    },
    {
      "type": "stat",
      "order": 3,
      "content": {
        "label": "Third meaningful stat",
        "value": "Value"
      }
    },
    {
      "type": "pullQuote",
      "order": 4,
      "content": {
        "text": "An impactful quote from the story",
        "author": "Optional author name"
      }
    },
    {
      "type": "richText",
      "order": 5,
      "content": {
        "html": "<p>First paragraph of the story...</p><p>Second paragraph...</p>"
      }
    },
    {
      "type": "richText",
      "order": 6,
      "content": {
        "html": "<h2>Section Heading</h2><p>Content for this section...</p>"
      }
    }
  ]
}

Block Requirements:
- 1 hero block (title should be compelling, 3-8 words)
- 3 stat blocks (value: 1-3 words, label: 3-5 words describing the value)
- 1 pullQuote block (10-15 words max, most emotionally resonant line)
- 3-5 richText blocks (each is a section with 2-4 paragraphs)

Rich Text Content:
- Use <h2> for section headings (2-3 sections total)
- Use <p> for paragraphs (keep SHORT: 2-3 sentences, 40-60 words each)
- Opens with captivating story hook
- Weaves founder's journey naturally
- Uses vivid, sensory language
- Creates emotional connection
- Ends with brief invitation to connect

Hero Image:
- Use "__HERO_IMAGE_URL__" as placeholder (will be replaced with actual image)
- Caption should describe the image (8-12 words)

Target: 300-400 words total across all richText blocks.
Return ONLY valid JSON, no markdown code blocks.`,

  valuesFirst: `You are an expert content writer specializing in crafting professional "About Us" pages for specialty coffee roasters. Your writing style is clear, values-driven, and trustworthy. Focus on establishing credibility and showcasing principles.

Generate a JSON object with structured blocks for a page editor:
{
  "blocks": [
    {
      "type": "hero",
      "order": 0,
      "content": {
        "title": "Our Values",
        "imageUrl": "__HERO_IMAGE_URL__",
        "caption": "Brief caption about the image"
      }
    },
    {
      "type": "stat",
      "order": 1,
      "content": {
        "label": "Founded",
        "value": "YYYY"
      }
    },
    {
      "type": "stat",
      "order": 2,
      "content": {
        "label": "Origin Countries",
        "value": "X+"
      }
    },
    {
      "type": "stat",
      "order": 3,
      "content": {
        "label": "Third meaningful stat",
        "value": "Value"
      }
    },
    {
      "type": "pullQuote",
      "order": 4,
      "content": {
        "text": "Powerful statement about mission or values",
        "author": "Optional author name"
      }
    },
    {
      "type": "richText",
      "order": 5,
      "content": {
        "html": "<p>Mission statement...</p><p>Core values...</p>"
      }
    },
    {
      "type": "richText",
      "order": 6,
      "content": {
        "html": "<h2>Section Heading</h2><p>Content for this section...</p>"
      }
    }
  ]
}

Block Requirements:
- 1 hero block (title should be value-focused, 2-4 words)
- 3 stat blocks (value: 1-3 words, label: 3-5 words describing the value)
- 1 pullQuote block (10-15 words max, powerful mission/values statement)
- 3-5 richText blocks (each is a section with 2-4 paragraphs)

Rich Text Content:
- Use <h2> for section headings (2-3 sections total)
- Use <p> for paragraphs (keep SHORT: 2-3 sentences, 40-60 words each)
- Opens with clear mission statement
- Highlights core values prominently
- Emphasizes quality, sourcing, process
- Uses professional, confident tone
- Establishes credibility

Hero Image:
- Use "__HERO_IMAGE_URL__" as placeholder (will be replaced with actual image)
- Caption should describe the image (8-12 words)

Target: 300-400 words total across all richText blocks.
Return ONLY valid JSON, no markdown code blocks.`,

  productFirst: `You are an expert content writer specializing in crafting engaging "About Us" pages for specialty coffee roasters. Your writing style is enthusiastic, educational, and product-focused. Emphasize the coffee journey and expertise.

Generate a JSON object with structured blocks for a page editor:
{
  "blocks": [
    {
      "type": "hero",
      "order": 0,
      "content": {
        "title": "Our Coffee",
        "imageUrl": "__HERO_IMAGE_URL__",
        "caption": "Brief caption about the image"
      }
    },
    {
      "type": "stat",
      "order": 1,
      "content": {
        "label": "Founded",
        "value": "YYYY"
      }
    },
    {
      "type": "stat",
      "order": 2,
      "content": {
        "label": "Origin Countries",
        "value": "X+"
      }
    },
    {
      "type": "stat",
      "order": 3,
      "content": {
        "label": "Third meaningful stat",
        "value": "Value"
      }
    },
    {
      "type": "pullQuote",
      "order": 4,
      "content": {
        "text": "Compelling statement about the coffee or process",
        "author": "Optional author name"
      }
    },
    {
      "type": "richText",
      "order": 5,
      "content": {
        "html": "<p>What makes the coffee special...</p><p>Sourcing details...</p>"
      }
    },
    {
      "type": "richText",
      "order": 6,
      "content": {
        "html": "<h2>Section Heading</h2><p>Content for this section...</p>"
      }
    }
  ]
}

Block Requirements:
- 1 hero block (title should be product-focused, 2-4 words)
- 3 stat blocks (value: 1-3 words, label: 3-5 words describing the value)
- 1 pullQuote block (10-15 words max, compelling coffee/process statement)
- 3-5 richText blocks (each is a section with 2-4 paragraphs)

Rich Text Content:
- Use <h2> for section headings (2-3 sections total)
- Use <p> for paragraphs (keep SHORT: 2-3 sentences, 40-60 words each)
- Opens with what makes coffee special
- Focuses on sourcing, roasting, flavor
- Educates about the process
- Uses enthusiastic but informative tone
- Ends with invitation to explore

Hero Image:
- Use "__HERO_IMAGE_URL__" as placeholder (will be replaced with actual image)
- Caption should describe the image (8-12 words)

Target: 300-400 words total across all richText blocks.
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

    const { answers, currentBlocks } = await request.json();

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Invalid wizard answers" },
        { status: 400 }
      );
    }

    let userPrompt = buildUserPrompt(answers as WizardAnswers);

    // If currentBlocks provided, add structure guidance to prompt
    if (currentBlocks && Array.isArray(currentBlocks)) {
      const blockCounts = currentBlocks.reduce((acc: any, block: any) => {
        acc[block.type] = (acc[block.type] || 0) + 1;
        return acc;
      }, {});

      userPrompt += `\n\nIMPORTANT: Match this block structure:\n${JSON.stringify(blockCounts, null, 2)}\nGenerate exactly the same number of blocks for each type.`;
    }

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
          hasBlocks: Array.isArray(parsed.blocks),
          blocksCount: parsed.blocks?.length || 0,
        });
        return parsed;
      } catch (firstError) {
        console.log(
          `First parse attempt failed for ${variationType}, trying with escaped newlines...`
        );

        try {
          // Second attempt: Fix control characters by properly escaping newlines within string values
          const fixedJson = jsonText
            .replace(/\n/g, "\\n")
            .replace(/\r/g, "\\r")
            .replace(/\t/g, "\\t");

          const parsed = JSON.parse(fixedJson);
          console.log(`${variationType} parsed successfully after fixing:`, {
            hasBlocks: Array.isArray(parsed.blocks),
            blocksCount: parsed.blocks?.length || 0,
          });

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

    // Use placeholder hero image
    const heroImageUrl = "/products/placeholder-hero.jpg";

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
          console.log("Story variation blocks count:", parsed.blocks?.length);

          // Replace hero image placeholder
          if (parsed.blocks && Array.isArray(parsed.blocks)) {
            const heroBlock = parsed.blocks.find((b: any) => b.type === "hero");
            if (heroBlock) {
              heroBlock.content.imageUrl = heroImageUrl;
            }
          }

          return {
            style: "story" as const,
            title: "Story-First Approach",
            description: "Narrative-driven, warm, and emotionally engaging",
            blocks: parsed.blocks,
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
              "Values variation blocks count:",
              parsed.blocks?.length
            );

            // Replace hero image placeholder
            if (parsed.blocks && Array.isArray(parsed.blocks)) {
              const heroBlock = parsed.blocks.find(
                (b: any) => b.type === "hero"
              );
              if (heroBlock) {
                heroBlock.content.imageUrl = heroImageUrl;
              }
            }

            return {
              style: "values" as const,
              title: "Values-First Approach",
              description: "Professional, trustworthy, principles-focused",
              blocks: parsed.blocks,
            };
          } catch (error) {
            console.error("Values variation failed, using fallback");
            // Return a fallback structure if parsing fails
            return {
              style: "values" as const,
              title: "Values-First Approach",
              description: "Professional, trustworthy, principles-focused",
              blocks: [
                {
                  type: "hero",
                  order: 0,
                  content: {
                    title: "Our Values",
                    imageUrl: heroImageUrl,
                    caption: "Dedicated to quality coffee",
                  },
                },
                {
                  type: "richText",
                  order: 1,
                  content: {
                    html: "<p>(AI generation encountered an error. Please regenerate.)</p>",
                  },
                },
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
          console.log("Product variation blocks count:", parsed.blocks?.length);

          // Replace hero image placeholder
          if (parsed.blocks && Array.isArray(parsed.blocks)) {
            const heroBlock = parsed.blocks.find((b: any) => b.type === "hero");
            if (heroBlock) {
              heroBlock.content.imageUrl = heroImageUrl;
            }
          }

          return {
            style: "product" as const,
            title: "Product-First Approach",
            description: "Educational, enthusiastic, coffee-focused",
            blocks: parsed.blocks,
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
