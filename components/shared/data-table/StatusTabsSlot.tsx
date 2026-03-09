"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown } from "lucide-react";
import type { CustomSlot } from "./types";

interface StatusTab {
  value: string;
  label: string;
}

/**
 * Creates a CustomSlot config for a status tab bar with mobile dropdown fallback.
 *
 * Usage:
 * ```ts
 * createStatusTabsSlot({
 *   tabs: [{ value: "all", label: "All" }, { value: "PENDING", label: "Pending" }],
 *   value: statusFilter,
 *   onChange: setStatusFilter,
 *   naturalWidth: 400,
 * })
 * ```
 */
export function createStatusTabsSlot({
  tabs,
  value,
  onChange,
  naturalWidth,
}: {
  tabs: StatusTab[];
  value: string;
  onChange: (value: string) => void;
  naturalWidth: number;
}): CustomSlot {
  const labels = Object.fromEntries(tabs.map((t) => [t.value, t.label]));

  return {
    type: "custom",
    content: (
      <Tabs value={value} onValueChange={onChange}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    ),
    mobileContent: (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-[140px] justify-between text-sm font-normal"
          >
            {labels[value] ?? value}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
            {tabs.map((tab) => (
              <DropdownMenuRadioItem key={tab.value} value={tab.value}>
                {tab.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    naturalWidth,
  };
}
