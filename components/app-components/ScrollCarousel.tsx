"use client";

import React, { ReactNode, useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";
import { CarouselDots } from "./CarouselDots";

interface ScrollCarouselProps {
  children: ReactNode;
  slidesPerView?: number;
  showDots?: boolean;
  gap?: string;
  minWidth?: string;
  noBorder?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
}

export function ScrollCarousel({
  children,
  slidesPerView = 1,
  showDots = true,
  gap = "gap-4",
  minWidth,
  noBorder = false,
  autoplay = false,
  autoplayDelay = 4000,
}: ScrollCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      containScroll: "trimSnaps",
      dragFree: false,
      slidesToScroll: 1,
    },
    autoplay
      ? [Autoplay({ delay: autoplayDelay, stopOnInteraction: true })]
      : []
  );

  // Update current index when carousel scrolls
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Dot navigation handler
  const handleDotClick = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  // Convert children to array for mapping
  const childArray = React.Children.toArray(children);

  // Calculate consistent slide width
  const slideWidth = minWidth || `${100 / slidesPerView}%`;

  return (
    <div
      className={cn(
        "w-full",
        !noBorder && "border border-border rounded-lg overflow-hidden"
      )}
    >
      <div className="overflow-hidden touch-none" ref={emblaRef}>
        <div
          className={cn("flex", gap)}
          style={{
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
          }}
        >
          {childArray.map((child, index) => (
            <div
              key={index}
              className="shrink-0"
              style={{
                flex: `0 0 ${slideWidth}`,
                minWidth: slideWidth,
                maxWidth: slideWidth,
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {showDots && childArray.length > 1 && (
        <div className="flex justify-center p-4">
          <CarouselDots
            total={childArray.length}
            currentIndex={currentIndex}
            onDotClick={handleDotClick}
            noBorder={noBorder}
          />
        </div>
      )}
    </div>
  );
}
