"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ActionDropdownButtonProps = {
  icon: LucideIcon;
  label: string;
  tooltip: string;
  kbd?: string[];
  disabled?: boolean;
  ariaLabel?: string;
  dropdownContent: React.ReactNode;
};

export function ActionDropdownButton({
  icon: Icon,
  label,
  tooltip,
  kbd = [],
  disabled = false,
  ariaLabel,
  dropdownContent,
}: ActionDropdownButtonProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (disabled) {
    // Render as a plain disabled button when disabled
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            aria-label={ariaLabel || tooltip}
            className="cursor-not-allowed"
          >
            <Icon className="size-4 mr-2" />
            {label}
            <ChevronDown className="size-3 ml-1" />
          </Button>
        </TooltipTrigger>
      </Tooltip>
    );
  }

  return (
    <DropdownMenu modal={false} open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <Tooltip open={isDropdownOpen ? false : undefined}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" aria-label={ariaLabel || tooltip}>
              <Icon className="size-4 mr-2" />
              {label}
              <ChevronDown className="size-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {kbd.length > 0 ? (
            <div className="flex items-center gap-2">
              {tooltip}
              {kbd.length === 1 ? (
                <Kbd>{kbd[0]}</Kbd>
              ) : (
                <KbdGroup>
                  {kbd.map((key) => (
                    <Kbd key={key}>{key}</Kbd>
                  ))}
                </KbdGroup>
              )}
            </div>
          ) : (
            <span>{tooltip}</span>
          )}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="end"
        className="w-[300px]"
        onCloseAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => {
          // Stop the click from propagating to underlying elements (like table rows)
          e.detail.originalEvent.stopPropagation();
        }}
      >
        {dropdownContent}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
