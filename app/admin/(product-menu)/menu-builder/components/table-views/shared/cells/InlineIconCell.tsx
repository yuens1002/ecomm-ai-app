"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, CircleHelp } from "lucide-react";
import {
  DynamicIcon,
  getAvailableIcons,
  COMMON_PAGE_ICONS,
} from "@/components/app-components/DynamicIcon";
import { cn } from "@/lib/utils";
import * as React from "react";
import { useMemo, useState } from "react";

type InlineIconCellProps = {
  id: string;
  icon: string | null;
  onSave: (id: string, icon: string | null) => Promise<void>;
  isRowHovered?: boolean;
};

/**
 * InlineIconCell - Hover-to-edit icon cell for table views
 *
 * Responsive behavior:
 * - xs-sm: Trigger always visible (touch-friendly)
 * - md+: Trigger visible on row hover only
 *
 * When no icon: shows placeholder, trigger is [?] button
 * When has icon: shows icon, icon becomes trigger button on hover
 */
export function InlineIconCell({ id, icon, onSave, isRowHovered }: InlineIconCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const formatIconName = (name: string) => {
    return name.replace(/([A-Z])/g, " $1").trim();
  };

  const allIcons = useMemo(() => getAvailableIcons(), []);
  const filteredIcons = useMemo(() => {
    if (!iconSearch) return COMMON_PAGE_ICONS;
    const search = iconSearch.toLowerCase();
    return allIcons.filter(
      (iconName) =>
        iconName.toLowerCase().includes(search) ||
        formatIconName(iconName).toLowerCase().includes(search)
    );
  }, [iconSearch, allIcons]);

  const handleSelect = async (selectedIcon: string | null) => {
    setIsLoading(true);
    try {
      await onSave(id, selectedIcon);
    } finally {
      setIsLoading(false);
      setIconSearch("");
      setIsOpen(false);
    }
  };

  // Determine visibility of trigger based on breakpoint and hover state
  // xs-sm: always visible; md+: visible on hover or when popover is open
  const showTrigger = isRowHovered || isOpen;

  return (
    <div className="flex items-center justify-center w-4 h-4" data-row-click-ignore>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {icon ? (
            // Has icon: show icon, becomes button on hover (md+) or always (xs-sm)
            <button
              type="button"
              disabled={isLoading}
              className={cn(
                "w-4 h-4 flex items-center justify-center rounded transition-opacity",
                // xs-sm: always show as interactive
                "opacity-100",
                // md+: show as static icon unless hovered/open
                showTrigger
                  ? "md:opacity-100 md:hover:bg-accent md:cursor-pointer"
                  : "md:cursor-default"
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (showTrigger || window.innerWidth < 768) {
                  setIsOpen(true);
                }
              }}
            >
              <DynamicIcon name={icon} size={16} />
            </button>
          ) : (
            // No icon: show placeholder or [?] trigger
            <div className="w-4 h-4 flex items-center justify-center">
              {/* xs-sm: always show trigger; md+: show on hover */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isLoading}
                className={cn(
                  "w-4 h-4 p-0 rounded",
                  // xs-sm: always visible
                  "flex",
                  // md+: hidden unless hovered/open
                  showTrigger ? "md:flex" : "md:hidden"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(true);
                }}
              >
                <CircleHelp className="w-4 h-4 text-muted-foreground" />
              </Button>
              {/* md+ placeholder when not hovered */}
              {!showTrigger && <span className="hidden md:block w-4 h-4" />}
            </div>
          )}
        </PopoverTrigger>
        <PopoverContent className="p-0 w-64" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search icons..."
              value={iconSearch}
              onValueChange={setIconSearch}
            />
            <CommandEmpty>No icon found.</CommandEmpty>
            <CommandList>
              <CommandGroup>
                <CommandItem
                  value="none"
                  onSelect={() => handleSelect(null)}
                  disabled={isLoading}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      !icon ? "opacity-100" : "opacity-0"
                    )}
                  />
                  None
                </CommandItem>
                {filteredIcons.slice(0, 50).map((iconName: string) => (
                  <CommandItem
                    key={iconName}
                    value={iconName}
                    onSelect={() => handleSelect(iconName)}
                    disabled={isLoading}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        icon === iconName ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <DynamicIcon name={iconName} size={16} className="mr-2" />
                    {formatIconName(iconName)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
