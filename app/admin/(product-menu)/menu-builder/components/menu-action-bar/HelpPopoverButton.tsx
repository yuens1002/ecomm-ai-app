"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConciergeBell } from "lucide-react";
import { HELP_CONTENT } from "../../../constants/help-content";
import type { ViewType } from "../../../types/builder-state";

type HelpPopoverButtonProps = {
  currentView: ViewType;
};

export function HelpPopoverButton({ currentView }: HelpPopoverButtonProps) {
  const content = HELP_CONTENT[currentView];

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="View help"
            >
              <ConciergeBell className="size-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <span>Help</span>
        </TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">{content.title}</h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {content.items.map((item, index) => (
              <li key={index} className="flex gap-2">
                <span className="text-muted-foreground/60">•</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
