"use client";

import React, { ReactNode, useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import WheelGesturesPlugin from "embla-carousel-wheel-gestures";
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
  wheelGestures?: boolean;
  /** When provided, overrides inline slide sizing with responsive Tailwind classes */
  slideClassName?: string;
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
  wheelGestures = true,
  slideClassName,
}: ScrollCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      containScroll: "trimSnaps",
      dragFree: false,
      slidesToScroll: 1,
    },
    [
      ...(autoplay
        ? [Autoplay({ delay: autoplayDelay, stopOnInteraction: true })]
        : []),
      ...(wheelGestures ? [WheelGesturesPlugin({ forceWheelAxis: "x" })] : []),
    ]
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

  // Reinit Embla when container resizes (responsive CSS variable slide widths)
  const hasResponsiveSlides = !!slideClassName || (!!minWidth && minWidth.includes("var("));
  useEffect(() => {
    if (!emblaApi || !hasResponsiveSlides || !containerRef.current) return;
    const ro = new ResizeObserver(() => emblaApi.reInit());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [emblaApi, hasResponsiveSlides]);

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
      <div className="overflow-hidden touch-pan-y" ref={emblaRef}>
        <div
          ref={containerRef}
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
              className={cn(
                "shrink-0",
                slideClassName
              )}
              style={
                slideClassName
                  ? undefined
                  : {
                      flex: `0 0 ${slideWidth}`,
                      minWidth: slideWidth,
                      maxWidth: slideWidth,
                      userSelect: "none",
                      WebkitUserSelect: "none",
                    }
              }
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
