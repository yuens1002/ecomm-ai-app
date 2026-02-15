"use client";

import { type ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";

export function ScrollReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 60 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated gradient backdrop for hero sections.
 * @param baseHue - Starting hue (0-360). Different values give different color schemes.
 * @param spread - Hue distance between gradient stops. Lower = more monochromatic.
 */
export function AnimatedGradient({
  baseHue = 40,
  spread = 50,
  opacity = 15,
}: {
  baseHue?: number;
  spread?: number;
  opacity?: number;
}) {
  const [position, setPosition] = useState(baseHue);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => (prev + 0.5) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const hue1 = position;
  const hue2 = (position + spread) % 360;
  const hue3 = (position + spread * 2) % 360;

  return (
    <>
      <div
        className="absolute inset-0 transition-colors duration-1000"
        style={{
          opacity: opacity / 100,
          background: `linear-gradient(to top,
            hsl(${hue1}, 95%, 35%) 0%,
            hsl(${hue2}, 90%, 50%) 40%,
            hsl(${hue3}, 85%, 70%) 75%,
            hsl(${hue3}, 80%, 85%) 100%)`,
        }}
      />
      {/* Floating light orbs — no z-index so they sit between gradient and text */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute h-96 w-96 rounded-full blur-2xl"
          animate={{
            y: [0, -30, 20, 0],
            x: [0, 20, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            opacity: 0.35,
            background:
              "radial-gradient(circle, rgba(255,255,255,0.6), transparent 70%)",
            top: "10%",
            left: "10%",
          }}
        />
        <motion.div
          className="absolute h-56 w-56 rounded-full blur-2xl"
          animate={{
            y: [0, 25, -30, 0],
            x: [0, -20, 25, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          style={{
            opacity: 0.3,
            background:
              "radial-gradient(circle, rgba(255,255,255,0.6), transparent 70%)",
            bottom: "10%",
            right: "15%",
          }}
        />
        <motion.div
          className="absolute h-32 w-32 rounded-full blur-xl"
          animate={{
            y: [0, -20, 15, 0],
            x: [0, 25, -15, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          style={{
            opacity: 0.25,
            background:
              "radial-gradient(circle, rgba(255,255,255,0.6), transparent 70%)",
            top: "40%",
            left: "50%",
          }}
        />
      </div>
    </>
  );
}

export function HorizonReveal({
  children,
  className,
  staggerDelay = 0.12,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <div className="relative">
      {/* Horizon backdrop */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-amber-950/[0.06] via-orange-900/[0.03] to-transparent dark:from-amber-400/[0.04] dark:via-orange-400/[0.02]" />
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: staggerDelay } },
        }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function HorizonItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 80, scale: 0.95 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
