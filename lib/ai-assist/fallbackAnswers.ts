import { WizardAnswers } from "@/lib/api-schemas/generate-about";

export const buildAiFallbackAnswers = (pageTitle: string): WizardAnswers => ({
  businessName: pageTitle || "",
  foundingStory:
    "Our team started roasting to share vibrant, origin-forward coffees with our community.",
  uniqueApproach:
    "Small-batch roasting with meticulous profiles to highlight sweetness and clarity.",
  coffeeSourcing:
    "Long-term relationships with trusted importers and producers across Central and East Africa.",
  roastingPhilosophy: "Light roasts to highlight origin characteristics",
  targetAudience:
    "Coffee enthusiasts who appreciate traceable, thoughtfully roasted single origins and blends.",
  brandPersonality: "friendly",
  keyValues:
    "Quality, transparency, community, sustainability, and hospitality.",
  communityRole:
    "We host public cuppings, donate to local food programs, and collaborate with neighborhood makers.",
  futureVision:
    "Grow responsible sourcing partnerships and open more educational community events.",
  heroImageUrl: null,
  heroImageDescription: null,
  previousHeroImageUrl: null,
});
