import { z } from "zod";

/**
 * Block System Schemas
 * 
 * Defines all block types with Zod validation.
 * TypeScript types are inferred from these schemas.
 */

// Base schema for all blocks
const baseBlockSchema = z.object({
  id: z.string().cuid(),
  order: z.number().int().min(0),
});

// Hero block - main page header with image
export const heroBlockSchema = baseBlockSchema.extend({
  type: z.literal("hero"),
  content: z.object({
    title: z.string().min(1).max(100),
    imageUrl: z.string().url(),
    imageAlt: z.string().max(200).optional(),
  }),
});

// Stat block - single statistic display
export const statBlockSchema = baseBlockSchema.extend({
  type: z.literal("stat"),
  content: z.object({
    label: z.string().min(1).max(50),
    value: z.string().min(1).max(50),
  }),
});

// Pull quote block - highlighted quote
export const pullQuoteBlockSchema = baseBlockSchema.extend({
  type: z.literal("pullQuote"),
  content: z.object({
    text: z.string().min(1).max(500),
    author: z.string().max(100).optional(),
  }),
});

// Rich text block - formatted content
export const richTextBlockSchema = baseBlockSchema.extend({
  type: z.literal("richText"),
  content: z.object({
    html: z.string().min(1),
  }),
});

// Location block - physical address (for Cafe page)
export const locationBlockSchema = baseBlockSchema.extend({
  type: z.literal("location"),
  content: z.object({
    name: z.string().min(1).max(100),
    street: z.string().min(1).max(200),
    city: z.string().min(1).max(100),
    state: z.string().min(2).max(50),
    zip: z.string().min(5).max(10),
    country: z.string().min(2).max(100),
    phone: z.string().max(20).optional(),
    email: z.string().email().optional(),
  }),
});

// Hours block - business hours (for Cafe page)
export const hoursBlockSchema = baseBlockSchema.extend({
  type: z.literal("hours"),
  content: z.object({
    title: z.string().max(100).default("Hours"),
    schedule: z.array(
      z.object({
        day: z.string().min(1).max(20),
        hours: z.string().min(1).max(50), // e.g., "8am - 6pm" or "Closed"
      })
    ),
  }),
});

// FAQ item block - question and answer pair
export const faqItemBlockSchema = baseBlockSchema.extend({
  type: z.literal("faqItem"),
  content: z.object({
    question: z.string().min(1).max(200),
    answer: z.string().min(1).max(2000),
  }),
});

// Image gallery block - multiple images
export const imageGalleryBlockSchema = baseBlockSchema.extend({
  type: z.literal("imageGallery"),
  content: z.object({
    images: z.array(
      z.object({
        url: z.string().url(),
        alt: z.string().max(200),
        caption: z.string().max(200).optional(),
      })
    ).min(1).max(12),
  }),
});

// Discriminated union of all block types
export const blockSchema = z.discriminatedUnion("type", [
  heroBlockSchema,
  statBlockSchema,
  pullQuoteBlockSchema,
  richTextBlockSchema,
  locationBlockSchema,
  hoursBlockSchema,
  faqItemBlockSchema,
  imageGalleryBlockSchema,
]);

// Infer TypeScript types
export type Block = z.infer<typeof blockSchema>;
export type HeroBlock = z.infer<typeof heroBlockSchema>;
export type StatBlock = z.infer<typeof statBlockSchema>;
export type PullQuoteBlock = z.infer<typeof pullQuoteBlockSchema>;
export type RichTextBlock = z.infer<typeof richTextBlockSchema>;
export type LocationBlock = z.infer<typeof locationBlockSchema>;
export type HoursBlock = z.infer<typeof hoursBlockSchema>;
export type FaqItemBlock = z.infer<typeof faqItemBlockSchema>;
export type ImageGalleryBlock = z.infer<typeof imageGalleryBlockSchema>;

// Block type enum for easier checking
export type BlockType = Block["type"];

// Helper to create new blocks with defaults
export function createBlock(type: BlockType, order: number): Partial<Block> {
  const id = `block_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  switch (type) {
    case "hero":
      return { id, type, order, content: { title: "", imageUrl: "", imageAlt: "" } };
    case "stat":
      return { id, type, order, content: { label: "", value: "" } };
    case "pullQuote":
      return { id, type, order, content: { text: "" } };
    case "richText":
      return { id, type, order, content: { html: "" } };
    case "location":
      return { id, type, order, content: { name: "", street: "", city: "", state: "", zip: "", country: "" } };
    case "hours":
      return { id, type, order, content: { title: "Hours", schedule: [] } };
    case "faqItem":
      return { id, type, order, content: { question: "", answer: "" } };
    case "imageGallery":
      return { id, type, order, content: { images: [] } };
  }
}
