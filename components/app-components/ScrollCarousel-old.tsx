"use client";

import React, { useState, useEffect, useRef, ReactNode } from "react";
import { CarouselDots } from "./CarouselDots";
import { cn } from "@/lib/utils";

interface ScrollCarouselProps {
  children: ReactNode;
  /** Number of slides per view (e.g., 1 for full width, 2.5 for multiple slides) */
  slidesPerView?: number;
  /** Minimum width for each slide */
  minWidth?: string;
  /** Gap between slides - use Tailwind class (e.g., "gap-4") or CSS value for calculations */
  gap?: string;
  /** Gap value in pixels for width calculations (defaults based on gap class) */
  gapValue?: number;
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
  gap = "gap-4",
  gapValue,
  padding = "px-4",
  showDots = true,
  autoScroll = false,
  intervalSeconds = 5,
  noBorder = false,
}: ScrollCarouselProps) {
  // Map Tailwind gap classes to pixel values for calculations
  const getGapValue = () => {
    if (gapValue !== undefined) return gapValue;
    
    // Common Tailwind gap classes to pixel values
    const gapMap: Record<string, number> = {
      "gap-0": 0,
      "gap-1": 4,
      "gap-2": 8,
      "gap-3": 12,
      "gap-4": 16,
      "gap-5": 20,
      "gap-6": 24,
      "gap-8": 32,
    };
    
    return gapMap[gap] || 16; // Default to 16px (gap-4)
  };
  
  const gapPixels = getGapValue();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const programmaticScrollRef = useRef(false);

  // Convert children to array to handle single child case
  const childrenArray = Array.isArray(children) ? children : [children];
  const itemCount = childrenArray.length;

  // Scroll to current index when changed (dots clicked)
  useEffect(() => {
    if (scrollContainerRef.current && itemCount > 0) {
      const container = scrollContainerRef.current;
      
      // Calculate the actual width of one slide
      const containerWidth = container.offsetWidth;
      const actualSlideWidth = slidesPerView === 1 
        ? containerWidth 
        : (containerWidth + gapPixels * (slidesPerView - 1)) / slidesPerView;
      
      // Mark this as a programmatic scroll
      programmaticScrollRef.current = true;
      
      container.scrollTo({
        left: actualSlideWidth * currentIndex,
        behavior: "smooth",
      });
      
      // Reset flag after scroll animation completes
      setTimeout(() => {
        programmaticScrollRef.current = false;
      }, 600); // Slightly longer than smooth scroll duration
    }
  }, [currentIndex, itemCount, slidesPerView, gapPixels]);

  // Update currentIndex when user manually scrolls/swipes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || itemCount <= 1) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      // Debounce to avoid excessive updates
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // If this is a programmatic scroll, ignore it
        if (programmaticScrollRef.current) {
          return;
        }
        
        // Calculate the actual width of one slide in the container
        const containerWidth = container.offsetWidth;
        const actualSlideWidth = slidesPerView === 1 
          ? containerWidth 
          : (containerWidth + gapPixels * (slidesPerView - 1)) / slidesPerView;
        
        // Calculate which slide is at the leading edge
        const newIndex = Math.round(container.scrollLeft / actualSlideWidth);
        setCurrentIndex(Math.max(0, Math.min(newIndex, itemCount - 1)));
      }, 150);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(scrollTimeout);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [itemCount, slidesPerView, gapPixels]);

  if (itemCount === 0) {
    return null;
  }

  // Calculate slide width based on slidesPerView
  const slideStyle = {
    width:
      slidesPerView === 1
        ? "100%"
        : `calc((100% - ${gapPixels * (slidesPerView - 1)}px) / ${slidesPerView})`,
    minWidth: minWidth || undefined,
  };

  const handleUserInteraction = () => {
    // User is physically touching/dragging - this is NOT programmatic
    programmaticScrollRef.current = false;
  };

  return (
    <div className="relative w-full">
      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "flex overflow-x-auto scrollbar-hide",
          slidesPerView === 1 ? "snap-x snap-mandatory" : "snap-x snap-proximity",
          slidesPerView === 1 ? "gap-0" : gap,
          slidesPerView === 1 ? "" : padding
        )}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollSnapType: slidesPerView === 1 ? "x mandatory" : "x proximity",
        }}
        onTouchStart={handleUserInteraction}
        onMouseDown={handleUserInteraction}
      >
        {childrenArray.map((child, index) => (
          <div 
            key={index} 
            className="shrink-0 snap-start" 
            style={{
              ...slideStyle,
              scrollSnapAlign: "start",
              scrollSnapStop: slidesPerView === 1 ? "always" : "normal",
            }}
          >
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
