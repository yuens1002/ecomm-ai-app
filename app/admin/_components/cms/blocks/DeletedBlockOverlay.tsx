"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface DeletedBlockOverlayProps {
  blockId: string;
  blockName: string;
  onRestore?: (blockId: string) => void;
  children: ReactNode;
}

/**
 * Universal wrapper for deleted blocks
 * Shows grayed-out version of the block with restore button on hover
 */
export function DeletedBlockOverlay({
  blockId,
  blockName: _blockName,
  onRestore,
  children,
}: DeletedBlockOverlayProps) {
  return (
    <div className="relative group opacity-50 grayscale hover:opacity-70 transition-all">
      {/* Original block content (grayed out) */}
      <div className="select-none">{children}</div>

      {/* Big X overlay spanning full container boundary */}
      <div className="absolute inset-0 pointer-events-none">
        <svg
          className="w-full h-full text-red-500/30"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <line
            x1="0"
            y1="0"
            x2="100"
            y2="100"
            stroke="currentColor"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="100"
            y1="0"
            x2="0"
            y2="100"
            stroke="currentColor"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* Restore button - shows on hover in top right */}
      {onRestore && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onRestore?.(blockId);
            }}
            className="shadow-lg"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restore
          </Button>
        </div>
      )}
    </div>
  );
}
