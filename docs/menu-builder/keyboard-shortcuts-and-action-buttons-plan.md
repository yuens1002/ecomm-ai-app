# Menu Builder: Keyboard Shortcuts & Action Buttons Implementation Plan

## Overview

This document outlines the implementation plan for two concurrent features:
1. **Keyboard Shortcuts** - Making existing kbd mappings functional
2. **New Action Buttons** - Help (ConciergeBell) and Delete (Trash) buttons

---

## Feature 1: Keyboard Shortcuts

### Current State
- Shortcuts are **defined** in `constants/action-bar/actions.ts` via `kbd: string[]` property
- Shortcuts are **displayed** in tooltips via `ActionButton.tsx`
- Shortcuts are **NOT functional** - no global keyboard event listener exists

### Keyboard Shortcut Mappings

Single-key shortcuts (Gmail/Slack style) to avoid browser conflicts. Only active when not typing in inputs.

| Action | Key | Mnemonic | Views |
|--------|-----|----------|-------|
| New | N | **N**ew | menu, all-labels, all-categories |
| Clone | D | **D**uplicate | menu, all-labels, all-categories |
| Remove | R | **R**emove | menu, label, category, all-labels, all-categories |
| Delete | X | e**X** (permanent) | all-labels, all-categories |
| Visibility | V | **V**isibility | all-labels, all-categories |
| Expand All | E | **E**xpand | menu |
| Collapse All | C | **C**ollapse | menu |
| Undo | U | **U**ndo | all views |
| Redo | Shift+U | Shift+**U**ndo | all views |
| Help | ? | universal | all views |

### Implementation Steps

#### Step 1: Update All Shortcuts to Use Shift
**File:** `app/admin/(product-menu)/constants/action-bar/actions.ts`
- All shortcuts now use `[modKey, "Shift", "<key>"]` pattern to avoid browser conflicts

#### Step 2: Create `useKeyboardShortcuts` Hook
**File:** `app/admin/(product-menu)/hooks/useKeyboardShortcuts.ts`

Responsibilities:
- Listen to global keydown events
- Parse key combinations (Ctrl/Cmd + key, Shift, etc.)
- Match against available actions for current view
- Execute action.onClick() if match found and action is not disabled
- Prevent default behavior for matched shortcuts
- Handle focus context (skip when in input/textarea/contenteditable)

Key considerations:
- Platform detection (already exists in `shared.ts` as `modKey`)
- Focus context - don't intercept when user is typing in inputs
- Disabled state - respect `action.disabled(state)`
- Event propagation - prevent defaults for matched shortcuts

#### Step 3: Integrate Hook into MenuBuilder
**File:** `app/admin/(product-menu)/menu-builder/MenuBuilderProvider.tsx` or appropriate provider

- Call `useKeyboardShortcuts` with current view's actions
- Pass builder state and actions for execution

#### Step 4: Handle Edge Cases
- InlineNameEditor already handles Enter/Escape locally
- DropdownContent stops propagation for keyboard events
- Modal dialogs should capture focus and prevent global shortcuts

---

## Feature 2: Action Buttons

### 2A: Help Button (ConciergeBell)

#### Requirements
- Icon: `ConciergeBell` (Lucide)
- Position: **Always last** on right side in **all 5 views**
- Behavior: Opens shadcn Popover with view-specific help content
- No keyboard shortcut

#### Implementation Steps

##### Step 1: Add `help` Action Definition
**File:** `app/admin/(product-menu)/constants/action-bar/model.ts`
- Add `"help"` to `ALL_ACTION_IDS`

**File:** `app/admin/(product-menu)/constants/action-bar/actions.ts`
```typescript
help: {
  id: "help",
  icon: ConciergeBell,
  label: "Help",
  tooltip: "View help",
  kbd: [],
  disabled: () => false,
  onClick: () => {}, // Handled by component
}
```

##### Step 2: Add Help Button to All Views
**File:** `app/admin/(product-menu)/constants/action-bar/views.ts`
- Add `{ id: "help" }` at end of `right` array for all 5 views

