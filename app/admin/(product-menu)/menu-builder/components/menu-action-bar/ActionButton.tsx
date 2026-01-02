"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import type { LucideIcon } from "lucide-react";

type ActionButtonProps = {
  icon: LucideIcon;
  label: string;
  tooltip: string;
  kbd?: string[];
  disabled?: boolean;
  ariaLabel?: string;
  onClick: () => void;
};

export function ActionButton({
  icon: Icon,
  label: _label,
  tooltip,
  kbd = [],
  disabled = false,
  ariaLabel,
  onClick,
}: ActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-disabled={disabled}
          onClick={disabled ? undefined : onClick}
          aria-label={ariaLabel || tooltip}
          className={
            disabled ? "text-muted-foreground pointer-events-none" : ""
          }
          tabIndex={0}
        >
          <Icon className="size-4" />
        </Button>
      </TooltipTrigger>
      {!disabled && (
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
      )}
    </Tooltip>
  );
}
