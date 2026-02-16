"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface CarouselDotsProps {
  total: number;
  currentIndex: number;
  onDotClick: (index: number) => void;
  className?: string;
  noBorder?: boolean;
}

export function CarouselDots({
  total,
  currentIndex,
  onDotClick,
  className,
  noBorder = false,
}: CarouselDotsProps) {
  return (
    <div
      className={cn(
        "flex gap-2",
        noBorder
          ? "px-0 py-0"
          : "bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full",
        className
      )}
    >
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className="py-5 flex items-center"
          aria-label={`Go to slide ${index + 1}`}
        >
          <motion.span
            animate={{
              width: index === currentIndex ? "2rem" : "0.5rem",
            }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className={cn(
              "h-2 rounded-full block transition-colors",
              noBorder
                ? index === currentIndex
                  ? "bg-foreground"
                  : "bg-foreground/30"
                : index === currentIndex
                  ? "bg-white"
                  : "bg-white/50"
            )}
          />
        </button>
      ))}
    </div>
  );
}
