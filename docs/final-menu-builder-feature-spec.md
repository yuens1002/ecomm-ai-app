# Menu Builder - Final Feature Specification

**Last Updated**: December 28, 2025  
**Status**: Ready for Implementation

## Executive Summary

The Menu Builder is a single-page admin interface for organizing the product catalog menu structure. It uses a table-based approach with 5 distinct views, real-time persistence, and comprehensive keyboard/touch support. The builder focuses on **organization and linking** - not product creation or detailed editing.

**Core Principle**: No database deletions. Items can only be hidden/detached from the menu. Actual deletion happens in dedicated Labels/Categories management pages.

---

## Architecture Overview

### Layout Strategy

- **Single-pane table design** (not three-pane explorer)
- **5 views**: Menu, Label, Category, All-Labels, All-Categories
- **Responsive**: Same views on mobile with touch gestures
- **Navigation**: Breadcrumb-style with icon + 2 dropdowns
- **Real-time persistence**: No explicit save button

### Technology Stack

- **UI**: HTML tables (best alignment), shadcn components
- **DnD**: Native HTML5 for MVP (upgrade to @dnd-kit if needed)
- **State**: SWR + optimistic updates
- **Touch**: Native long-press, custom double-tap (optional)
- **Storage**: Session storage for undo stack (10 operations)

---

## Data Model & Schema

### Three-Level Hierarchy

```
CategoryLabel (Label)
  ├─ id, name, icon, order, isVisible, autoOrder
  └─ CategoryLabelCategory[] (junction)
       ├─ labelId, categoryId, order
       └─ Category
            ├─ id, name, slug, kind, order, isVisible
            └─ CategoriesOnProducts[] (junction)
                 ├─ categoryId, productId, order, isPrimary
                 └─ Product
                      └─ id, name, slug, type, isDisabled
```

### Sorting Fields

| Level                   | Field                         | Scope        | Controls                         |
| ----------------------- | ----------------------------- | ------------ | -------------------------------- |
| **Label**               | `CategoryLabel.order`         | Global       | Order of labels in dropdown menu |
| **Category in Label**   | `CategoryLabelCategory.order` | Per label    | Order within specific label      |
| **Product in Category** | `CategoriesOnProducts.order`  | Per category | Order within specific category   |

### Key Features

- ✅ Products can belong to multiple categories
- ✅ Same product can have different order in each category
- ✅ Same category can have different order in each label
- ✅ Labels have `autoOrder` flag (alphabetical vs manual)
- ✅ All entities have `isVisible` flag

---

## Navigation Bar Component

### Structure

```
[MenuIcon] Menu Text | [Tags] Labels ▼ | [FileSpreadsheet] Categories ▼
```

### Behavior by View

**Menu View:**

```
[ShoppingBag] | [Tags] ▼ | [FileSpreadsheet] ▼
```

**Label View (drilling into "Origins"):**

```
[ShoppingBag] (clickable) | [Tag] Origins ▼ | [FileSpreadsheet] ▼
```

**Category View (drilling into "Ethiopian"):**

```
[ShoppingBag] (clickable) | [Tag] (clickable) ▼ | [FileSpreadsheet] Ethiopian ▼
```

**All-Labels View:**

```
[ShoppingBag] (clickable) | [Tags] All labels ▼ | [FileSpreadsheet] ▼
```

**All-Categories View:**

```
[ShoppingBag] (clickable) | [Tags] ▼ | [FileSpreadsheet] All categories ▼
```

### Dropdown Menus

**Labels Dropdown:**

1. All labels (navigates to all-labels view)
2. label1... (if exists, navigates to label view)
3. label2...

**Categories Dropdown:**

1. All categories (navigates to all-categories view)
2. category1... (if exists, navigates to category view)
3. category2...

### Responsive Behavior

- **Mobile/sm**: Icon only
- **md+**: Icon + text ("Coffee", "Shop", etc.)
- **Menu icon/text**: From `SiteSettings` (menu_icon, menu_text)
- **Component**: Use shadcn `Item` component for navigation items
  - `ItemMedia` for icons
  - `ItemContent` for text (ItemTitle)
  - `ItemActions` for ChevronRight/ChevronDown

