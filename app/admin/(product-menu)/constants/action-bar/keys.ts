// Platform detection for keyboard shortcuts
const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
export const modKey = isMac ? "⌘" : "Ctrl";
