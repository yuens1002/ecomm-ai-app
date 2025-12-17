"use client";

import React from "react";
import clsx from "clsx";

type PageWidth = "full" | string | undefined;

interface PageContainerProps {
  children: React.ReactNode;
  /**
   * Optional page width override.
   * - Omit to use the default site container
   * - "full" to allow full-width content
   * - Any Tailwind class string to fully customize
   */
  pageWidth?: PageWidth;
  className?: string;
}

const DEFAULT_CONTAINER = "mx-auto max-w-screen-2xl px-4 sm:px-8 py-8";

export function PageContainer({
  children,
  pageWidth,
  className,
}: PageContainerProps) {
  const containerClasses =
    pageWidth === "full"
      ? "w-full"
      : typeof pageWidth === "string" && pageWidth
        ? pageWidth
        : DEFAULT_CONTAINER;

  return <div className={clsx(containerClasses, className)}>{children}</div>;
}

export default PageContainer;
