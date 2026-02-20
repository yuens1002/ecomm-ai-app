"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDown, Filter, MoreHorizontal } from "lucide-react";
import { useRef, useState, type ComponentType } from "react";

import type {
  ActiveFilter,
  ComparisonOperator,
  FilterConfig,
} from "./types";

// --- Filter renderer registry ---

interface FilterRendererProps {
  config: FilterConfig;
  filter: ActiveFilter;
  onFilterChange: (filter: ActiveFilter | null) => void;
}

const OPERATORS: ComparisonOperator[] = [">", "<", "\u2265", "\u2264"];

function ComparisonFilterContent({
  config: _config,
  filter,
  onFilterChange,
}: FilterRendererProps) {
  const [pendingValue, setPendingValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOperatorSelect = (op: ComparisonOperator) => {
    const newFilter = { ...filter, operator: op };
    onFilterChange(newFilter);
    if (pendingValue) {
      const num = Number(pendingValue);
      if (!isNaN(num)) {
        onFilterChange({ ...newFilter, value: num });
      }
    }
  };

  const handleSubmit = (inputValue: string) => {
    const num = Number(inputValue);
    if (inputValue === "" || isNaN(num)) {
      onFilterChange({ ...filter, value: "" });
    } else {
      onFilterChange({ ...filter, value: num });
    }
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <InputGroupButton size="xs" variant="secondary">
            {filter.operator || ">"}
          </InputGroupButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {OPERATORS.map((op) => (
            <DropdownMenuItem
              key={op}
              onClick={() => handleOperatorSelect(op)}
            >
              {op}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <InputGroupInput
        ref={inputRef}
        type="number"
        placeholder="value..."
        value={pendingValue}
        onChange={(e) => setPendingValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit(pendingValue);
        }}
        onBlur={() => handleSubmit(pendingValue)}
      />
    </>
  );
}

function MultiSelectFilterContent({
  config,
  filter,
  onFilterChange,
}: FilterRendererProps) {
  const selectedValues = (filter.value as string[]) || [];

  const handleToggle = (categoryValue: string) => {
    const next = selectedValues.includes(categoryValue)
      ? selectedValues.filter((v) => v !== categoryValue)
      : [...selectedValues, categoryValue];
    onFilterChange({ ...filter, value: next });
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex-1 flex items-center justify-between gap-1 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground truncate"
          >
            <span className="truncate">
              {selectedValues.length === 0
                ? "Select..."
                : `${selectedValues.length} selected`}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
            {config.options?.map((opt) => (
              <Label
                key={opt.value}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm font-normal"
              >
                <Checkbox
                  checked={selectedValues.includes(opt.value)}
                  onCheckedChange={() => handleToggle(opt.value)}
                />
                {opt.label}
              </Label>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}

const FILTER_RENDERERS: Record<string, ComponentType<FilterRendererProps>> = {
  comparison: ComparisonFilterContent,
  multiSelect: MultiSelectFilterContent,
};

// --- Main DataTableFilter ---

interface DataTableFilterProps {
  configs: FilterConfig[];
  activeFilter: ActiveFilter | null;
  onFilterChange: (filter: ActiveFilter | null) => void;
  className?: string;
}

export function DataTableFilter({
  configs,
  activeFilter,
  onFilterChange,
  className,
}: DataTableFilterProps) {
  const activeConfig = activeFilter
    ? configs.find((c) => c.id === activeFilter.configId)
    : null;

  const handleTypeSelect = (configId: string | null) => {
    if (!configId) {
      onFilterChange(null);
      return;
    }
    const config = configs.find((c) => c.id === configId);
    if (!config) return;

    if (config.filterType === "comparison") {
      onFilterChange({ configId, operator: ">", value: "" });
    } else {
      onFilterChange({ configId, value: [] });
    }
  };

  const typeSelector = (
    <InputGroupAddon align="inline-end">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <InputGroupButton size="icon-xs">
            <MoreHorizontal />
          </InputGroupButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleTypeSelect(null)}>
            None
          </DropdownMenuItem>
          {configs.map((c) => (
            <DropdownMenuItem
              key={c.id}
              onClick={() => handleTypeSelect(c.id)}
            >
              {c.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </InputGroupAddon>
  );

  if (!activeFilter || !activeConfig) {
    return (
      <InputGroup className={className}>
        <InputGroupAddon align="inline-start">
          <Filter />
        </InputGroupAddon>
        <span className="flex-1 font-mono italic text-muted-foreground px-3 py-1.5 text-sm">
          none
        </span>
        {typeSelector}
      </InputGroup>
    );
  }

  const ContentRenderer = FILTER_RENDERERS[activeConfig.filterType];

  return (
    <InputGroup className={className}>
      <InputGroupAddon align="inline-start">
        <Filter />
      </InputGroupAddon>
      <span className="font-mono italic text-muted-foreground px-2 py-1.5 text-sm whitespace-nowrap">
        {activeConfig.shellLabel ?? activeConfig.label.toLowerCase()}
      </span>
      <ContentRenderer
        config={activeConfig}
        filter={activeFilter}
        onFilterChange={onFilterChange}
      />
      {typeSelector}
    </InputGroup>
  );
}