##### Step 3: Create HelpPopoverButton Component
**File:** `app/admin/(product-menu)/menu-builder/components/menu-action-bar/HelpPopoverButton.tsx`

- Uses shadcn Popover
- Receives current view type as prop
- Renders view-specific bulleted help content

##### Step 4: Create Help Content Definitions
**File:** `app/admin/(product-menu)/constants/help-content.ts`

View-specific bulleted text:
- **menu**: Overview of menu management, drag to reorder, selection, expand/collapse
- **label**: Managing categories within a label, drag to reorder, remove from label
- **category**: Managing products within a category, drag to reorder, remove from category
- **all-labels**: All labels overview, visibility toggle, clone, delete
- **all-categories**: All categories overview, visibility toggle, clone, delete, remove from labels

##### Step 5: Add Rendering Logic in MenuActionBar
**File:** `app/admin/(product-menu)/menu-builder/components/menu-action-bar/index.tsx`
- When action.id === "help", render `HelpPopoverButton` instead of `ActionButton`

---

### 2B: Delete Button (Trash)

#### Requirements
- Icon: `Trash2` (no border, default color)
- Position: 2nd to last (before Help button) on right side
- Views: `all-labels`, `all-categories` only
- Behavior:
  - Opens AlertDialog for confirmation
  - Performs permanent delete (not hide/detach like `remove`)
  - Full undo/redo support (recreates item with all relationships)
- Shortcut: `Ctrl+Shift+Backspace` / `Cmd+Shift+Backspace`

#### Implementation Steps

##### Step 1: Add `delete` Action Definition
**File:** `app/admin/(product-menu)/constants/action-bar/model.ts`
- Add `"delete"` to `ALL_ACTION_IDS`

**File:** `app/admin/(product-menu)/constants/action-bar/actions.ts`
```typescript
delete: {
  id: "delete",
  icon: Trash2,
  label: "Delete",
  tooltip: "Permanently delete selected items",
  kbd: [modKey, "Shift", "⌫"],
  disabled: (state) => !hasSameKindSelection(state),
  ariaLabel: (state) => /* contextual aria label */,
  onClick: async (_state, actions) => {
    await actions.deleteSelected?.();
  },

  execute: {
    "all-labels": async ({ selectedIds, mutations }) => {
      // Delete each label
    },
    "all-categories": async ({ selectedIds, mutations }) => {
      // Delete each category
    },
  },

  captureUndo: {
    "all-labels": ({ selectedIds, labels, mutations }, result) => {
      // Store full label data including category relationships for recreation
    },
    "all-categories": ({ selectedIds, categories, mutations }, result) => {
      // Store full category data including label/product relationships for recreation
    },
  },

  effects: {
    refresh: {
      "all-labels": ["labels"],
      "all-categories": ["categories"],
    },
    successToast: {
      "all-labels": { title: "Labels deleted" },
      "all-categories": { title: "Categories deleted" },
    },
    failureToast: { title: "Delete failed", description: "Please try again." },
  },
}
```

##### Step 2: Add Delete Button to Views
**File:** `app/admin/(product-menu)/constants/action-bar/views.ts`

```typescript
"all-labels": {
  left: [{ id: "new-label" }, { id: "clone" }],
  right: [
    { id: "visibility" },
    { id: "undo" },
    { id: "redo" },
    { id: "delete" },  // 2nd to last
    { id: "help" },    // last
  ],
},
"all-categories": {
  left: [
    { id: "new-category" },
    { id: "clone" },
    { id: "remove", tooltip: "Remove from labels" },
  ],
  right: [
    { id: "visibility" },
    { id: "undo" },
    { id: "redo" },
    { id: "delete" },  // 2nd to last
    { id: "help" },    // last
  ],
},
```

##### Step 3: Create DeleteAlertButton Component
**File:** `app/admin/(product-menu)/menu-builder/components/menu-action-bar/DeleteAlertButton.tsx`

- Uses AlertDialog from shadcn (pattern from `LabelsTable.tsx`)
- Props: disabled, selectedCount, entityType, onConfirm
- Warning message about permanent deletion

