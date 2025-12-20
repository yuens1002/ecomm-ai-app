"use client";

import { useState, useMemo } from "react";
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
import { ChevronsUpDown, Check } from "lucide-react";
import {
  DynamicIcon,
  getAvailableIcons,
  COMMON_PAGE_ICONS,
} from "@/components/app-components/DynamicIcon";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

/**
 * IconPicker - Reusable icon selection component
 *
 * Provides a searchable dropdown to select from 1000+ Lucide icons.
 * Shows common icons by default, filters based on search input.
 * Extracted from PageEditor custom implementation.
 *
 * @example
 * ```tsx
 * <IconPicker
 *   value={iconValue}
 *   onValueChange={setIconValue}
 *   placeholder="Pick an icon or none..."
 * />
 * ```
 */
export function IconPicker({
  value,
  onValueChange,
  placeholder = "Pick an icon or none...",
  className,
  onOpenChange,
  defaultOpen = false,
}: IconPickerProps) {
  const [iconOpen, setIconOpen] = useState(defaultOpen);
  const [iconSearch, setIconSearch] = useState("");

  // Convert PascalCase to readable format (e.g., "CircleQuestionMark" -> "Circle Question Mark")
  const formatIconName = (name: string) => {
    return name.replace(/([A-Z])/g, " $1").trim();
  };

  // Get all available icons and filter based on search
  const allIcons = useMemo(() => getAvailableIcons(), []);
  const filteredIcons = useMemo(() => {
    if (!iconSearch) return COMMON_PAGE_ICONS;
    const search = iconSearch.toLowerCase();
    return allIcons.filter(
      (icon) =>
        icon.toLowerCase().includes(search) ||
        formatIconName(icon).toLowerCase().includes(search)
    );
  }, [iconSearch, allIcons]);

  return (
    <Popover
      open={iconOpen}
      onOpenChange={(open) => {
        setIconOpen(open);
        onOpenChange?.(open);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={iconOpen}
          className={cn("justify-between bg-transparent", className)}
        >
          <div className="flex items-center gap-2 truncate">
            {value ? (
              <>
                <DynamicIcon name={value} size={16} />
                <span className="truncate">{formatIconName(value)}</span>
              </>
            ) : (
              placeholder
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
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
                onSelect={() => {
                  onValueChange("");
                  setIconSearch("");
                  setIconOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !value ? "opacity-100" : "opacity-0"
                  )}
                />
                None
              </CommandItem>
              {filteredIcons.slice(0, 50).map((iconName: string) => (
                <CommandItem
                  key={iconName}
                  value={iconName}
                  onSelect={() => {
                    onValueChange(iconName);
                    setIconSearch("");
                    setIconOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === iconName ? "opacity-100" : "opacity-0"
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
  );
}
