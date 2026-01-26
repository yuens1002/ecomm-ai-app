"use client";

import { Badge } from "@/components/ui/badge";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import type { GroupedEntitiesGhostProps } from "../../../../../types/dnd";

/**
 * Ghost element for grouped entity drag operations.
 *
 * Renders the primary item's content with a badge showing the count
 * when dragging multiple items. Uses a portal to render off-screen
 * for use as a drag image.
 *
 * @example
 * ```tsx
 * {actionableRoots.length > 1 && firstSelectedItem && (
 *   <GroupedEntitiesGhost count={actionableRoots.length}>
 *     <GhostRowContent name={firstSelectedItem.name} />
 *   </GroupedEntitiesGhost>
 * )}
 * ```
 */
const DEFAULT_GHOST_ID = "grouped-entities-ghost";

export function GroupedEntitiesGhost({ count, children, ghostId = DEFAULT_GHOST_ID }: GroupedEntitiesGhostProps) {
  const [mounted, setMounted] = useState(false);

  // Only render portal after mount (SSR safety)
  // This is a valid pattern - the effect runs once on mount to enable client-only rendering
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      id={ghostId}
      style={{
        position: "absolute",
        top: -9999,
        left: -9999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          opacity: 0.9,
          backgroundColor: "var(--background)",
          borderRadius: "var(--radius)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          padding: "8px 12px",
          minWidth: "150px",
        }}
      >
        {children}
        {count > 1 && (
          <Badge
            variant="default"
            className="absolute -top-2 -right-2 min-w-5 h-5 px-1.5 text-xs font-semibold"
          >
            {count}
          </Badge>
        )}
      </div>
    </div>,
    document.body
  );
}

/**
 * Simple ghost content for displaying a row name during drag.
 *
 * Use this when you just need to show the item name in the ghost.
 */
export function GhostRowContent({
  icon,
  name,
}: {
  icon?: React.ReactNode;
  name: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="font-medium truncate max-w-[200px]">{name}</span>
    </div>
  );
}
