import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFile } from "fs/promises";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Main text generation model (available per docs list: Gemini 2.5 Flash)
const MODEL_NAME = "gemini-2.5-flash";
// Vision-capable model for alt text; Gemini 2.0 Flash supports image inputs
const ALT_MODEL_NAME = "gemini-2.0-flash";

type Tone =
  | "warm"
  | "friendly"
  | "professional"
  | "bold"
  | "approachable"
  | "educational";

type LengthPreference = "short" | "medium" | "long";

interface PromptOptions {
  tone: Tone;
  lengthPreference: LengthPreference;
  statCount: number;
}

const DEFAULT_OPTIONS: PromptOptions = {
  tone: "friendly",
  lengthPreference: "medium",
  statCount: 3,
};

const STYLE_METADATA = {
  story: {
    title: "Our Story",
    description:
      "Narrative-driven, warm, and emotionally engaging; lean on founder journey.",
  },
  values: {
    title: "Our Values",
    description:
      "Professional, trustworthy, principles-focused; open with mission and proof points.",
  },
  product: {
    title: "Our Coffee",
    description:
      "Enthusiastic, educational, coffee-focused; highlight sourcing, craft, and flavor.",
  },
};

const LENGTH_TARGETS: Record<
  LengthPreference,
  { label: string; words: string }
> = {
  short: { label: "short", words: "220-320" },
  medium: { label: "medium", words: "320-500" },
  long: { label: "long", words: "500-700" },
};

function buildSystemPrompt(
  style: keyof typeof STYLE_METADATA,
  options: PromptOptions
): string {
  const { statCount, tone, lengthPreference } = options;
  const lengthTarget = LENGTH_TARGETS[lengthPreference];
  const statLabel = `${statCount} stat blocks (value: 1-3 words, label: 3-5 words; hard limit ${statCount})`;

  return `You are an expert content writer specializing in crafting compelling "About Us" pages for specialty coffee roasters.

Tone: ${tone}. Style focus: ${STYLE_METADATA[style].description}
Target length: ${lengthTarget.words} words (overall), concise paragraphs.

Generate a JSON object with structured blocks for a page editor:
{
  "metaDescription": "SEO description 140-160 characters, plain text",
  "blocks": [
    {
      "type": "hero",
      "order": 0,
      "content": {
        "title": "${STYLE_METADATA[style].title}",
        "imageUrl": "__HERO_IMAGE_URL__",
        "caption": "Brief caption about the image"
      }
    },
    { "type": "stat", "order": 1, "content": { "label": "Founded", "value": "YYYY" } },
    { "type": "stat", "order": 2, "content": { "label": "Origin Countries", "value": "X+" } },
    { "type": "stat", "order": 3, "content": { "label": "Third meaningful stat", "value": "Value" } },
    {
      "type": "pullQuote",
      "order": 4,
      "content": {
        "text": "Impactful line from the story/mission",
        "author": "Optional author name"
      }
    },
    {
      "type": "richText",
      "order": 5,
      "content": {
        "html": "<p>Opening hook...</p><p>Next paragraph...</p>"
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
- 1 hero block (title: 2-6 words, compelling)
- ${statLabel}
- 1 pullQuote block (10-18 words max, most resonant line)
- 3-5 richText blocks (2-4 paragraphs each, paragraphs 40-70 words)
- 3-5 richText blocks (2-4 paragraphs each, paragraphs 40-70 words)
- Include metaDescription at root (140-160 characters, no HTML)

Rich Text Content:
- Use <h2> for section headings (2-3 sections total)
- Use <p> for paragraphs (keep SHORT: 2-3 sentences)
- Tailor to the chosen style (${style})
- Use the provided tone consistently

Hero Image:
- Use "__HERO_IMAGE_URL__" as placeholder (will be replaced with actual image)
- Caption should describe the image (8-14 words)

Return ONLY valid JSON, no markdown code blocks.`;
}

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
  heroImageUrl?: string | null;
  heroImageDescription?: string | null;
  previousHeroImageUrl?: string | null;
}

