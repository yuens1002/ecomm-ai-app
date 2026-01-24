"use client";

import { useState, useEffect } from "react";
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
import { Kbd } from "@/components/ui/kbd";
import { ConciergeBell } from "lucide-react";
import { HELP_CONTENT } from "../../../constants/help-content";
import type { ViewType } from "../../../types/builder-state";

type HelpPopoverButtonProps = {
  currentView: ViewType;
};

export function HelpPopoverButton({ currentView }: HelpPopoverButtonProps) {
  const [open, setOpen] = useState(false);
  const content = HELP_CONTENT[currentView];

  // Listen for keyboard shortcut event
  useEffect(() => {
    const handleToggleHelp = () => setOpen((prev) => !prev);
    window.addEventListener("menu-builder:toggle-help", handleToggleHelp);
    return () => window.removeEventListener("menu-builder:toggle-help", handleToggleHelp);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
          <div className="flex items-center gap-2">
            Help
            <Kbd>?</Kbd>
          </div>
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
