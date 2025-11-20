"use client";

import { useState } from "react";
import FeaturedProducts from "@components/app-components/FeaturedProducts";
import RecommendationsSection from "@components/app-components/RecommendationsSection";
import HeroSection from "@components/app-components/HeroSection";
import AiHelperModal from "@components/app-components/AiHelperModal";

// --- Main Page Component ---
export default function Home() {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  return (
    <>
      {/* Hero Section - receives modal handler */}
      <HeroSection onOpenAiModal={() => setIsAiModalOpen(true)} />

      {/* Personalized Recommendations Section */}
      <RecommendationsSection />

      {/* Product Grid Section */}
      <FeaturedProducts />

      {/* AI Helper Modal - centralized at page level */}
      <AiHelperModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </>
  );
}
