import { Hero } from "./Hero";
import type { HeroSlide } from "@/lib/site-settings";

interface HomeHeroProps {
  storeName: string;
  heroImageUrl?: string;
  heroType?: "image" | "carousel" | "video";
  heroSlides?: HeroSlide[];
  heroVideoUrl?: string;
  heroVideoPosterUrl?: string;
  heroHeading?: string;
  heroTagline?: string;
}

export function HomeHero({
  storeName,
  heroImageUrl,
  heroType = "image",
  heroSlides = [],
  heroVideoUrl,
  heroVideoPosterUrl,
  heroHeading,
  heroTagline,
}: HomeHeroProps) {
  const imageUrl =
    heroType === "image" ? (heroSlides[0]?.url ?? heroImageUrl) : undefined;

  return (
    <Hero
      heading={heroHeading || undefined}
      tagline={heroTagline}
      imageUrl={imageUrl}
      imageAlt={`${storeName} — Specialty Coffee`}
      type={heroType}
      slides={heroSlides}
      videoUrl={heroVideoUrl}
      videoPosterUrl={heroVideoPosterUrl}
    />
  );
}
