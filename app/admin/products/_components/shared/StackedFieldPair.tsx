"use client";

import { ReactNode } from "react";

interface StackedFieldPairProps {
  children: ReactNode;
  className?: string;
}

/**
 * Reusable component that stacks children vertically on mobile,
 * side-by-side on desktop. Based on the merch details InputGroup pattern.
 */
export function StackedFieldPair({ children, className }: StackedFieldPairProps) {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 ${className ?? ""}`}>
      {children}
    </div>
  );
}
