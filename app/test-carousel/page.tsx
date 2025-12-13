"use client";

import React from "react";
import useEmblaCarousel from "embla-carousel-react";

export default function TestCarouselPage() {
  const [emblaRef] = useEmblaCarousel({ loop: false });

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Minimal Embla Test</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Try dragging with mouse or swiping on mobile
      </p>

      <div className="overflow-hidden border-2 border-red-500" ref={emblaRef}>
        <div className="flex">
          {[1, 2, 3, 4, 5].map((num) => (
            <div
              key={num}
              className="flex-[0_0_100%] min-w-0 h-64 flex items-center justify-center text-4xl font-bold"
              style={{ background: `hsl(${num * 60}, 70%, 60%)` }}
            >
              Slide {num}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-4 bg-muted rounded">
        <p className="text-sm">
          <strong>Desktop:</strong> Click and drag with mouse
          <br />
          <strong>Mobile:</strong> Swipe left/right with finger
        </p>
      </div>
    </div>
  );
}