##### Step 4: Add Rendering Logic in MenuActionBar
**File:** `app/admin/(product-menu)/menu-builder/components/menu-action-bar/index.tsx`
- When action.id === "delete", render `DeleteAlertButton` instead of `ActionButton`

##### Step 5: Implement Full Undo/Redo for Delete
- Capture complete item state before deletion (including relationships)
- On undo: recreate item with original data and reattach relationships
- On redo: delete again

---

## Implementation Order

### Phase 1: Foundation
1. Update `model.ts` - Add `"help"` and `"delete"` to `ALL_ACTION_IDS`
2. Update `actions.ts` - Add action definitions + update visibility kbd to `[modKey, "Space"]`
3. Update `views.ts` - Add buttons to view configs

### Phase 2: Help Button
4. Create `help-content.ts` with view descriptions (bulleted text)
5. Create `HelpPopoverButton.tsx`
6. Update `MenuActionBar/index.tsx` to render help button

### Phase 3: Delete Button
7. Create `DeleteAlertButton.tsx`
8. Update `builder-state.ts` types (add `deleteSelected`)
9. Implement `deleteSelected` action with full undo/redo
10. Update `MenuActionBar/index.tsx` to render delete button

### Phase 4: Keyboard Shortcuts
11. Create `useKeyboardShortcuts.ts` hook
12. Integrate into MenuBuilder provider
13. Test all shortcuts

### Phase 5: Testing & Polish
14. Test help popovers on all views
15. Test delete with AlertDialog + undo/redo on all-labels and all-categories
16. Test all keyboard shortcuts
17. Verify focus context handling (inputs, modals)

---

## Files to Modify/Create

### New Files
- `app/admin/(product-menu)/hooks/useKeyboardShortcuts.ts`
- `app/admin/(product-menu)/menu-builder/components/menu-action-bar/HelpPopoverButton.tsx`
- `app/admin/(product-menu)/menu-builder/components/menu-action-bar/DeleteAlertButton.tsx`
- `app/admin/(product-menu)/constants/help-content.ts`

### Modified Files
- `app/admin/(product-menu)/constants/action-bar/model.ts` - Add action IDs
- `app/admin/(product-menu)/constants/action-bar/actions.ts` - Add action definitions, update visibility kbd
- `app/admin/(product-menu)/constants/action-bar/views.ts` - Add to view configs
- `app/admin/(product-menu)/menu-builder/components/menu-action-bar/index.tsx` - Render new buttons
- `app/admin/(product-menu)/types/builder-state.ts` - Add deleteSelected type
- MenuBuilder provider - Integrate keyboard shortcuts

---

## Decisions Made

| Topic | Decision |
|-------|----------|
| Help icon | `ConciergeBell` (Lucide) |
| Delete undo behavior | Fully recreates item with all relationships |
| Help content format | Bulleted text only (animated walkthroughs deferred) |
| Shortcut style | Single-key (Gmail/Slack style) to avoid all browser conflicts |
| Undo/Redo shortcuts | `U` / `Shift+U` |

---

## Acceptance Criteria

### Keyboard Shortcuts
- [ ] All defined shortcuts execute their respective actions
- [ ] Shortcuts don't fire when user is typing in inputs
- [ ] Disabled actions don't respond to shortcuts
- [ ] Single-key shortcuts work (N, D, R, X, V, E, C, U, ?)
- [ ] Shift+U works for redo
- [ ] No conflicts with browser shortcuts

### Help Button
- [ ] Appears on all 5 views at end of right side
- [ ] Uses ConciergeBell icon
- [ ] Opens Popover on click
- [ ] Shows view-specific bulleted help content
- [ ] Popover closes on click outside or Escape

### Delete Button
- [ ] Appears only on all-labels and all-categories views
- [ ] Uses Trash2 icon
- [ ] Shows AlertDialog confirmation before delete
- [ ] Permanently deletes selected items after confirmation
- [ ] Undo fully recreates deleted items with relationships
- [ ] Redo deletes again
- [ ] Shows success/error toast after operation
