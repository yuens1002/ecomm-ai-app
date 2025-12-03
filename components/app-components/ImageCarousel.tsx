"use client";

import { useState } from "react";
import Image from "next/image";
import { CarouselDots } from "./CarouselDots";

interface ImageCarouselProps {
  images: Array<{ url: string; alt?: string }>;
  aspectRatio?: "4/3" | "16/9" | "square";
  className?: string;
  fallbackIcon?: React.ReactNode;
  defaultAlt?: string;
}

/**
 * Reusable image carousel component
 * Displays one image at a time with dot navigation
 */
export function ImageCarousel({
  images,
  aspectRatio = "4/3",
  className = "",
  fallbackIcon,
  defaultAlt = "Image",
}: ImageCarouselProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasImages = images && images.length > 0;

  const aspectRatioClass = {
    "4/3": "aspect-4/3",
    "16/9": "aspect-video",
    square: "aspect-square",
  }[aspectRatio];

  if (!hasImages) {
    return (
      <div
        className={`${aspectRatioClass} rounded-lg bg-muted flex items-center justify-center ${className}`}
      >
        {fallbackIcon}
      </div>
    );
  }

  return (
    <div
      className={`relative ${aspectRatioClass} rounded-lg overflow-hidden ${className}`}
    >
      <Image
        src={images[currentImageIndex].url}
        alt={images[currentImageIndex].alt || defaultAlt}
        fill
        className="object-cover"
      />

      {/* Image navigation dots */}
      {images.length > 1 && (
        <CarouselDots
          total={images.length}
          currentIndex={currentImageIndex}
          onDotClick={(index) => setCurrentImageIndex(index)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2"
        />
      )}
    </div>
  );
}