---

## Action Bar Specification

### Menu View

**Left:**

- **Button Group**: New/Add combined with dropdown (shadcn button-group)
  - `[Sparkles] New Label` - Create new label in DB
  - `[Plus] Add Label` - Link existing label (dropdown menu to select)
- `[Copy] Clone` - Duplicate selected items (with children)
- `[CornerUpLeft] Remove` - Hide selected from menu

**Right:**

- `[ChevronsUpDown] Expand All`
- `[ChevronDown] Collapse All`
- `[Undo/Redo] Re/Undo` - Bidirectional undo (10 ops)

### Label View (drilling into specific label)

**Left:**

- `[Sparkles] New Category` - Create new category in DB
- `[Plus] Add Product` - Link product to category
- `[Copy] Clone` - Duplicate selected
- `[CornerUpLeft] Remove` - Detach from label

**Right:**

- `[ChevronsUpDown] Expand All`
- `[ChevronDown] Collapse All`
- `[Undo/Redo] Re/Undo`

### Category View (drilling into specific category)

**Left:**

- `[Plus] Add Product` - Link products via checkbox selection
- `[Copy] Clone` - Duplicate selected products
- `[CornerUpLeft] Remove` - Unlink products from category

**Right:**

- `[ArrowUpDown] Sort ▼` - Sort products in this category
- `[Undo/Redo] Re/Undo`

### All-Labels View

**Left:**

- `[Sparkles] New Label`
- `[Copy] Clone`
- `[CornerUpLeft] Remove` - Hide from menu

**Right:**

- `[Undo/Redo] Undo`

### All-Categories View

**Left:**

- `[Sparkles] New Category`
- `[Copy] Clone`
- `[CornerUpLeft] Remove` - Hide from menu

**Right:**

- `[Undo/Redo] Undo`

### Button State Logic

- **Show disabled**: Action is possible in this view but not available now
  - Example: Clone disabled when nothing selected
  - Example: Remove disabled when nothing selected
- **Hide completely**: Action doesn't apply to this view
  - Example: "New Product" never shown (products not created here)
  - Example: Expand/Collapse hidden in flat all-views

### Tooltips

- **Desktop**: Show on hover with keyboard shortcut (use shadcn `Kbd` component)
  - Example: "Clone" with `<Kbd>Ctrl</Kbd>+<Kbd>D</Kbd>`
- **Mobile**: Show on long-press (no keyboard shortcuts shown)

---

## Table Views

**Implementation**: Use TanStack React Table + shadcn Data Table

- Row Actions (context menu)
- Row Selection (checkboxes)
- Sorting (column headers)
- Reusable column definitions
- See: https://ui.shadcn.com/docs/components/data-table

### Menu View

**Columns:** `checkbox | Labels | Visibility | Categories | Products`

**Rows:**

- Label row (top-level)
  - Chevron if has categories
  - Visibility: Switch component
  - Shows category count
- Category row (indented 24px, when label expanded)
  - Chevron if has products
  - Visibility: Eye icon (read-only indicator)
  - Shows product count
- Product row (indented 48px, when category expanded)
  - No chevron
  - Visibility: Eye icon

### Label View (drilling into specific label)

**Columns:** `checkbox | Categories | Visibility | Products`

**Rows:**

- Category row (top-level in this view)
  - Checkbox: Always visible
  - Visibility: Eye icon
  - Products: Count of products in category

### Category View (drilling into specific category)

**Columns:** `checkbox | Products | Visibility | Added in Categories`

**Rows:**

- Product row (all products, not just assigned)
  - Checkbox: Always visible
  - Visibility: Eye icon
  - Added in Categories: List of category names (e.g., "Origins, Light Roast")

**Product Assignment:**

1. All products shown in table
2. Checkboxes to select products
3. Action bar "Add to Category" button links selected
4. Action bar "Remove from Category" button unlinks selected
5. "Added in Categories" column shows where product appears elsewhere

