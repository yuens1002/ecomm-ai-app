"use client";

/**
 * @deprecated Use DialogShell directly from @/app/admin/_components/dialogs/DialogShell
 * This is now just a re-export for backward compatibility.
 */
export { DialogShell as BlockDialog } from "@/app/admin/_components/dialogs/DialogShell";

// Re-export types for convenience
export type { DialogSize } from "@/app/admin/_components/dialogs/DialogShell";

// Type alias kept for backward compatibility
export type { DialogSize as BlockDialogSize } from "@/app/admin/_components/dialogs/DialogShell";
