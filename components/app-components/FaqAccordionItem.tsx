"use client";

import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FaqAccordionItemProps {
  question: string;
  answer: string;
  className?: string;
  /** Enable interactive expand/collapse (for public view) */
  isInteractive?: boolean;
  /** Edit mode styling (for CMS editing) */
  isEditing?: boolean;
  onClick?: () => void;
  actionButtons?: ReactNode;
}

/**
 * FaqAccordionItem - Presentational component for FAQ accordion items
 *
 * Features:
 * - Collapsible question/answer display
 * - Interactive mode for public view (expand/collapse)
 * - Edit mode with hover effect and action buttons
 * - Consistent styling with other block display components
 */
export function FaqAccordionItem({
  question,
  answer,
  className = "",
  isInteractive = false,
  isEditing = false,
  onClick,
  actionButtons,
}: FaqAccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Interactive mode - full accordion functionality
  if (isInteractive) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className={`border rounded-lg ${className}`}>
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium hover:bg-muted/50 transition-colors">
            {question}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4 text-muted-foreground">
            {answer}
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  // Static/Edit mode - collapsed preview only
  const editingClasses = isEditing
    ? "relative group cursor-pointer"
    : "";

  return (
    <div className={`${editingClasses} ${className}`} onClick={onClick}>
      <Collapsible>
        <div className="border rounded-lg">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium pointer-events-none">
            {question}
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
        </div>
      </Collapsible>

      {/* Action Buttons (e.g., delete) */}
      {isEditing && actionButtons && (
        <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          {actionButtons}
        </div>
      )}
    </div>
  );
}