### All-Labels View

**Columns:** `checkbox | Icon | Name | Categories | Visibility`

**Rows:**

- Label row (flat list)
  - Icon: Click to edit via IconPicker
  - Name: Click to inline edit
  - Categories: Count
  - Visibility: Switch component

### All-Categories View

**Columns:** `checkbox | Name | Labels | Visibility`

**Rows:**

- Category row (flat list)
  - Name: Click to inline edit
  - Labels: List of label names
  - Visibility: Switch component

---

## Inline Editing

### Name Field

**Trigger:** Click name or pencil icon
**UI:** Input + Check/X buttons (from LabelsTable pattern)
**Actions:**

- Check button: Save (real-time)
- X button: Cancel
- Enter key: Save
- Escape key: Cancel

### Icon Field (Labels only)

**Trigger:** Click icon or "None" text
**UI:** IconPicker dialog (from LabelsTable)
**Actions:**

- Select icon: Save immediately
- Close dialog: Cancel

### Implementation Pattern

```tsx
// From LabelsTable.tsx
{editingLabelId === label.id ? (
  <div className="flex items-center gap-2">
    <Input value={draft.name} onChange={...} autoFocus />
    <Button size="icon" onClick={() => save()}>
      <Check className="h-4 w-4" />
    </Button>
    <Button size="icon" onClick={reset}>
      <X className="h-4 w-4" />
    </Button>
  </div>
) : (
  <button onClick={() => startEdit(label)}>
    <Pencil className="h-3 w-3" />
    <span>{label.name}</span>
  </button>
)}
```

---

## Drag & Drop

### Native HTML5 vs @dnd-kit Comparison

| Feature         | Native HTML5        | @dnd-kit         | Decision         |
| --------------- | ------------------- | ---------------- | ---------------- |
| Setup           | Simple (3 handlers) | Complex Provider | **Start Native** |
| Bundle Size     | 0 KB                | ~45 KB           | **Native**       |
| Touch Support   | ❌ Polyfill needed  | ✅ Built-in      | Later upgrade    |
| Keyboard        | ❌ Manual           | ✅ Built-in      | Later upgrade    |
| Drop Zones      | ⚠️ Manual           | ✅ Auto-managed  | Later upgrade    |
| Accessibility   | ❌ Manual           | ✅ Full ARIA     | Later upgrade    |
| Learning Curve  | Low                 | High             | **Native**       |
| Already Working | ✅ LabelsTable      | ❌ Not installed | **Native**       |

**Decision**: Start with Native HTML5 (proven in LabelsTable), upgrade to @dnd-kit if we need touch/keyboard/a11y.

### Drag Operations

**Reorder within level:**

- Labels in menu
- Categories within label
- Products within category
- Updates `order` field in respective table

**Move between containers:**

- Drag category to different label → Updates `CategoryLabelCategory.labelId`
- Drag product to different category → Updates `CategoriesOnProducts.categoryId`

**Visual Feedback:**

- Drag handle: `GripVertical` icon
- Cursor: `cursor-grab` → `cursor-grabbing`
- Drop zone: Highlight on `dragOver` (TODO: implement)

### Implementation Pattern

```tsx
// From LabelsTable.tsx
<TableRow
  draggable
  onDragStart={() => setDragLabelId(label.id)}
  onDragOver={(e) => e.preventDefault()}
  onDrop={() => handleLabelDrop(label.id)}
>
  <TableCell>
    <GripVertical className="cursor-grab active:cursor-grabbing" />
  </TableCell>
</TableRow>
```

---

## Clone/Duplicate Operations

### Single Operation (not Copy + Paste)

- **Trigger**: Cmd/Ctrl+D or Cmd/Ctrl+V (same action)
- **Button**: Clone button in action bar
- **Behavior**: Duplicates selected items in-place

### Clone Behavior

**Clone Label:**

- Creates new label with " Copy" suffix
- Clones all attached categories (creates new junction entries)
- Inherits visibility setting
- Result: Label with name "Origins Copy" and all its category links

**Clone Category:**

