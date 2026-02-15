"use client";

import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import FeaturedProducts from "@/app/(site)/_components/product/FeaturedProducts";
import RecommendationsSection from "@/app/(site)/_components/product/RecommendationsSection";

const ChatBarista = dynamic(
  () => import("@/app/(site)/_components/ai/ChatBarista"),
  { ssr: false }
);
const VoiceBarista = dynamic(
  () => import("@/app/(site)/_components/ai/VoiceBarista"),
  { ssr: false }
);

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

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
      <motion.div {...fadeInUp}>
        {showVoiceBarista ? (
          <VoiceBarista userEmail={session?.user?.email || undefined} />
        ) : (
          <ChatBarista
            userName={session?.user?.name || undefined}
            isAuthenticated={isAuthenticated}
          />
        )}
      </motion.div>

      {/* Personalized Recommendations Section */}
      <RecommendationsSection />

      {/* Product Grid Section */}
      <FeaturedProducts />
    </>
  );
}
