"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type DialogSize = "sm" | "md" | "lg" | "xl";

interface BlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: DialogSize;
  children: ReactNode;
  footer?: ReactNode;
}

const sizeClasses: Record<DialogSize, string> = {
  sm: "max-w-lg",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
};

/**
 * Reusable dialog shell for all block editors.
 * Handles only UI presentation concerns:
 * - Open/close state
 * - Dialog dimensions (size prop)
 * - Header with title/description
 * - Scrollable content area
 * - Footer slot for action buttons
 */
export function BlockDialog({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  children,
  footer,
}: BlockDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${sizeClasses[size]} max-h-[90vh] flex flex-col p-0`}
      >
        <DialogHeader className="px-6 pt-6 pb-0 pr-12 shrink-0">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>

        {footer && (
          <div className="flex justify-end gap-2 px-6 pb-6 pt-2 shrink-0">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
