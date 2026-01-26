"use client";

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

export type DeleteConfirmationDialogProps = {
  open: boolean;
  targetCount: number;
  entityName: string; // singular form, e.g., "label" or "category"
  entityNamePlural?: string; // plural form, defaults to entityName + "s"
  associationMessage?: string; // e.g., "all category associations" or "all product associations"
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Reusable delete confirmation dialog for table views.
 * Shows appropriate singular/plural messaging based on target count.
 */
export function DeleteConfirmationDialog({
  open,
  targetCount,
  entityName,
  entityNamePlural,
  associationMessage,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmationDialogProps) {
  const plural = entityNamePlural ?? `${entityName}s`;
  const displayName = targetCount === 1 ? entityName : plural;
  const defaultAssociation = targetCount === 1
    ? `The ${entityName}`
    : `The ${plural}`;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            Delete {targetCount} {displayName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. {defaultAssociation} will be permanently
            deleted{associationMessage ? ` and ${associationMessage} will be removed` : ""}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
