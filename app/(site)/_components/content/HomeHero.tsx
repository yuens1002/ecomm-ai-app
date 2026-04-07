import { Hero } from "./Hero";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
    <section>
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
      <div className="py-8 text-center border-b bg-background">
        <p className="text-muted-foreground mb-4">
          Describe what you&apos;re looking for and we&apos;ll find it
        </p>
        <Button asChild size="lg">
          <Link href="/search">Find Your Coffee</Link>
        </Button>
      </div>
    </section>
  );
}
