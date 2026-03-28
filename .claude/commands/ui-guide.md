---
name: ui-guide
description: Load established UI design language before designing or building admin pages
---

# UI Guide Skill

Invoke before any admin UI design work to load the project's visual language.

## Arguments

- `$ARGUMENTS` — Brief description of what you're designing (e.g., "settings page with form", "card grid for plans")

## Step 1: Check shadcn MCP

Always check shadcn-studio MCP for existing components or blocks that match the task before designing anything custom. Use `get-blocks-metadata`, `get-component-meta-content`, or `get-inspire-instructions` to find patterns.

## Step 2: Design Language

These are the established visual conventions. Apply them to all design decisions.

### Containment

- **Flat cards** — `rounded-lg border p-6`, no shadcn Card/CardContent wrappers
- **Muted info sections** — `bg-muted/30` with no border
- **Empty states** — dashed border, centered text

### Spacing

- Grid gap matches dashboard: `gap-4`
- Between major sections: `space-y-12`
- Within sections: `space-y-6`

### Desktop Constraint

- Inputs and text content never span wider than `max-w-[72ch]`
- Match the settings pages — contained, not edge-to-edge

### Hierarchy

- Card titles: large + semibold
- Descriptions: small + muted
- Section headers: extra-small + uppercase + tracking-wider + muted
- Metadata (timestamps, counts): extra-small + muted

### Icons

- External link icons are always muted
- Action icons (send, calendar, credit card) keep normal color

### Interaction

- Clickable cards get shadow on hover
- Cards that navigate internally get stronger shadow (`shadow-lg`)
- No redundant icons on already-clickable elements

### Responsive

- Desktop inline buttons, mobile dropdown menu
- Badges left-aligned on mobile, right-aligned on desktop when standalone

### Data

- Auto-refresh lists after mutations — never require manual refresh
- Config-driven rendering for multi-state UIs (active/inactive/none, free/subscriber/exhausted)

### Nav

- Support & Services is always the last section in the overflow menu
- Dropdown menus constrained to ~35vh, scrollable, no visible scrollbar