- Creates new category with " Copy" suffix
- Clones all product links (creates new junction entries)
- Inherits visibility setting
- Result: Category with name "Ethiopian Copy" and all its product assignments

**Clone Product Link:**

- Creates new junction entry (product stays same)
- Duplicates order and isPrimary settings
- Result: Same product appears twice in category (different order positions)

### Name Collision Handling

```
Ethiopian → Ethiopian Copy
Ethiopian Copy → Ethiopian Copy 2
Ethiopian Copy 2 → Ethiopian Copy 3
```

### Hierarchy Respect

❌ Can't paste label inside category
❌ Can't paste category inside product
✅ Can paste label on empty space in menu view
✅ Can paste category on empty space in label view
✅ Can paste product on empty space in category view

---

## Remove Operations

### No Database Deletion

- **Remove** = Hide from menu (detach)
- **Delete** = Not available in builder (go to Labels/Categories pages)

### Remove Types

**Remove Label from Menu:**

- Detaches from all categories
- Label still exists in DB
- Can be re-added via "Add Label"

**Remove Category from Label:**

- Updates `CategoryLabelCategory` (removes junction entry)
- Category still exists in DB
- Can be re-attached via "Group" dropdown

**Remove Product from Category:**

- Updates `CategoriesOnProducts` (removes junction entry)
- Product still exists in DB
- Can be re-added via checkbox selection

### Confirmation Logic

- **Single remove**: Silent with undo toast (3-5 seconds)
- **Bulk remove**: Confirmation dialog required
- **Toast message**: "Removed X from menu. Undo"
- **Component**: Use Sonner for toast notifications (shadcn sonner)
  - Auto-dismiss with action button
  - Keyboard accessible
  - Stacks multiple toasts

---

## Sorting

### Context-Sensitive Sorting

**All-Labels View:**

- Select one or more labels
- Sort button → Reorders **categories within** selected labels
- Updates `CategoryLabelCategory.order` for those labels
- Persists to database (affects customer menu)

**All-Categories View:**

- Select one or more categories
- Sort button → Reorders **products within** selected categories
- Updates `CategoriesOnProducts.order` for those categories
- Persists to database (affects customer menu)

### Sort Options

```tsx
[
  { value: "alpha-asc", label: "A-Z" },
  { value: "alpha-desc", label: "Z-A" },
  { value: "date-added-desc", label: "Recently added" },
  { value: "date-added-asc", label: "Oldest first" },
  { value: "manual", label: "Manual order (current)" },
];
```

