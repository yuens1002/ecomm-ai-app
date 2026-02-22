"use client";

import { cn } from "@/lib/utils";
import { useCallback, useRef, useState } from "react";

interface DataTableShellProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTableShell({ children, className }: DataTableShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, scrollLeft: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    // Only drag with primary mouse button
    if (e.button !== 0) return;
    // Don't start drag on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest("button, input, a, [role=button], .cursor-col-resize")) return;

    setIsDragging(true);
    dragState.current = {
      startX: e.pageX - container.offsetLeft,
      scrollLeft: container.scrollLeft,
    };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const container = containerRef.current;
      if (!container) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = x - dragState.current.startX;
      container.scrollLeft = dragState.current.scrollLeft - walk;
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-x-auto rounded-l-lg",
        isDragging && "select-none",
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <table className={cn(
        "w-full min-w-max table-fixed caption-bottom text-sm",
        isDragging && "[&_td]:cursor-grabbing [&_th]:cursor-grabbing"
      )}>
        {children}
      </table>
    </div>
  );
}
