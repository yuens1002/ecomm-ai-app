"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { CarouselDots } from "./CarouselDots";
import { cn } from "@/lib/utils";

interface ScrollCarouselProps {
  children: ReactNode[];
  /** Number of slides per view (e.g., 1 for full width, 2.5 for multiple slides) */
  slidesPerView?: number;
  /** Minimum width for each slide */
  minWidth?: string;
  /** Gap between slides (e.g., "1rem", "16px") */
  gap?: string;
  /** Padding for the container (e.g., "1rem") */
  padding?: string;
  /** Show navigation dots */
  showDots?: boolean;
  /** Auto-scroll enabled */
  autoScroll?: boolean;
  /** Auto-scroll interval in seconds */
  intervalSeconds?: number;
  /** Remove border/background from dots */
  noBorder?: boolean;
}

export function ScrollCarousel({
  children,
  slidesPerView = 1,
  minWidth,
  gap = "1rem",
  padding = "1rem",
  showDots = true,
  autoScroll = false,
  intervalSeconds = 5,
  noBorder = false,
}: ScrollCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const itemCount = children.length;

  // Auto-scroll logic
  useEffect(() => {
    if (!autoScroll || itemCount <= 1 || isHovered) {
      return;
    }

    autoScrollTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % itemCount);
    }, intervalSeconds * 1000);

    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
      }
    };
  }, [autoScroll, intervalSeconds, itemCount, isHovered]);

  // Scroll to current index when changed (dots clicked or auto-scroll)
  useEffect(() => {
    if (scrollContainerRef.current && itemCount > 0) {
      const container = scrollContainerRef.current;
      const slideWidth = container.scrollWidth / itemCount;
      container.scrollTo({
        left: slideWidth * currentIndex,
        behavior: "smooth",
      });
    }
  }, [currentIndex, itemCount]);

  // Update currentIndex when user manually scrolls/swipes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || itemCount <= 1) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      // Debounce to avoid updating during smooth scroll
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const slideWidth = container.scrollWidth / itemCount;
        const newIndex = Math.round(container.scrollLeft / slideWidth);
        setCurrentIndex(newIndex);
      }, 150);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(scrollTimeout);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [itemCount]);

  if (itemCount === 0) {
    return null;
  }

  // Calculate slide width based on slidesPerView
  const slideStyle = {
    width:
      slidesPerView === 1
        ? "100%"
        : `calc((100% - ${gap} * ${slidesPerView - 1}) / ${slidesPerView})`,
    minWidth: minWidth || undefined,
  };

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "flex overflow-x-auto snap-x snap-mandatory scrollbar-hide",
          slidesPerView === 1 ? "gap-0" : "gap-4 px-4"
        )}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {children.map((child, index) => (
          <div key={index} className="shrink-0 snap-start" style={slideStyle}>
            {child}
          </div>
        ))}
      </div>

      {/* Dots Navigation */}
      {showDots && (
        <div className="flex justify-center mt-10">
          <CarouselDots
            total={itemCount}
            currentIndex={currentIndex}
            onDotClick={setCurrentIndex}
            noBorder={noBorder}
          />
        </div>
      )}
    </div>
  );
}
