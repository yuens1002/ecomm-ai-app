"use client";

import { useState } from "react";
// --- UPDATED IMPORTS ---
import FeaturedProducts from "@components/app-components/FeaturedProducts"; // Use new alias
import AiHelperModal from "@components/app-components/AiHelperModal"; // Use new alias
import RecommendationsSection from "@components/app-components/RecommendationsSection";
import { Button } from "@/components/ui/button"; // shadcn/ui path remains the same

// --- Main Page Component ---
export default function Home() {
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  return (
    <>
      {/* Hero Section */}
      <header className="bg-hero-bg text-hero-text">
        <div className="container mx-auto px-4 md:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Discover Your Perfect Roast
          </h1>
          <p className="text-lg md:text-xl text-hero-text opacity-90 mb-8">
            Specialty coffee sourced from the world's finest origins.
          </p>
          <Button
            onClick={() => setIsAiModalOpen(true)}
            size="lg"
            className="font-bold text-lg shadow-md"
          >
            Get an AI Recommendation
          </Button>
        </div>
      </header>

      {/* Personalized Recommendations Section */}
      <RecommendationsSection />

      {/* Product Grid Section - Now a single component! */}
      <FeaturedProducts />

      {/* AI Helper Modal */}
      <AiHelperModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </>
  );
}
