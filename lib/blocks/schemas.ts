import { z } from "zod";

/**
 * Block System Schemas
 *
 * Defines all block types with Zod validation.
 * TypeScript types are inferred from these schemas.
 */

// Base schema for all blocks
const baseBlockSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().min(0),
  isDeleted: z.boolean().optional().default(false),
  originalContent: z.any().optional(), // Store AI-generated content for regeneration
  layoutColumn: z.enum(["full", "left", "right"]).optional().default("full"), // Layout positioning
});

// Hero block - main page header with image
export const heroBlockSchema = baseBlockSchema.extend({
  type: z.literal("hero"),
  content: z.object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(100, "Title must be 100 characters or less"),
    imageUrl: z.string().min(1, "Image URL is required"),
    imageAlt: z.string().max(200).optional(),
    caption: z.string().max(500).optional(),
  }),
});

// Stat block - single statistic display
export const statBlockSchema = baseBlockSchema.extend({
  type: z.literal("stat"),
  content: z.object({
    label: z
      .string()
      .trim()
      .min(1, "Label is required")
      .max(50, "Label must be 50 characters or less"),
    value: z
      .string()
      .trim()
      .min(1, "Value is required")
      .max(50, "Value must be 50 characters or less"),
  }),
});

// Pull quote block - highlighted quote
export const pullQuoteBlockSchema = baseBlockSchema.extend({
  type: z.literal("pullQuote"),
  content: z.object({
    text: z
      .string()
      .min(1, "Quote text is required")
      .max(500, "Quote must be 500 characters or less"),
    author: z.string().max(100).optional(),
  }),
});

// Rich text block - formatted content
export const richTextBlockSchema = baseBlockSchema.extend({
  type: z.literal("richText"),
  content: z.object({
    html: z.string().trim().min(1, "Content is required"),
  }),
});

// Location block - physical address (for Cafe page)
export const locationBlockSchema = baseBlockSchema.extend({
  type: z.literal("location"),
  content: z.object({
    name: z
      .string()
      .min(1, "Location name is required")
      .max(100, "Name must be 100 characters or less"),
    address: z
      .string()
      .min(1, "Address is required")
      .max(500, "Address must be 500 characters or less"),
    googleMapsUrl: z.string().optional(),
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
    question: z.string().max(200),
    answer: z.string().max(2000),
  }),
});

// Image gallery block - multiple images
export const imageGalleryBlockSchema = baseBlockSchema.extend({
  type: z.literal("imageGallery"),
  content: z.object({
    images: z
      .array(
        z.object({
          url: z.string(),
          alt: z.string().max(200),
          caption: z.string().max(200).optional(),
        })
      )
      .max(12),
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

// Block type constants for safe usage
export const BLOCK_TYPES = {
  HERO: "hero",
  STAT: "stat",
  PULL_QUOTE: "pullQuote",
  RICH_TEXT: "richText",
  LOCATION: "location",
  HOURS: "hours",
  FAQ_ITEM: "faqItem",
  IMAGE_GALLERY: "imageGallery",
} as const;

// Block metadata for UI labels and descriptions
export const BLOCK_METADATA: Record<
  BlockType,
  { name: string; description: string }
> = {
  hero: {
    name: "Hero",
    description: "Main header with image and title",
  },
  stat: {
    name: "Statistic",
    description: "Display a key metric or number",
  },
  pullQuote: {
    name: "Pull Quote",
    description: "Highlight an important quote",
  },
  richText: {
    name: "Content",
    description: "Add formatted text and content",
  },
  location: {
    name: "Location",
    description: "Physical address and map link",
  },
  hours: {
    name: "Hours",
    description: "Business operating hours",
  },
  faqItem: {
    name: "FAQ Item",
    description: "Question and answer pair",
  },
  imageGallery: {
    name: "Image Gallery",
    description: "Collection of images",
  },
};

// Helper to create new blocks with defaults
export function createBlock(type: BlockType, order: number): Block {
  // Generate a unique ID
  const id = `block_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const baseBlock = {
    id,
    order,
    isDeleted: false,
    layoutColumn: "full" as const,
  };

  switch (type) {
    case "hero":
      return {
        ...baseBlock,
        type,
        content: {
          title: "Add your title here",
          imageUrl: "/placeholder-hero.jpg",
          imageAlt: "Hero image",
          caption: "",
        },
      };
    case "stat":
      return {
        ...baseBlock,
        type,
        content: {
          label: "Click to edit",
          value: "0",
        },
      };
    case "pullQuote":
      return {
        ...baseBlock,
        type,
        content: {
          text: "Click to add your quote here",
        },
      };
    case "richText":
      return {
        ...baseBlock,
        type,
        content: {
          html: "<p>Click to edit this content block. Add your text here.</p>",
        },
      };
    case "location":
      return {
        ...baseBlock,
        type,
        content: {
          name: "Location Name",
          address: "Click to edit address",
          googleMapsUrl: "",
        },
      };
    case "hours":
      return {
        ...baseBlock,
        type,
        content: {
          title: "Hours",
          schedule: [
            { day: "Monday - Friday", hours: "Click to edit" },
            { day: "Saturday - Sunday", hours: "Click to edit" },
          ],
        },
      };
    case "faqItem":
      return {
        ...baseBlock,
        type,
        content: {
          question: "Click to add your question",
          answer: "Click to add your answer",
        },
      };
    case "imageGallery":
      return {
        ...baseBlock,
        type,
        content: {
          images: [],
        },
      };
  }
}
