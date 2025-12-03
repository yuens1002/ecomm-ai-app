"use client";

import { forwardRef, ReactNode } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageCardProps {
  /** Index of this card in the list */
  index: number;
  /** Total number of items in the list */
  total: number;
  /** Label prefix for the card header (e.g., "Image", "Slide") */
  label?: string;
  /** Additional info to show after the label */
  labelSuffix?: ReactNode;
  /** Whether this card is highlighted (newly added) */
  isHighlighted?: boolean;
  /** Whether we can add more items */
  canAdd?: boolean;
  /** Whether we can delete this item */
  canDelete?: boolean;
  /** Callback when move up is clicked */
  onMoveUp?: () => void;
  /** Callback when move down is clicked */
  onMoveDown?: () => void;
  /** Callback when add is clicked (adds after this card) */
  onAdd?: () => void;
  /** Callback when delete is clicked */
  onRemove?: () => void;
  /** Card content */
  children: ReactNode;
}

/**
 * ImageCard - Reusable card component for image/slide lists
 *
 * Features:
 * - Header with position label and control buttons (↑ ↓ + 🗑️)
 * - Highlight animation for newly added items
 * - Consistent styling across all image list components
 * - Content slot for ImageField or custom content
 *
 * Usage:
 * ```tsx
 * <ImageCard
 *   index={0}
 *   total={3}
 *   label="Image"
 *   isHighlighted={highlightedIndex === 0}
 *   canAdd={images.length < maxImages}
 *   canDelete={images.length > minImages}
 *   onMoveUp={() => moveUp(0)}
 *   onMoveDown={() => moveDown(0)}
 *   onAdd={() => addAfter(0)}
 *   onRemove={() => remove(0)}
 * >
 *   <ImageField ... />
 * </ImageCard>
 * ```
 */
export const ImageCard = forwardRef<HTMLDivElement, ImageCardProps>(
  function ImageCard(
    {
      index,
      total,
      label = "Image",
      labelSuffix,
      isHighlighted = false,
      canAdd = true,
      canDelete = true,
      onMoveUp,
      onMoveDown,
      onAdd,
      onRemove,
      children,
    },
    ref
  ) {
    const isFirst = index === 0;
    const isLast = index === total - 1;

    return (
      <div
        ref={ref}
        className={`border rounded-lg p-4 pb-5 bg-card transition-shadow ${
          isHighlighted ? "animate-highlight-pulse" : ""
        }`}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">
            {label} {index + 1} of {total}
            {labelSuffix}
          </span>
          <div className="flex items-center gap-1">
            {onMoveUp && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onMoveUp}
                disabled={isFirst}
                title="Move up"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
            {onMoveDown && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onMoveDown}
                disabled={isLast}
                title="Move down"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            )}
            {onAdd && canAdd && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onAdd}
                title={`Add ${label.toLowerCase()} after this one`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={onRemove}
                disabled={!canDelete}
                title={`Remove ${label.toLowerCase()}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Card Content */}
        {children}
      </div>
    );
  }
);
