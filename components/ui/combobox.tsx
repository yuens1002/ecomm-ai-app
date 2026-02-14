"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxOption {
  value: string;
  label: string;
  badge?: string;
  disabled?: boolean;
}

export interface ComboboxGroup {
  heading?: string;
  options: ComboboxOption[];
}

interface ComboboxBaseProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

interface ComboboxFlatProps extends ComboboxBaseProps {
  options: ComboboxOption[];
  groups?: never;
}

interface ComboboxGroupedProps extends ComboboxBaseProps {
  options?: never;
  groups: ComboboxGroup[];
}

type ComboboxProps = ComboboxFlatProps | ComboboxGroupedProps;

export function Combobox({
  value,
  onValueChange,
  options,
  groups,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const allOptions = groups
    ? groups.flatMap((g) => g.options)
    : (options ?? []);
  const selectedOption = allOptions.find((o) => o.value === value);

  const renderItem = (option: ComboboxOption) => (
    <CommandItem
      key={option.value}
      value={option.label}
      disabled={option.disabled}
      onSelect={() => {
        if (option.disabled) return;
        onValueChange(option.value === value ? "" : option.value);
        setOpen(false);
      }}
    >
      <Check
        className={cn(
          "mr-2 h-4 w-4",
          value === option.value ? "opacity-100" : "opacity-0"
        )}
      />
      <span className="flex-1">{option.label}</span>
      {option.badge && (
        <span className="ml-2 text-xs text-muted-foreground">
          {option.badge}
        </span>
      )}
    </CommandItem>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {groups ? (
              groups.map((group, i) => (
                <CommandGroup key={group.heading ?? `group-${i}`} heading={group.heading}>
                  {group.options.map(renderItem)}
                </CommandGroup>
              ))
            ) : (
              <CommandGroup>
                {(options ?? []).map(renderItem)}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
