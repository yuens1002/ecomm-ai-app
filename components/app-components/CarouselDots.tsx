"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CarouselDotsProps {
  total: number;
  currentIndex: number;
  onDotClick: (index: number) => void;
  className?: string;
}

export function CarouselDots({
  total,
  currentIndex,
  onDotClick,
  className,
}: CarouselDotsProps) {
  return (
    <div
      className={cn(
        "flex gap-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full",
        className
      )}
    >
      {Array.from({ length: total }).map((_, index) => (
        <motion.button
          key={index}
          onClick={() => onDotClick(index)}
          animate={{
            width: index === currentIndex ? "2rem" : "0.5rem",
            backgroundColor:
              index === currentIndex
                ? "rgb(255 255 255 / 1)"
                : "rgb(255 255 255 / 0.5)",
          }}
          whileHover={{
            backgroundColor: "rgb(255 255 255 / 0.75)",
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
          className="h-2 rounded-full"
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
}
