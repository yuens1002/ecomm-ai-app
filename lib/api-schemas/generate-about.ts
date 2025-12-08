import { z } from "zod";
import {
  HeroBlock,
  PullQuoteBlock,
  RichTextBlock,
  StatBlock,
} from "@/lib/blocks/schemas";

export const toneEnum = z.enum([
  "warm",
  "friendly",
  "professional",
  "bold",
  "approachable",
  "educational",
]);

export type Tone = z.infer<typeof toneEnum>;

export const lengthPreferenceEnum = z.enum(["short", "medium", "long"]);

export type LengthPreference = z.infer<typeof lengthPreferenceEnum>;

export const wizardAnswersSchema = z.object({
  businessName: z.string().min(1),
  foundingStory: z.string().min(1),
  uniqueApproach: z.string().min(1),
  coffeeSourcing: z.string().min(1),
  roastingPhilosophy: z.string().min(1),
  targetAudience: z.string().min(1),
  brandPersonality: z.string().min(1),
  keyValues: z.string().min(1),
  communityRole: z.string().min(1),
  futureVision: z.string().min(1),
  heroImageUrl: z.string().trim().optional().nullable(),
  heroImageDescription: z.string().trim().optional().nullable(),
  previousHeroImageUrl: z.string().trim().optional().nullable(),
});

export type WizardAnswers = z.infer<typeof wizardAnswersSchema>;

export const generateAboutRequestSchema = z.object({
  tone: toneEnum.optional(),
  lengthPreference: lengthPreferenceEnum.optional(),
  statCount: z.number().int().min(1).max(6).optional(),
  heroImageUrl: z.string().trim().min(1).optional(),
  heroImageDescription: z.string().trim().optional().nullable(),
  previousHeroImageUrl: z.string().trim().optional().nullable(),
  previousAnswersFingerprint: z.string().trim().optional(),
  previousContentFingerprint: z.string().trim().optional(),
  forceRegenerate: z.boolean().optional(),
  currentBlocks: z
    .array(
      z.object({
        type: z.string().min(1),
      })
    )
    .optional(),
  answers: wizardAnswersSchema,
});

export type GenerateAboutRequest = z.infer<typeof generateAboutRequestSchema>;

type GeneratedBlockBase<Type extends string, Content> = {
  type: Type;
  order?: number;
  content?: Partial<Content>;
};

export type GeneratedHeroBlock = GeneratedBlockBase<
  "hero",
  HeroBlock["content"] & { title?: string | null; altText?: string | null }
>;

export type GeneratedStatBlock = GeneratedBlockBase<
  "stat",
  StatBlock["content"]
>;

export type GeneratedPullQuoteBlock = GeneratedBlockBase<
  "pullQuote",
  PullQuoteBlock["content"]
>;

export type GeneratedRichTextBlock = GeneratedBlockBase<
  "richText",
  RichTextBlock["content"]
>;

export type GeneratedBlock =
  | GeneratedHeroBlock
  | GeneratedStatBlock
  | GeneratedPullQuoteBlock
  | GeneratedRichTextBlock;

export type GeneratedVariation = {
  style: "story" | "values" | "product";
  title: string;
  description: string;
  heroImageUrl?: string | null;
  heroAltText?: string | null;
  metaDescription?: string | null;
  blocks: GeneratedBlock[];
};

export type GenerateAboutResponse = {
  variations: GeneratedVariation[];
  answers: WizardAnswers;
  tokens?: {
    story?: number | null;
    values?: number | null;
    product?: number | null;
  };
};
