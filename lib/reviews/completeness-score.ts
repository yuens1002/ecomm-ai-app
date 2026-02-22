// Completeness heuristic scoring for brew report reviews
// Score ranges 0-1, with higher scores indicating more detailed reviews

interface CompletenessInput {
  content: string;
  title?: string | null;
  rating: number;
  brewMethod?: string | null;
  tastingNotes?: string[];
  grindSize?: string | null;
  waterTempF?: number | null;
  ratio?: string | null;
}

// Weight distribution (sums to 1.0)
const WEIGHTS = {
  contentLength: 0.35,
  brewMethod: 0.2,
  tastingNotes: 0.15,
  technicalData: 0.15,
  title: 0.1,
  rating: 0.05,
};

function contentLengthScore(content: string): number {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 15) return 0;
  if (wordCount >= 80) return 1;
  // Linear interpolation between 15 and 80 words
  return (wordCount - 15) / (80 - 15);
}

export function calculateCompletenessScore(input: CompletenessInput): number {
  let score = 0;

  // Content word count (0.35)
  score += WEIGHTS.contentLength * contentLengthScore(input.content);

  // Brew method (0.20)
  if (input.brewMethod) {
    score += WEIGHTS.brewMethod;
  }

  // Tasting notes (0.15) — at least 1 note
  if (input.tastingNotes && input.tastingNotes.length > 0) {
    score += WEIGHTS.tastingNotes;
  }

  // Technical data (0.15) — any of grindSize, waterTempF, ratio
  if (input.grindSize || input.waterTempF || input.ratio) {
    score += WEIGHTS.technicalData;
  }

  // Title (0.10)
  if (input.title && input.title.trim().length > 0) {
    score += WEIGHTS.title;
  }

  // Rating (0.05) — always present when submitting
  if (input.rating > 0) {
    score += WEIGHTS.rating;
  }

  return Math.round(score * 100) / 100;
}
