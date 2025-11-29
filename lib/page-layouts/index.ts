/**
 * Page Layout System
 * Centralized exports for all layout renderer functions and configuration
 */

// Types
export type { LayoutRenderer, BlockHandlers } from "./types";
export type { PageLayoutConfig } from "./layouts";

// Layout renderers
export { renderSingleColumnLayout } from "./single-column";
export { renderTwoColumnLayout } from "./two-column";
export { renderLocationInfoLayout } from "./location-info";
export { renderAccordionLayout } from "./accordion";

// Layout configuration (now imported from individual layout files)
export {
  PAGE_LAYOUTS,
  PAGE_TYPES,
  isBlockAllowed,
  canAddBlock,
  getBlockDisplayName,
  isBlockRequired,
  isAtMinimumCount,
} from "./layouts";

// Individual layout configs
export { singleColumnConfig } from "./single-column";
export { twoColumnConfig } from "./two-column";
export { locationInfoConfig } from "./location-info";
export { accordionConfig } from "./accordion";

import { PageType } from "@prisma/client";
import { LayoutRenderer } from "./types";
import { renderSingleColumnLayout } from "./single-column";
import { renderTwoColumnLayout } from "./two-column";
import { renderLocationInfoLayout } from "./location-info";
import { renderAccordionLayout } from "./accordion";

/**
 * Get the appropriate layout renderer for a page type
 * Works for both editing and public views - pass handlers for editing mode
 * @param pageType - PageType enum from Prisma (GENERIC, ABOUT, CAFE, FAQ)
 */
export function getLayoutRenderer(pageType: PageType): LayoutRenderer {
  switch (pageType) {
    case PageType.ABOUT:
      return renderTwoColumnLayout;
    case PageType.CAFE:
      return renderLocationInfoLayout;
    case PageType.FAQ:
      return renderAccordionLayout;
    case PageType.GENERIC:
    default:
      return renderSingleColumnLayout;
  }
}
