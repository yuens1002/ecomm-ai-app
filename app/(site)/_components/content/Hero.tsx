"use client";

import Image from "next/image";
import type { HeroSlide } from "@/lib/site-settings";
import { HeroCarousel } from "./HeroCarousel";
import { VideoHero } from "./VideoHero";

interface HeroProps {
  heading?: string;
  tagline?: string;
  imageUrl?: string;
  imageAlt?: string;
  caption?: string;
  className?: string;
  type?: "image" | "carousel" | "video";
  slides?: HeroSlide[];
  videoUrl?: string;
  videoPosterUrl?: string;
}

export function Hero({
  heading,
  tagline,
  imageUrl,
  imageAlt,
  caption,
  className = "",
  type = "image",
  slides = [],
  videoUrl,
  videoPosterUrl,
}: HeroProps) {
  // Carousel mode
  if (type === "carousel" && slides.length > 0) {
    return (
      <figure className={className}>
        <HeroCarousel slides={slides} heading={heading} tagline={tagline} />
        {caption && (
          <figcaption className="text-sm text-muted-foreground text-right mt-2 pr-4 italic">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // Video mode
  if (type === "video" && videoUrl) {
    return (
      <figure className={className}>
        <VideoHero
          videoUrl={videoUrl}
          posterUrl={videoPosterUrl || undefined}
          heading={heading}
          tagline={tagline}
        />
        {caption && (
          <figcaption className="text-sm text-muted-foreground text-right mt-2 pr-4 italic">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // Image mode (default)
  return (
    <figure className={className}>
      <div className="relative h-64 w-full sm:h-48 md:h-96 lg:h-128">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt || heading || "Hero image"}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-gray-800 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        {(heading || tagline) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            {heading && (
              <h1 className="text-5xl font-bold text-white md:text-7xl">
                {heading}
              </h1>
            )}
            {tagline && (
              <p className="text-lg text-white/90 md:text-2xl">{tagline}</p>
            )}
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="text-sm text-muted-foreground text-right mt-2 pr-4 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
