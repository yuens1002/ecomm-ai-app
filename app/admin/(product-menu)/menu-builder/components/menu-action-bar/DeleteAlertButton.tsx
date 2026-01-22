"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Trash2 } from "lucide-react";
import type { ViewType } from "../../../types/builder-state";

type DeleteAlertButtonProps = {
  disabled: boolean;
  selectedCount: number;
  currentView: ViewType;
  kbd: string[];
  onConfirm: () => Promise<void>;
};

export function DeleteAlertButton({
  disabled,
  selectedCount,
  currentView,
  kbd,
  onConfirm,
}: DeleteAlertButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const entityType = currentView === "all-labels" ? "label" : "category";
  const entityPlural = selectedCount === 1 ? entityType : `${entityType}s`;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={() => setOpen(true)}
            aria-label={
              disabled
                ? "Delete disabled - no items selected"
                : `Permanently delete ${selectedCount} ${entityPlural}`
            }
          >
            <Trash2 className="size-4" />
          </Button>
        </TooltipTrigger>
        {!disabled && (
          <TooltipContent>
            <div className="flex items-center gap-2">
              Permanently delete
              {kbd.length > 0 && (
                <KbdGroup>
                  {kbd.map((key) => (
                    <Kbd key={key}>{key}</Kbd>
                  ))}
                </KbdGroup>
              )}
            </div>
          </TooltipContent>
        )}
      </Tooltip>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              Delete {selectedCount} {entityPlural}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected {entityPlural} will be
              permanently deleted
              {currentView === "all-labels"
                ? " and all category associations will be removed."
                : " and all label and product associations will be removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
