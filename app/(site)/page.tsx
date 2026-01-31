"use client";

import { useSession } from "next-auth/react";
import FeaturedProducts from "@/app/(site)/_components/product/FeaturedProducts";
import RecommendationsSection from "@/app/(site)/_components/product/RecommendationsSection";
import ChatBarista from "@/app/(site)/_components/ai/ChatBarista";
import VoiceBarista from "@/app/(site)/_components/ai/VoiceBarista";

// --- Main Page Component ---
export default function Home() {
  const { data: session } = useSession();

  // Show VoiceBarista for demo user, ChatBarista for everyone else
  // In demo mode, always show ChatBarista to avoid VAPI costs
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const isDemoUser = session?.user?.email === "demo@artisanroast.com";
  const showVoiceBarista = isDemoUser && !isDemoMode;
  const isAuthenticated = !!session?.user;

  return (
    <>
      {/* Voice Barista for demo user (non-demo mode), Chat Barista for all others */}
      {showVoiceBarista ? (
        <VoiceBarista userEmail={session?.user?.email || undefined} />
      ) : (
        <ChatBarista
          userName={session?.user?.name || undefined}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Personalized Recommendations Section */}
      <RecommendationsSection />

      {/* Product Grid Section */}
      <FeaturedProducts />
    </>
  );
}
