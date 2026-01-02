"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
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

type ActionComboButtonProps = {
  newButton: {
    icon: LucideIcon;
    label: string;
    tooltip: string;
    kbd?: string[];
    disabled?: boolean;
    ariaLabel?: string;
    onClick: () => void;
  };
  addButton: {
    label: string;
    tooltip: string;
    disabled?: boolean;
    dropdownContent: React.ReactNode;
  };
};

export function ActionComboButton({
  newButton,
  addButton,
}: ActionComboButtonProps) {
  const NewIcon = newButton.icon;

  return (
    <ButtonGroup>
      {/* NEW button - outlined */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            aria-disabled={newButton.disabled}
            onClick={newButton.disabled ? undefined : newButton.onClick}
            aria-label={newButton.ariaLabel || newButton.tooltip}
            className={
              newButton.disabled
                ? "text-muted-foreground pointer-events-none"
                : ""
            }
            tabIndex={0}
          >
            <NewIcon className="size-4 mr-2" />
            {newButton.label}
          </Button>
        </TooltipTrigger>
        {!newButton.disabled && newButton.kbd && newButton.kbd.length > 0 && (
          <TooltipContent>
            <div className="flex items-center gap-2">
              {newButton.tooltip}
              {newButton.kbd.length === 1 ? (
                <Kbd>{newButton.kbd[0]}</Kbd>
              ) : (
                <KbdGroup>
                  {newButton.kbd.map((key) => (
                    <Kbd key={key}>{key}</Kbd>
                  ))}
                </KbdGroup>
              )}
            </div>
          </TooltipContent>
        )}
      </Tooltip>

      {/* ADD dropdown - icon only with chevron */}
      {addButton.disabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={addButton.disabled}
              aria-label={addButton.tooltip}
              className="text-muted-foreground"
            >
              <ChevronDown className="size-4" />
            </Button>
          </TooltipTrigger>
        </Tooltip>
      ) : (
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={addButton.tooltip}
                >
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <span>{addButton.tooltip}</span>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" className="w-[300px]">
            {addButton.dropdownContent}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </ButtonGroup>
  );
}
