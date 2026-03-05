"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PeriodPreset, CompareMode } from "@/lib/admin/analytics/contracts";
import { PERIOD_PRESETS, getDateRange } from "@/lib/admin/analytics/time";
import type { DateRange as DayPickerRange } from "react-day-picker";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DateRangePickerBaseProps {
  className?: string;
  /** Hide the inline compare selector outside the popover. */
  hideCompare?: boolean;
}

interface UrlModeDateRangePickerProps extends DateRangePickerBaseProps {
  mode: "url";
  period?: never;
  compare?: never;
  onPeriodChange?: never;
  onCompareChange?: never;
}

interface StateModeDateRangePickerProps extends DateRangePickerBaseProps {
  mode: "state";
  period: PeriodPreset;
  compare: CompareMode;
  onPeriodChange: (preset: PeriodPreset) => void;
  onCompareChange: (mode: CompareMode) => void;
}

type DateRangePickerProps =
  | UrlModeDateRangePickerProps
  | StateModeDateRangePickerProps;

const COMPARE_OPTIONS: { value: CompareMode; label: string }[] = [
  { value: "previous", label: "vs previous period" },
  { value: "lastYear", label: "vs last year" },
  { value: "none", label: "No comparison" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DateRangePicker(props: DateRangePickerProps) {
  if (props.mode === "url") {
    return <UrlSyncedDateRangePicker className={props.className} hideCompare={props.hideCompare} />;
  }

  return (
    <DateRangePickerView
      period={props.period}
      compare={props.compare}
      onPeriodChange={props.onPeriodChange}
      onCompareChange={props.onCompareChange}
      className={props.className}
      hideCompare={props.hideCompare}
    />
  );
}

// ---------------------------------------------------------------------------
// URL-synced variant
// ---------------------------------------------------------------------------

function UrlSyncedDateRangePicker({ className, hideCompare }: { className?: string; hideCompare?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPeriod = (searchParams.get("period") ?? "30d") as PeriodPreset;
  const currentCompare = (searchParams.get("compare") ?? "previous") as CompareMode;

  const handlePeriodChange = useCallback(
    (preset: PeriodPreset) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("period", preset);
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleCompareChange = useCallback(
    (mode: CompareMode) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("compare", mode);
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <DateRangePickerView
      period={currentPeriod}
      compare={currentCompare}
      onPeriodChange={handlePeriodChange}
      onCompareChange={handleCompareChange}
      className={className}
      hideCompare={hideCompare}
    />
  );
}

// ---------------------------------------------------------------------------
// Presentational view
// ---------------------------------------------------------------------------

interface DateRangePickerViewProps {
  period: PeriodPreset;
  compare: CompareMode;
  onPeriodChange: (preset: PeriodPreset) => void;
  onCompareChange: (mode: CompareMode) => void;
  className?: string;
  hideCompare?: boolean;
}

function DateRangePickerView({
  period,
  compare,
  onPeriodChange,
  onCompareChange,
  className,
  hideCompare,
}: DateRangePickerViewProps) {
  const [open, setOpen] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<PeriodPreset>(period);
  const [pendingCompare, setPendingCompare] = useState<CompareMode>(compare);

  // Compute the displayed date range from the current period
  const dateRange = getDateRange(period);
  const presetLabel = PERIOD_PRESETS.find((p) => p.key === period)?.label;
  const triggerPreset = presetLabel ? `Last ${presetLabel}` : "Custom";
  const triggerDates = `${format(dateRange.from, "MMM d")} – ${format(
    dateRange.to,
    "MMM d, yyyy"
  )}`;

  // Calendar selection from the pending preset
  const pendingRange = getDateRange(pendingPreset);
  const calendarRange: DayPickerRange = {
    from: pendingRange.from,
    to: pendingRange.to,
  };

  const handlePresetClick = (preset: PeriodPreset) => {
    setPendingPreset(preset);
  };

  const handleApply = () => {
    onPeriodChange(pendingPreset);
    if (pendingCompare !== compare) {
      onCompareChange(pendingCompare);
    }
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Reset pending state to current values when opening
      setPendingPreset(period);
      setPendingCompare(compare);
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 text-xs font-normal"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span className="text-muted-foreground">{triggerPreset}</span>
            {triggerDates}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Preset sidebar */}
            <div className="flex flex-col gap-1 border-r p-3 min-w-[100px]">
              {PERIOD_PRESETS.map((preset) => (
                <Button
                  key={preset.key}
                  variant={pendingPreset === preset.key ? "default" : "ghost"}
                  size="sm"
                  className="justify-start h-7 text-xs"
                  onClick={() => handlePresetClick(preset.key)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Calendar + footer */}
            <div className="flex flex-col">
              <Calendar
                mode="range"
                selected={calendarRange}
                numberOfMonths={2}
                defaultMonth={pendingRange.from}
                disabled={{ after: new Date() }}
              />

              {/* Footer: compare + apply */}
              <div className="flex items-center justify-between border-t px-3 py-2">
                <Select
                  value={pendingCompare}
                  onValueChange={(v) => setPendingCompare(v as CompareMode)}
                >
                  <SelectTrigger className="h-7 w-[160px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPARE_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="text-xs"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-7 text-xs" onClick={handleApply}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Inline compare select for quick access */}
      {!hideCompare && (
        <Select value={compare} onValueChange={(v) => onCompareChange(v as CompareMode)}>
          <SelectTrigger className="h-8 w-42.5 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMPARE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
