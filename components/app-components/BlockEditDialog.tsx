"use client";

/**
 * @deprecated Use DialogShell directly from @/components/app-components/DialogShell
 * This is now just a re-export for backward compatibility.
 *
 * BlockEditDialog had built-in action buttons, which DialogShell now supports via
 * onSave/onCancel props. Simply pass those props to get the same behavior.
 */
export { DialogShell as BlockEditDialog } from "./DialogShell";