function buildUserPrompt(
  answers: WizardAnswers,
  lengthPreference: LengthPreference
): string {
  const lengthTarget = LENGTH_TARGETS[lengthPreference];

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

Generate a compelling, authentic About page that reflects these unique characteristics. The content should be ${lengthTarget.words} words, well-structured with HTML headings and paragraphs, and match the brand personality described above.`;
}

function isTone(value: unknown): value is Tone {
  return (
    typeof value === "string" &&
    [
      "warm",
      "friendly",
      "professional",
      "bold",
      "approachable",
      "educational",
    ].includes(value)
  );
}

function isLengthPreference(value: unknown): value is LengthPreference {
  return (
    typeof value === "string" && ["short", "medium", "long"].includes(value)
  );
}

function resolveOptions(
  incoming: Partial<PromptOptions>,
  currentBlocks?: Array<{ type?: string }>
): PromptOptions {
  const resolved: PromptOptions = { ...DEFAULT_OPTIONS };

  if (isTone(incoming.tone)) {
    resolved.tone = incoming.tone;
  }

  if (isLengthPreference(incoming.lengthPreference)) {
    resolved.lengthPreference = incoming.lengthPreference;
  }

  if (
    typeof incoming.statCount === "number" &&
    !Number.isNaN(incoming.statCount)
  ) {
    resolved.statCount = Math.min(
      6,
      Math.max(1, Math.floor(incoming.statCount))
    );
  }

  if (currentBlocks && Array.isArray(currentBlocks)) {
    const statCount = currentBlocks.filter((b) => b?.type === "stat").length;
    if (statCount > 0) {
      resolved.statCount = Math.min(6, Math.max(1, statCount));
    }
  }

  return resolved;
}

function isLocalImageUrl(url?: string | null): url is string {
  return !!url && url.startsWith("/");
}

function getMimeTypeFromPath(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
}

async function generateAltTextFromLocalImage(
  imageUrl: string,
  hint?: string | null
): Promise<string | null> {
  try {
    const fullPath = path.join(
      process.cwd(),
      "public",
      imageUrl.replace(/^\//, "")
    );
    const buffer = await readFile(fullPath);
    const base64 = buffer.toString("base64");

    const model = genAI.getGenerativeModel({ model: ALT_MODEL_NAME });
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: base64,
                mimeType: getMimeTypeFromPath(imageUrl),
              },
            },
            {
              text: `Write a concise, accessible alt text (max 18 words) describing this image. Avoid opinions; be specific. ${
                hint ? `Context: ${hint}` : ""
              }`,
            },
          ],
        },
      ],
    });

    const text = result.response.text().trim();
    return text.replace(/^"|"$/g, "");
  } catch (error) {
    console.error("Alt text generation failed:", error);
    return null;
  }
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

    const {
      answers,
      currentBlocks,
      tone,
      lengthPreference,
      statCount,
      heroImageUrl: requestHeroImageUrl,
      heroImageDescription: requestHeroImageDescription,
      previousHeroImageUrl: requestPreviousHeroImageUrl,
    } = await request.json();

    const promptOptions = resolveOptions(
      { tone, lengthPreference, statCount },
      currentBlocks
    );

    const systemPrompts = {
      storyFirst: buildSystemPrompt("story", promptOptions),
      valuesFirst: buildSystemPrompt("values", promptOptions),
      productFirst: buildSystemPrompt("product", promptOptions),
    };

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Invalid wizard answers" },
        { status: 400 }
      );
    }

    const typedAnswers = answers as WizardAnswers;

    const heroImageUrlFromAnswers =
      typedAnswers.heroImageUrl || requestHeroImageUrl || null;
    const previousHeroImageUrl =
      typedAnswers.previousHeroImageUrl || requestPreviousHeroImageUrl || null;
    const providedHeroAlt =
      typedAnswers.heroImageDescription || requestHeroImageDescription || null;

    const resolvedHeroImageUrl =
      heroImageUrlFromAnswers || "/products/placeholder-hero.jpg";

    const urlChanged =
      !!heroImageUrlFromAnswers &&
      !!previousHeroImageUrl &&
      heroImageUrlFromAnswers !== previousHeroImageUrl;

    let heroAltText: string | null = null;
    if (providedHeroAlt && !urlChanged) {
      heroAltText = providedHeroAlt;
    } else if (
      isLocalImageUrl(heroImageUrlFromAnswers) &&
      (!providedHeroAlt || urlChanged)
    ) {
      heroAltText = await generateAltTextFromLocalImage(
        heroImageUrlFromAnswers,
        providedHeroAlt
      );
    }

    let userPrompt = buildUserPrompt(
      typedAnswers,
      promptOptions.lengthPreference
    );

    // If currentBlocks provided, add structure guidance to prompt
    if (currentBlocks && Array.isArray(currentBlocks)) {
      const blockCounts = currentBlocks.reduce(
        (acc: Record<string, number>, block: { type: string }) => {
          acc[block.type] = (acc[block.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      userPrompt += `\n\nIMPORTANT: Match this block structure:\n${JSON.stringify(blockCounts, null, 2)}\nGenerate exactly the same number of blocks for each type.`;
    }

    // Generate 3 variations with different styles
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

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
          try {
            const rawText = result.response.text();
            const parsed = parseJsonResponse(rawText, "Story");
            console.log("Story variation blocks count:", parsed.blocks?.length);

            const metaDescription =
              typeof parsed.metaDescription === "string"
                ? parsed.metaDescription
                : null;

            // Replace hero image placeholder
            if (parsed.blocks && Array.isArray(parsed.blocks)) {
              const heroBlock = parsed.blocks.find(
                (b: any) => b.type === "hero"
              );
              if (heroBlock?.content) {
                heroBlock.content.imageUrl = resolvedHeroImageUrl;
                if (heroAltText) {
                  heroBlock.content.altText = heroAltText;
                }
              }
            }

            return {
              style: "story" as const,
              title: "Story-First Approach",
              description: "Narrative-driven, warm, and emotionally engaging",
              heroImageUrl: resolvedHeroImageUrl,
              heroAltText,
              metaDescription,
              blocks: parsed.blocks,
            };
          } catch (error) {
            console.error("Story variation failed, using fallback", error);
            return {
              style: "story" as const,
              title: "Story-First Approach",
              description: "Narrative-driven, warm, and emotionally engaging",
              heroImageUrl: resolvedHeroImageUrl,
              heroAltText,
              metaDescription: null,
              blocks: [
                {
                  type: "hero",
                  order: 0,
                  content: {
                    title: "Our Story",
                    imageUrl: resolvedHeroImageUrl,
                    altText: heroAltText || undefined,
                    caption: "Discover our journey",
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

            const metaDescription =
              typeof parsed.metaDescription === "string"
                ? parsed.metaDescription
                : null;

            // Replace hero image placeholder
            if (parsed.blocks && Array.isArray(parsed.blocks)) {
              const heroBlock = parsed.blocks.find(
                (b: any) => b.type === "hero"
              );
              if (heroBlock?.content) {
                heroBlock.content.imageUrl = resolvedHeroImageUrl;
                if (heroAltText) {
                  heroBlock.content.altText = heroAltText;
                }
              }
            }

            return {
              style: "values" as const,
              title: "Values-First Approach",
              description: "Professional, trustworthy, principles-focused",
              heroImageUrl: resolvedHeroImageUrl,
              heroAltText,
              metaDescription,
              blocks: parsed.blocks,
            };
          } catch (error) {
            console.error("Values variation failed, using fallback");
            // Return a fallback structure if parsing fails
            return {
              style: "values" as const,
              title: "Values-First Approach",
              description: "Professional, trustworthy, principles-focused",
              heroImageUrl: resolvedHeroImageUrl,
              heroAltText,
              metaDescription: null,
              blocks: [
                {
                  type: "hero",
                  order: 0,
                  content: {
                    title: "Our Values",
                    imageUrl: resolvedHeroImageUrl,
                    altText: heroAltText || undefined,
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
          try {
            const rawText = result.response.text();
            const parsed = parseJsonResponse(rawText, "Product");
            console.log(
              "Product variation blocks count:",
              parsed.blocks?.length
            );

            const metaDescription =
              typeof parsed.metaDescription === "string"
                ? parsed.metaDescription
                : null;

            // Replace hero image placeholder
            if (parsed.blocks && Array.isArray(parsed.blocks)) {
              const heroBlock = parsed.blocks.find(
                (b: any) => b.type === "hero"
              );
              if (heroBlock?.content) {
                heroBlock.content.imageUrl = resolvedHeroImageUrl;
                if (heroAltText) {
                  heroBlock.content.altText = heroAltText;
                }
              }
            }

            return {
              style: "product" as const,
              title: "Product-First Approach",
              description: "Educational, enthusiastic, coffee-focused",
              heroImageUrl: resolvedHeroImageUrl,
              heroAltText,
              metaDescription,
              blocks: parsed.blocks,
            };
          } catch (error) {
            console.error("Product variation failed, using fallback", error);
            return {
              style: "product" as const,
              title: "Product-First Approach",
              description: "Educational, enthusiastic, coffee-focused",
              heroImageUrl: resolvedHeroImageUrl,
              heroAltText,
              metaDescription: null,
              blocks: [
                {
                  type: "hero",
                  order: 0,
                  content: {
                    title: "Our Coffee",
                    imageUrl: resolvedHeroImageUrl,
                    altText: heroAltText || undefined,
                    caption: "Coffee crafted with care",
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
