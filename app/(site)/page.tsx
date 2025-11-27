"use client";

import { useSession } from "next-auth/react";
import FeaturedProducts from "@components/app-components/FeaturedProducts";
import RecommendationsSection from "@components/app-components/RecommendationsSection";
import ChatBarista from "@components/app-components/ChatBarista";
import VoiceBarista from "@components/app-components/VoiceBarista";

// --- Main Page Component ---
export default function Home() {
  const { data: session } = useSession();

  // Show VoiceBarista for demo user, ChatBarista for everyone else
  const isDemoUser = session?.user?.email === "demo@artisanroast.com";
  const isAuthenticated = !!session?.user;

  return (
    <>
      {/* Voice Barista for demo user, Chat Barista for all others */}
      {isDemoUser ? (
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
