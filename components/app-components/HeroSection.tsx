"use client";

import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onOpenAiModal: () => void;
}

export default function HeroSection({ onOpenAiModal }: HeroSectionProps) {
  return (
    <header className="bg-hero-bg text-hero-text">
      <div className="container mx-auto px-4 md:px-8 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Discover Your Perfect Roast
        </h1>
        <p className="text-lg md:text-xl text-hero-text opacity-90 mb-8">
          Specialty coffee sourced from the world&apos;s finest origins.
        </p>
        <Button
          onClick={onOpenAiModal}
          size="lg"
          className="font-bold text-lg shadow-md"
        >
          Get an AI Recommendation
        </Button>
      </div>
    </header>
  );
}
