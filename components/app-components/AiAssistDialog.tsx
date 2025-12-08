"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("sm:max-w-4xl w-full gap-4", className, contentClassName)}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="max-h-[70vh] overflow-auto pr-1 space-y-4">
          {children}
        </div>

        {footer ? <div className="pt-2">{footer}</div> : null}
      </DialogContent>
    </Dialog>
  );
}
