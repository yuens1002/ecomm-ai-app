"use client";

/**
 * @deprecated Use DialogShell directly from @/components/app-components/DialogShell
 * This is now just a re-export for backward compatibility.
 */
export { DialogShell as BlockDialog } from "@/components/app-components/DialogShell";

// Re-export types for convenience
export type { DialogSize } from "@/components/app-components/DialogShell";

// Type alias kept for backward compatibility
export type { DialogSize as BlockDialogSize } from "@/components/app-components/DialogShell";
