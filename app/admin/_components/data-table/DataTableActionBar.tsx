"use client";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import Link from "next/link";

import type { ActionBarConfig, ButtonSlot, CustomSlot, SearchSlot } from "./types";

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

function ButtonSlotRenderer({ slot }: { slot: ButtonSlot }) {
  const Icon = slot.icon;
  const content = (
    <>
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      {slot.label}
    </>
  );

  if (slot.href) {
    return (
      <Button variant={slot.variant} disabled={slot.disabled} asChild>
        <Link href={slot.href}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button variant={slot.variant} disabled={slot.disabled} onClick={slot.onClick}>
      {content}
    </Button>
  );
}

function CustomSlotRenderer({ slot }: { slot: CustomSlot }) {
  return <>{slot.content}</>;
}

function SlotRenderer({ slot }: { slot: ActionBarConfig["left"][number] }) {
  switch (slot.type) {
    case "search":
      return <SearchSlotRenderer slot={slot} />;
    case "button":
      return <ButtonSlotRenderer slot={slot} />;
    case "custom":
      return <CustomSlotRenderer slot={slot} />;
  }
}

interface DataTableActionBarProps {
  config: ActionBarConfig;
  className?: string;
}

export function DataTableActionBar({ config, className }: DataTableActionBarProps) {
  return (
    <div className={cn("flex items-center gap-4 pb-4 border-b-2", className)}>
      <div className="flex items-center gap-2">
        {config.left.map((slot, i) => (
          <SlotRenderer key={i} slot={slot} />
        ))}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        {config.right.map((slot, i) => (
          <SlotRenderer key={i} slot={slot} />
        ))}
      </div>
    </div>
  );
}
