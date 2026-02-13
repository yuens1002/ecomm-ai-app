"use client";

import { Undo, Redo } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

export type SaveStatusState = "saved" | "saving" | "error";

interface SaveStatusProps {
  status: SaveStatusState;
  errorMessage?: string;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function SaveStatus({
  status,
  errorMessage,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}: SaveStatusProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Undo / Redo buttons */}
      {(onUndo || onRedo) && (
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-disabled={!canUndo}
                onClick={canUndo ? onUndo : undefined}
                aria-label={canUndo ? "Undo last change" : "Nothing to undo"}
                className={cn("h-8 w-8", !canUndo && "opacity-50 cursor-not-allowed")}
              >
                <Undo className="size-4" />
              </Button>
            </TooltipTrigger>
            {canUndo && (
              <TooltipContent>
                <div className="flex items-center gap-2">
                  Undo
                  <Kbd>U</Kbd>
                </div>
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-disabled={!canRedo}
                onClick={canRedo ? onRedo : undefined}
                aria-label={canRedo ? "Redo last change" : "Nothing to redo"}
                className={cn("h-8 w-8", !canRedo && "opacity-50 cursor-not-allowed")}
              >
                <Redo className="size-4" />
              </Button>
            </TooltipTrigger>
            {canRedo && (
              <TooltipContent>
                <div className="flex items-center gap-2">
                  Redo
                  <KbdGroup>
                    <Kbd>Shift</Kbd>
                    <Kbd>U</Kbd>
                  </KbdGroup>
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      )}

      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "h-3 w-3 rounded-full transition-colors duration-300",
            status === "saved" && "bg-emerald-500",
            status === "saving" && "bg-amber-400 animate-pulse",
            status === "error" && "bg-red-500"
          )}
        />
        <span
          className={cn(
            "text-xs font-medium transition-colors duration-300",
            status === "saved" && "text-emerald-600 dark:text-emerald-400",
            status === "saving" && "text-amber-600 dark:text-amber-400",
            status === "error" && "text-red-600 dark:text-red-400"
          )}
        >
          {status === "saved" && "Saved"}
          {status === "saving" && "Saving…"}
          {status === "error" && (errorMessage || "Required fields missing")}
        </span>
      </div>
    </div>
  );
}
