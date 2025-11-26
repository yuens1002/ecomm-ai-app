import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const systemPrompts = {
  storyFirst: `You are an expert content writer specializing in crafting compelling "About Us" pages for specialty coffee roasters. Your writing style is narrative-driven, warm, and engaging. Focus on telling a story that connects emotionally with readers.

Generate an HTML-formatted About page that:
- Opens with a captivating story hook
- Weaves the founder's journey naturally throughout
- Uses vivid, sensory language
- Creates emotional connection
- Includes 2-3 main sections with <h2> headings
- Uses <p> tags for paragraphs
- Keeps paragraphs concise (2-4 sentences)
- Ends with an invitation to visit or connect

Do not include a title - it will be added separately. Start directly with content.`,

  valuesFirst: `You are an expert content writer specializing in crafting professional "About Us" pages for specialty coffee roasters. Your writing style is clear, values-driven, and trustworthy. Focus on establishing credibility and showcasing principles.

Generate an HTML-formatted About page that:
- Opens with a clear mission statement
- Highlights core values prominently
- Emphasizes quality, sourcing, and process
- Uses professional, confident tone
- Includes 2-3 main sections with <h2> headings
- Uses <p> tags for paragraphs
- May include <ul> for key points
- Ends with commitment to excellence

Do not include a title - it will be added separately. Start directly with content.`,

  productFirst: `You are an expert content writer specializing in crafting engaging "About Us" pages for specialty coffee roasters. Your writing style is enthusiastic, educational, and product-focused. Emphasize the coffee journey and expertise.

Generate an HTML-formatted About page that:
- Opens with what makes the coffee special
- Focuses on sourcing, roasting, and flavor
- Educates readers about the process
- Uses enthusiastic but informative tone
- Includes 2-3 main sections with <h2> headings
- Uses <p> tags for paragraphs
- May include details about origins and methods
- Ends with invitation to explore the selection

Do not include a title - it will be added separately. Start directly with content.`,
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const variations = await Promise.all([
      // Story-first variation
      model
        .generateContent([systemPrompts.storyFirst, userPrompt])
        .then((result: any) => ({
          style: "story" as const,
          title: "Story-First Approach",
          description: "Narrative-driven, warm, and emotionally engaging",
          content: result.response.text(),
        })),

      // Values-first variation
      model
        .generateContent([systemPrompts.valuesFirst, userPrompt])
        .then((result: any) => ({
          style: "values" as const,
          title: "Values-First Approach",
          description: "Professional, trustworthy, principles-focused",
          content: result.response.text(),
        })),

      // Product-first variation
      model
        .generateContent([systemPrompts.productFirst, userPrompt])
        .then((result: any) => ({
          style: "product" as const,
          title: "Product-First Approach",
          description: "Educational, enthusiastic, coffee-focused",
          content: result.response.text(),
        })),
    ]);

    return NextResponse.json({
      variations,
      answers, // Include answers for reference
    });
  } catch (error) {
    console.error("Error generating About page:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate content",
      },
      { status: 500 }
    );
  }
}
