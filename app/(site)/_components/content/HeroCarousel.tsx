"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import type { HeroSlide } from "@/lib/site-settings";

interface HeroCarouselProps {
  slides: HeroSlide[];
  heading?: string;
  tagline?: string;
}

export function HeroCarousel({ slides, heading, tagline }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true }),
  ]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative h-64 w-full overflow-hidden sm:h-48 md:h-96 lg:h-128">
      {/* Embla viewport */}
      <div className="h-full overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, i) => (
            <div
              key={`${slide.url}-${i}`}
              className="relative h-full w-full shrink-0"
            >
              <Image
                src={slide.url}
                alt={slide.alt}
                fill
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-black/30" />

      {/* Heading + tagline */}
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

      {/* Dot navigation — overlaid at bottom */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-2 rounded-full transition-all ${
                i === currentIndex ? "w-6 bg-white" : "w-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