### Sort Dropdown Component

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm" disabled={!hasSelection}>
      <ArrowUpDown className="h-4 w-4 mr-2" />
      Sort
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {sortOptions.map((opt) => (
      <DropdownMenuItem onClick={() => handleSort(opt.value)}>
        {opt.label}
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```

### Auto-Order Feature

- **Label-level setting**: `CategoryLabel.autoOrder`
- **When true**: Categories alphabetically sorted automatically
- **When false**: Manual drag-and-drop ordering
- **UI**: Switch in context menu (already in LabelsTable)

---

## Undo/Redo System

### Stack Configuration

- **Depth**: 10 operations
- **Storage**: Session storage (clears on browser close)
- **Direction**: Bidirectional (undo + redo)

### Operations Tracked

```typescript
type UndoableOperation =
  | { type: "clone"; items: Item[] }
  | { type: "remove"; items: Item[] }
  | { type: "reorder"; before: Order[]; after: Order[] }
  | { type: "move"; item: Item; fromId: string; toId: string }
  | { type: "visibility"; items: Item[]; before: boolean[]; after: boolean[] };
```

### Implementation Pattern

```typescript
// Store in session storage
const undoStack: UndoableOperation[] = [];
const redoStack: UndoableOperation[] = [];

function executeAndTrack(operation: Operation) {
  const undoOp = await execute(operation);
  undoStack.push(undoOp);
  redoStack.length = 0; // Clear redo on new action
  saveToSession();
}

function undo() {
  const op = undoStack.pop();
  if (!op) return;
  const redoOp = await revert(op);
  redoStack.push(redoOp);
  saveToSession();
}
```

### Clear Behavior

- **Never**: Stack persists across page refresh (session storage)
- **On browser close**: Session storage clears
- **Manual**: No manual clear (always available)

---

## Keyboard Shortcuts

### Platform Detection

```typescript
const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
const modKey = isMac ? "Cmd" : "Ctrl";
```

### Selection & Navigation

| Shortcut       | Action                       | Platform |
| -------------- | ---------------------------- | -------- |
| `↑` / `↓`      | Move selection up/down       | Both     |
| `Shift + ↑/↓`  | Extend selection             | Both     |
| `Ctrl/Cmd + A` | Select all visible           | Both     |
| `Escape`       | Clear selection              | Both     |
| `→`            | Expand row (if has children) | Both     |
| `←`            | Collapse row (if expanded)   | Both     |
| `Home`         | Jump to first item           | Both     |
| `End`          | Jump to last item            | Both     |

### Editing

| Shortcut           | Action             | Platform |
| ------------------ | ------------------ | -------- |
| `Enter` or `F2`    | Edit selected name | Both     |
| `Escape` (in edit) | Cancel edit        | Both     |
| `Enter` (in edit)  | Save edit          | Both     |

### Operations

| Shortcut                | Action                         | Platform |
| ----------------------- | ------------------------------ | -------- |
| `Ctrl/Cmd + D`          | Clone selected                 | Both     |
| `Ctrl/Cmd + V`          | Clone selected (same as Cmd+D) | Both     |
| `Delete` or `Backspace` | Remove selected from menu      | Both     |
| `Ctrl/Cmd + Z`          | Undo                           | Both     |
| `Ctrl/Cmd + Shift + Z`  | Redo                           | Both     |
| `Space`                 | Toggle visibility of selected  | Both     |

### Implementation Pattern

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const isMod = isMac ? e.metaKey : e.ctrlKey;

    if (isMod && e.key === "d") {
      e.preventDefault();
      handleClone();
    }

    if (e.key === "Delete") {
      handleRemove();
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveSelection(1);
    }
    // ... more shortcuts
  };

  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [selectedItems]);
```

---

## Touch Gestures (Mobile)

### Native Browser Support

| Gesture        | Native?                | Implementation        | Use Case          |
| -------------- | ---------------------- | --------------------- | ----------------- |
| **Long Press** | ✅ Yes                 | `onContextMenu` event | Show context menu |
| **Double Tap** | ⚠️ Conflicts with zoom | Custom timer          | Optional select   |
| **Swipe**      | ❌ No                  | Library or skip       | Skip for MVP      |

### Long Press (Native)

```tsx
// Works on mobile browsers
<tr onContextMenu={(e) => {
  e.preventDefault(); // Prevent default browser menu
  setShowContextMenu(true);
  setContextItem(item);
}}>
```

### Double Tap (Optional)

```tsx
const [lastTap, setLastTap] = useState(0);

const handleTouchEnd = () => {
  const now = Date.now();
  if (now - lastTap < 300) {
    // Double tap detected
    toggleSelect(item.id);
  }
  setLastTap(now);
};
```

### Swipe Gestures (Skipped for MVP)

- **Complexity**: Requires library like `react-swipeable`
- **Conflicts**: May interfere with scroll
- **Alternative**: Always show checkboxes on mobile (simpler UX)

### Decision

✅ Long-press for context menu (native)  
✅ Always show checkboxes on mobile (no double-tap needed)  
❌ Skip swipe gestures for MVP

---

## Context Menus

### Unified Component (Desktop + Mobile)

**Component**: Radix UI Context Menu (via shadcn)

- ✅ Long-press support out of the box
- ✅ Roving tabindex for keyboard navigation
- ✅ Full ARIA support for accessibility

**Keyboard Interactions:**

- `Enter` / `Space`: Activate focused item
- `↓`: Move to next item
- `↑`: Move to previous item
- `→`: Open submenu (when on SubTrigger)
- `Esc`: Close menu

```tsx
// Works on both platforms
<ContextMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    {/* Menu items */}
  </DropdownMenuContent>
</DropdownMenu>
```

### Trigger Methods

- **Desktop**: Click `•••` button OR right-click row
- **Mobile**: Long-press row (shows same dropdown)

### Menu Items by Element Type

**Label Context Menu:**

- Edit Icon
- Rename
- Toggle Visibility
- Group Categories (multi-select checkboxes)
- Auto-Order Toggle (Switch component)
- Delete (goes to /admin/labels for actual deletion)

**Category Context Menu:**

- Rename
- Toggle Visibility
- Assign to Labels (multi-select checkboxes)
- Assign Products (opens dialog/checkbox view)
- Delete (goes to /admin/categories)

**Product Context Menu:**

- Remove from Category
- Move to Another Category (shows category picker)
- View/Edit Product (link to /admin/products/[id])

**Empty Space Context Menu:**

- Paste (if clipboard has compatible items)
- Expand All / Collapse All

### Implementation Pattern (from LabelsTable)

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-60">
    <DropdownMenuLabel>Label</DropdownMenuLabel>
    <DropdownMenuItem onClick={() => startEdit(label)}>
      <Pencil className="h-4 w-4" />
      Rename
    </DropdownMenuItem>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Eye className="h-4 w-4" />
        Visibility
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuCheckboxItem
          checked={label.isVisible}
          onCheckedChange={() => toggleVisibility(label.id)}
        >
          Visible
        </DropdownMenuCheckboxItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
    {/* More items */}
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Visibility Controls

### Visibility by View

| View               | Element        | Component | Behavior                          |
| ------------------ | -------------- | --------- | --------------------------------- |
| **Menu**           | Label row      | Switch    | Toggles `CategoryLabel.isVisible` |
| **Menu**           | Category child | Eye icon  | Read-only indicator (inherited)   |
| **Menu**           | Product child  | Eye icon  | Read-only indicator (inherited)   |
| **Label**          | Category row   | Eye icon  | Read-only indicator               |
| **Category**       | Product row    | Eye icon  | Read-only indicator               |
| **All-Labels**     | Label row      | Switch    | Toggles `CategoryLabel.isVisible` |
| **All-Categories** | Category row   | Switch    | Toggles `Category.isVisible`      |

### Switch vs Eye Icon Logic

- **Switch**: User can toggle (main rows in menu/all-views)
- **Eye**: Read-only indicator (child rows, drill-down views)

### Bulk Visibility

- Select multiple items
- Action bar "Toggle Visibility" button (shows in all-views)
- Updates all selected items at once

### Implementation

```tsx
// Switch (interactive)
<Switch
  checked={item.isVisible}
  onCheckedChange={(checked) => updateVisibility(item.id, checked)}
  onClick={(e) => e.stopPropagation()}
/>

// Eye icon (read-only)
<Eye className="h-4 w-4 text-muted-foreground" />
```

---

## Component Architecture

### Page Structure

```
app/admin/(product-menu)/
├── menu-builder/
│   ├── page.tsx                    # Server component wrapper
│   ├── MenuBuilderClient.tsx      # Main client component
│   └── components/
│       ├── MenuNavBar.tsx          # Navigation breadcrumb
│       ├── MenuActionBar.tsx       # Context-aware actions
│       ├── MenuTable.tsx           # Unified table for all views
│       ├── MenuTableHeader.tsx     # Different headers per view
│       ├── MenuTableRow.tsx        # Row with inline edit, drag, menu
│       ├── MenuSettingsDialog.tsx  # Edit menu icon + text
│       └── SortDropdown.tsx        # Sort menu component
```

### Reusable Components (from existing)

```
components/admin/
├── LabelsTable.tsx                 # Reference for inline edit patterns
└── menu-builder/
    ├── MenuDataTable.tsx           # TanStack React Table wrapper
    ├── MenuColumns.tsx             # Column definitions
    └── MenuRowActions.tsx          # Context menu for rows

components/ui/
├── button-group.tsx                # New/Add combined button
├── item.tsx                        # Navigation breadcrumb items
├── kbd.tsx                         # Keyboard shortcuts display
├── empty.tsx                       # Empty states
├── sonner.tsx                      # Toast notifications
├── context-menu.tsx                # Long-press + right-click menus
├── switch.tsx                      # Visibility toggles
├── dialog.tsx                      # Settings, confirmations
├── dropdown-menu.tsx               # Dropdown menus
├── input.tsx                       # Inline editing
└── data-table/                     # TanStack table components
    ├── data-table.tsx
    ├── data-table-pagination.tsx
    └── data-table-toolbar.tsx
```

### State Management

```tsx
// SWR for data fetching
const { data: menuData, mutate } = useSWR("/api/admin/menu/hierarchy");

// Local UI state
const [currentView, setCurrentView] = useState<View>("menu");
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
const [editingId, setEditingId] = useState<string | null>(null);
const [clipboard, setClipboard] = useState<ClipboardItem[]>([]);
const [undoStack, setUndoStack] = useState<UndoOp[]>([]);
const [redoStack, setRedoStack] = useState<UndoOp[]>([]);
```

### Server Actions

```typescript
// app/admin/(product-menu)/actions/menu.ts
"use server";

export async function createLabel(data: CreateLabelInput) {}
export async function updateLabel(id: string, data: UpdateLabelInput) {}
export async function deleteLabel(id: string) {}
export async function reorderLabels(ids: string[]) {}

export async function createCategory(data: CreateCategoryInput) {}
export async function updateCategory(id: string, data: UpdateCategoryInput) {}
export async function deleteCategory(id: string) {}
export async function reorderCategories(labelId: string, ids: string[]) {}

export async function assignProductToCategory(
  productId: string,
  categoryId: string
) {}
export async function removeProductFromCategory(
  productId: string,
  categoryId: string
) {}
export async function reorderProductsInCategory(
  categoryId: string,
  ids: string[]
) {}

export async function attachCategoryToLabel(
  categoryId: string,
  labelId: string
) {}
export async function detachCategoryFromLabel(
  categoryId: string,
  labelId: string
) {}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

- [x] Mock2 prototype complete
- [ ] Convert mock2 to real data (SWR hooks)
- [ ] Wire up existing server actions
- [ ] MenuNavBar component with dropdowns
- [ ] Basic table rendering for all 5 views

### Phase 2: Interactions (Week 2)

- [ ] Inline editing (name, icon)
- [ ] Drag & drop reordering
- [ ] Visibility toggles
- [ ] Context menus (adapted from LabelsTable)

### Phase 3: Advanced Features (Week 3)

- [ ] Product assignment in category view
- [ ] Clone operations with name suffixing
- [ ] Remove operations with undo toasts
- [ ] Sort dropdown with options

### Phase 4: Polish (Week 4)

- [ ] Undo/redo system with session storage
- [ ] Keyboard shortcuts
- [ ] Touch gestures (long-press)
- [ ] Loading states and error handling
- [ ] Empty states
- [ ] Validation and conflict detection

---

## Testing Checklist

### Unit Tests

- [ ] Name collision handling (Copy suffix logic)
- [ ] Undo/redo stack operations
- [ ] Keyboard shortcut handlers
- [ ] Sort algorithm correctness

### Integration Tests

- [ ] Label CRUD operations
- [ ] Category CRUD operations
- [ ] Product assignment/removal
- [ ] Drag-and-drop reordering
- [ ] Visibility toggle persistence

### E2E Tests

- [ ] Complete walkthrough: empty → label → category → product
- [ ] Clone label with all children
- [ ] Remove and undo operations
- [ ] Multi-select and bulk operations
- [ ] Navigate between all 5 views
- [ ] Mobile touch interactions

### Accessibility Tests

- [ ] Keyboard navigation works
- [ ] Screen reader announces state changes
- [ ] Focus management on dialogs
- [ ] ARIA labels present
- [ ] High contrast mode support

---

## Open Questions & Future Enhancements

### Deferred for Post-MVP

- Command palette (Cmd+K) - too complex
- Live preview panel - separate feature
- Multi-menu support - edge case
- Category nesting - not in schema
- Product multi-category - already supported
- Visual drop zone indicators - nice-to-have
- Touch swipe gestures - low value
- Keyboard reordering (without @dnd-kit) - a11y gap

### Schema Questions (Answered)

✅ Products can have different order per category - YES (`CategoriesOnProducts.order`)  
✅ Categories can have different order per label - YES (`CategoryLabelCategory.order`)  
✅ Products can belong to multiple categories - YES (many-to-many)  
✅ Auto-order for labels - YES (`CategoryLabel.autoOrder`)

### UX Questions (Decided)

✅ Delete behavior - NO deletion in builder, go to Labels/Categories pages  
✅ Copy vs Clone - CLONE only (one operation, not two)  
✅ Mobile checkboxes - Always visible (not double-tap)  
✅ DnD library - Native HTML5 for MVP  
✅ Sort scope - Context-sensitive (selected items only)

---

## Success Metrics

### Performance

- [ ] Page load < 2 seconds (with 50+ products)
- [ ] Drag operation lag < 100ms
- [ ] Search/filter results < 500ms

### User Experience

- [ ] Time to build menu from scratch < 10 minutes
- [ ] Zero orphaned categories after using builder
- [ ] Admin satisfaction score > 8/10

### Support

- [ ] Reduce category management tickets by 75%
- [ ] Zero "how do I..." questions after onboarding

---

## Dependencies

### Already in Project ✅

- Prisma schema (verified and complete)
- SWR for data fetching
- shadcn UI components:
  - ✅ Button, Input, Switch, Dialog, DropdownMenu, Table
  - Need to add: Button Group, Item, Kbd, Empty, Sonner, Context Menu
  - TanStack React Table (for data-table pattern)
- Server actions structure
- LabelsTable as reference implementation

### Need to Install ❌

- None (using native DnD)
- Optional: `react-swipeable` if we add swipe gestures later
- Optional: `@dnd-kit` if we need touch/keyboard DnD

---

## Acceptance Criteria

### Core Functionality

- [ ] All 5 views render correctly with real data
- [ ] Navigation between views works seamlessly
- [ ] Inline editing saves to database
- [ ] Drag & drop reorders items
- [ ] Visibility toggles persist
- [ ] Context menus show appropriate actions

### Operations

- [ ] Clone creates new items with " Copy" suffix
- [ ] Remove hides items but doesn't delete from DB
- [ ] Undo/redo works for last 10 operations
- [ ] Sort applies to selected items only
- [ ] Keyboard shortcuts function correctly

### Responsive

- [ ] Mobile layout adapts appropriately
- [ ] Touch interactions work (long-press)
- [ ] Checkboxes always visible on mobile
- [ ] Tooltips show on both platforms

### Polish

- [ ] Loading states shown during operations
- [ ] Error messages are clear and actionable
- [ ] Empty states provide guidance
- [ ] Toasts dismiss after 3-5 seconds
- [ ] No console errors or warnings

---

## Notes for Implementation

### Critical Patterns to Reuse

1. **LabelsTable inline edit**: Input + Check/X buttons
2. **LabelsTable drag & drop**: Native HTML5 with GripVertical
3. **LabelsTable context menu**: DropdownMenu with sub-menus
4. **Mock2 navigation bar**: Breadcrumb with dropdowns
5. **Mock2 table structure**: 5-view switching logic

### Common Pitfalls to Avoid

1. Don't use `useEffect` for data fetching - use SWR
2. Don't forget `stopPropagation` on nested interactive elements
3. Don't hard-code menu icon - get from SiteSettings
4. Don't allow deletion - only hide/detach
5. Don't batch completions - mark operations complete immediately

### Performance Optimizations

1. Use `useMemo` for expensive filtering/sorting
2. Debounce search/filter inputs
3. Virtualize lists if > 100 items
4. Optimistic updates for instant feedback
5. Batch reorder operations

---

**End of Specification**
