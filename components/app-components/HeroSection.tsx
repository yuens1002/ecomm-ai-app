"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import VoiceBarista from "@components/app-components/VoiceBarista";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onOpenAiModal: () => void;
}

export default function HeroSection({ onOpenAiModal }: HeroSectionProps) {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Avoid hydration mismatch
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Show loading state during hydration
  if (!mounted) {
    return (
      <header className="bg-hero-bg text-hero-text">
        <div className="container mx-auto px-4 md:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Discover Your Perfect Roast
          </h1>
          <p className="text-lg md:text-xl text-hero-text opacity-90 mb-8">
            Specialty coffee sourced from the world&apos;s finest origins.
          </p>
          <Button size="lg" className="font-bold text-lg shadow-md" disabled>
            Loading...
          </Button>
        </div>
      </header>
    );
  }

  // Show VoiceBarista only for demo@artisanroast.com
  if (
    status === "authenticated" &&
    session?.user?.email === "demo@artisanroast.com"
  ) {
    return (
      <VoiceBarista
        userName={session.user?.name || undefined}
        userEmail={session.user?.email || undefined}
        onOpenAiModal={onOpenAiModal}
      />
    );
  }

  // Show traditional hero for guests and loading
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
