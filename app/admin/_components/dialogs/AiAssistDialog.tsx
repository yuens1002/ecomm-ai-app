"use client";

import { ReactNode } from "react";
import { BlockDialog } from "@/app/admin/_components/cms/blocks/BlockDialog";
import { cn } from "@/lib/utils";

interface AiAssistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function AiAssistDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
}: AiAssistDialogProps) {
  return (
    <BlockDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="xl"
      footer={footer}
    >
      <div
        className={cn(
          "max-h-[70vh] overflow-auto pr-1 space-y-4",
          className,
          contentClassName
        )}
      >
        {children}
      </div>
    </BlockDialog>
  );
}
