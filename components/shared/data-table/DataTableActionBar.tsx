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
import { useEffect, useRef, useState } from "react";

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
  RecordCountSlot,
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
          <Link href={slot.href}><Icon className="h-4 w-4" />{slot.label}</Link>
        ) : (
          <><Icon className="h-4 w-4" />{slot.label}</>
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
            <Icon className="h-4 w-4" />{slot.label}
          </Button>
        </>
      );
    }

    return <>{mobileBtn}{desktopBtn}</>;
  }

  const content = (
    <>
      {Icon && <Icon className="h-4 w-4" />}
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

function RecordCountSlotRenderer({ slot }: { slot: RecordCountSlot }) {
  return (
    <span className="text-sm text-muted-foreground whitespace-nowrap pr-4">
      {slot.label ? `${slot.count} ${slot.label}` : slot.count}
    </span>
  );
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
    case "recordCount":
      return <RecordCountSlotRenderer slot={slot} />;
  }
}

function getCollapseConfig(slot: DataTableSlot): CollapseConfig | undefined {
  if ("collapse" in slot) return slot.collapse;
  return undefined;
}

/** Whether a collapsible slot has an active value (search text or filter applied) */
function isSlotActive(slot: DataTableSlot): boolean {
  if (slot.type === "search") return !!slot.value;
  if (slot.type === "filter") return slot.activeFilter != null && slot.activeFilter.value !== "" && !(Array.isArray(slot.activeFilter.value) && slot.activeFilter.value.length === 0);
  return false;
}

interface DataTableActionBarProps {
  config: ActionBarConfig;
  className?: string;
  /** When true, action bar adjusts its sticky top when the site header hides on scroll */
  headerAware?: boolean;
}

export function DataTableActionBar({
  config,
  className,
  headerAware = false,
}: DataTableActionBarProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isStuck, setIsStuck] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-64px 0px 0px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Watch site header show/hide to adjust sticky top position
  useEffect(() => {
    if (!headerAware) return;

    const header = document.querySelector("header.sticky");
    if (!header) return;

    const observer = new MutationObserver(() => {
      setIsHeaderVisible(!header.classList.contains("-translate-y-full"));
    });
    observer.observe(header, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, [headerAware]);

  const expandedSlot = expandedIndex !== null ? config.left[expandedIndex] ?? null : null;

  // Separate recordCount slots from other right slots for mobile repositioning
  const recordCountSlots = config.right.filter(
    (s): s is RecordCountSlot => s.type === "recordCount"
  );
  const otherRightSlots = config.right.filter((s) => s.type !== "recordCount");

  return (
    <>
      <div ref={sentinelRef} className="h-0" />
      <div className={cn(
        "sticky z-50 flex flex-wrap min-h-9 items-center gap-x-4 transition-[top] duration-300",
        headerAware && !isHeaderVisible ? "top-0" : "top-[calc(4rem-1px)]",
        isStuck && "p-4 bg-background/95 backdrop-blur-sm border border-t-0 border-border rounded-b-lg",
        "mb-8",
        className
      )}>
        {expandedSlot ? (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setExpandedIndex(null)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <SlotRenderer slot={expandedSlot} />
            </div>
          </>
        ) : (
          <>
            {/* Mobile record count — above the tab bar row, left-aligned */}
            {recordCountSlots.length > 0 && (
              <div className="w-full lg:hidden">
                {recordCountSlots.map((slot, i) => (
                  <span key={i} className="text-xs text-muted-foreground">
                    {slot.label ? `${slot.count} ${slot.label}` : `${slot.count}`}
                  </span>
                ))}
              </div>
            )}
            {/* Left slots — mobile: tabs full-width with collapsible icons right-justified */}
            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto w-full lg:w-auto">
              {config.left.map((slot, i) => {
                const collapse = getCollapseConfig(slot);
                if (collapse) {
                  const CollapseIcon = collapse.icon;
                  const active = isSlotActive(slot);
                  return (
                    <div key={i}>
                      <div className="relative lg:hidden">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setExpandedIndex(i)}
                        >
                          <CollapseIcon className="h-4 w-4" />
                        </Button>
                        {active && (
                          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 pointer-events-none" />
                        )}
                      </div>
                      <div className="hidden lg:block">
                        <SlotRenderer slot={slot} />
                      </div>
                    </div>
                  );
                }
                return <SlotRenderer key={i} slot={slot} />;
              })}
              {/* Push collapsible icons to the right on mobile */}
              <div className="flex-1 lg:hidden" />
            </div>
            {/* Spacer (desktop only — mobile handled by w-full above) */}
            <div className="hidden lg:block flex-1" />
            {/* Right slots — recordCount hidden on mobile (shown above), other slots always visible */}
            <div className="flex items-center gap-2">
              {recordCountSlots.map((slot, i) => (
                <div key={`rc-${i}`} className="hidden lg:block">
                  <SlotRenderer slot={slot} />
                </div>
              ))}
              {otherRightSlots.map((slot, i) => (
                <SlotRenderer key={i} slot={slot} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
