"use client";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { DataTableFilter } from "./DataTableFilter";
import { DataTablePageSizeSelector } from "./DataTablePageSizeSelector";
import { DataTablePagination } from "./DataTablePagination";
import type {
  ActionBarConfig,
  ButtonSlot,
  CollapseConfig,
  CustomSlot,
  DataTableSlot,
  FilterSlot,
  PageSizeSelectorSlot,
  PaginationSlot,
  SearchSlot,
} from "./types";

function SearchSlotRenderer({ slot }: { slot: SearchSlot }) {
  return (
    <InputGroup className={slot.className ?? "max-w-sm"}>
      <InputGroupAddon align="inline-start">
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        placeholder={slot.placeholder}
        value={slot.value}
        onChange={(e) => slot.onChange(e.target.value)}
      />
    </InputGroup>
  );
}

function ButtonSlotRenderer({
  slot,
  forceIconOnly,
}: {
  slot: ButtonSlot;
  forceIconOnly?: boolean;
}) {
  const Icon = slot.icon;
  const isResponsiveIconOnly = slot.iconOnly === "below-lg";

  // Responsive icon-only: render icon-sm on mobile + sm with label on desktop
  if (!forceIconOnly && isResponsiveIconOnly && Icon) {
    const mobileBtn = (
      <Button size="icon-sm" variant={slot.variant} disabled={slot.disabled} className="lg:hidden" asChild={!!slot.href}>
        {slot.href ? (
          <Link href={slot.href}><Icon className="h-4 w-4" /></Link>
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </Button>
    );

    const desktopBtn = (
      <Button size="sm" variant={slot.variant} disabled={slot.disabled} className="hidden lg:inline-flex" asChild={!!slot.href}>
        {slot.href ? (
          <Link href={slot.href}><Icon className="h-4 w-4 mr-2" />{slot.label}</Link>
        ) : (
          <><Icon className="h-4 w-4 mr-2" />{slot.label}</>
        )}
      </Button>
    );

    if (!slot.href && slot.onClick) {
      return (
        <>
          <Button size="icon-sm" variant={slot.variant} disabled={slot.disabled} className="lg:hidden" onClick={slot.onClick}>
            <Icon className="h-4 w-4" />
          </Button>
          <Button size="sm" variant={slot.variant} disabled={slot.disabled} className="hidden lg:inline-flex" onClick={slot.onClick}>
            <Icon className="h-4 w-4 mr-2" />{slot.label}
          </Button>
        </>
      );
    }

    return <>{mobileBtn}{desktopBtn}</>;
  }

  const content = (
    <>
      {Icon && <Icon className={cn("h-4 w-4", forceIconOnly ? "" : "mr-2")} />}
      {forceIconOnly ? null : slot.label}
    </>
  );

  if (slot.href) {
    return (
      <Button size="sm" variant={slot.variant} disabled={slot.disabled} asChild>
        <Link href={slot.href}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant={slot.variant}
      disabled={slot.disabled}
      onClick={slot.onClick}
    >
      {content}
    </Button>
  );
}

function CustomSlotRenderer({ slot }: { slot: CustomSlot }) {
  return <>{slot.content}</>;
}

function FilterSlotRenderer({ slot }: { slot: FilterSlot }) {
  return (
    <DataTableFilter
      configs={slot.configs}
      activeFilter={slot.activeFilter}
      onFilterChange={slot.onFilterChange}
      className="max-w-xs"
    />
  );
}

function PaginationSlotRenderer({ slot }: { slot: PaginationSlot }) {
  return <DataTablePagination table={slot.table} />;
}

function PageSizeSelectorSlotRenderer({
  slot,
}: {
  slot: PageSizeSelectorSlot;
}) {
  return <DataTablePageSizeSelector table={slot.table} />;
}

function SlotRenderer({
  slot,
}: {
  slot: DataTableSlot;
}) {
  switch (slot.type) {
    case "search":
      return <SearchSlotRenderer slot={slot} />;
    case "button":
      return <ButtonSlotRenderer slot={slot} />;
    case "custom":
      return <CustomSlotRenderer slot={slot} />;
    case "filter":
      return <FilterSlotRenderer slot={slot} />;
    case "pagination":
      return <PaginationSlotRenderer slot={slot} />;
    case "pageSizeSelector":
      return <PageSizeSelectorSlotRenderer slot={slot} />;
  }
}

function getCollapseConfig(slot: DataTableSlot): CollapseConfig | undefined {
  if ("collapse" in slot) return slot.collapse;
  return undefined;
}

function ExpandedSlotOverlay({
  slot,
  onClose,
  className,
}: {
  slot: DataTableSlot;
  onClose: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 pb-4 border-b-2 lg:hidden", className)}>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onClose}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex-1">
        <SlotRenderer slot={slot} />
      </div>
    </div>
  );
}

interface DataTableActionBarProps {
  config: ActionBarConfig;
  className?: string;
}

export function DataTableActionBar({
  config,
  className,
}: DataTableActionBarProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // If a slot is expanded, show overlay
  if (expandedIndex !== null) {
    const slot = config.left[expandedIndex];
    if (slot) {
      return (
        <ExpandedSlotOverlay
          slot={slot}
          onClose={() => setExpandedIndex(null)}
          className={className}
        />
      );
    }
  }

  return (
    <div className={cn("sticky top-16 z-20 flex items-center gap-4 pb-8 bg-admin-bg", className)}>
      {/* Left slots */}
      <div className="flex items-center gap-2">
        {config.left.map((slot, i) => {
          const collapse = getCollapseConfig(slot);
          if (collapse) {
            const CollapseIcon = collapse.icon;
            return (
              <div key={i}>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="lg:hidden"
                  onClick={() => setExpandedIndex(i)}
                >
                  <CollapseIcon className="h-4 w-4" />
                </Button>
                <div className="hidden lg:block">
                  <SlotRenderer slot={slot} />
                </div>
              </div>
            );
          }
          return <SlotRenderer key={i} slot={slot} />;
        })}
      </div>
      {/* Spacer */}
      <div className="flex-1" />
      {/* Right slots */}
      <div className="flex items-center gap-2">
        {config.right.map((slot, i) => (
          <SlotRenderer key={i} slot={slot} />
        ))}
      </div>
    </div>
  );
}
