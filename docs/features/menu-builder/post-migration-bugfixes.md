# Post-Migration Bug Fixes

> Bug context captured during architecture review. These bugs should be fixed AFTER the IdentityRegistry migration is complete, using the new architecture.

## Bug #1: New Label Add Fails After First

### Symptoms
- First "New Label" creation works
- Second+ attempts fail silently
- No error shown to user

### Root Cause

**Location:** `app/admin/(product-menu)/actions/utils.ts:70-72`

```typescript

// Only catches Prisma errors, not manual uniqueness checks
export function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
```

**The problem:** `createCategoryLabel` in `data/labels.ts:93-94` throws a generic `Error("Label name must be unique")`, but `isUniqueConstraintError()` only recognizes Prisma constraint errors (P2002).

### Flow

```tsx
1. First "New Label" → Success (no conflict)
2. Second "New Label" → Manual uniqueness check finds existing
3. Throws Error("Label name must be unique")
4. isUniqueConstraintError() returns false
5. retryWithUniqueConstraint() re-throws instead of retrying
6. createNewLabel() catches and returns { ok: false }
7. UI doesn't show error (silent failure)
```

### Fix

**Option A:** Update `isUniqueConstraintError()` to also catch manual errors:

```typescript

export function isUniqueConstraintError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return true;
  }
  if (error instanceof Error && error.message.toLowerCase().includes("must be unique")) {
    return true;
  }
  return false;
}
```

**Option B:** Remove manual uniqueness check from `createCategoryLabel`, let Prisma constraint handle it:

```typescript

// In data/labels.ts - REMOVE these lines:
const existing = await prisma.categoryLabel.findUnique({ where: { name } });
if (existing) throw new Error("Label name must be unique");

// Let Prisma's unique constraint throw P2002 instead
```

**Recommended:** Option B is cleaner - single source of truth for uniqueness.

### Files to Modify
- `app/admin/(product-menu)/data/labels.ts` - Remove manual check
- OR `app/admin/(product-menu)/actions/utils.ts` - Expand error detection

### Testing
1. Create "New Label" → Success
2. Create another "New Label" → Should create "New Label (2)"
3. Create another → Should create "New Label (3)"

---

## Bug #2: Action Bar Items Don't Work in MenuTableView

### Symptoms
- Clone, Remove actions do nothing
- Undo/Redo buttons don't respond
- Actions work in other table views

### Root Cause

**Location:** Action handlers in `constants/action-bar/actions.ts`

MenuTableView uses **composite keys** but action handlers extract IDs incorrectly:

```typescript

// MenuTableView selection key
"category:labelId-categoryId"

// getIdFromKey() returns
"labelId-categoryId"  // WRONG - this is composite, not entity ID

// Action tries to find
categories.find(c => c.id === "labelId-categoryId")  // Never matches!
```

### Why This Is Fixed by Migration

After migration, action handlers will use:

```typescript

const identity = registry.get(selectedKey);
const entityId = identity.entityId;  // Returns "categoryId" (correct!)
categories.find(c => c.id === entityId);  // Matches!
```

### No Separate Fix Needed

This bug is **automatically resolved** by Phase 5 of the migration plan. The IdentityRegistry provides correct `entityId` extraction.

### Verification After Migration
1. Select a category in MenuTableView
2. Click Clone → Should clone the category
3. Click Remove → Should remove the category
4. Undo → Should restore
5. Redo → Should re-apply

---

## Bug #3: Duplicate CheckboxState Type

### Symptoms
- Type defined in two places
- Potential for drift
- Confusing imports

### Locations

```typescript
hooks/useContextSelectionModel.ts:14
  export type CheckboxState = "checked" | "indeterminate" | "unchecked";

menu-builder/components/table-views/MenuTableView.types.ts:15
  export type CheckboxState = "checked" | "indeterminate" | "unchecked";
```

### Fix

**In Phase 6 (Cleanup):**

1. Keep the type in `useContextSelectionModel.ts` (canonical location)
2. Remove from `MenuTableView.types.ts`
3. Update imports in `MenuTableView.tsx`:

```diff
- import type { CheckboxState } from "./MenuTableView.types";
+ import type { CheckboxState } from "../../../hooks/useContextSelectionModel";
```

Or better, after migration the type may move to `types/identity-registry.ts`.

### Verification
- TypeScript compiles
- No duplicate type definitions
- Single import source

---

## Bug Priority After Migration

| Bug | Fix Timing | Effort |
|-----|------------|--------|
| #1: Label add | Immediately after migration | Small |
| #2: Action bar | Resolved by migration | N/A |
| #3: Duplicate type | Phase 6 cleanup | Trivial |

---

## Additional Issues Found During Investigation

### Issue: Selection Clears on Navigation

**Observation:** Navigating between views clears selection (intentional behavior per `useMenuBuilderState.ts:73-78`).

**Not a bug** - this is expected UX. Selection is view-scoped.

### Issue: Undo Stack Not Populated for Selection Changes

**Observation:** Selecting/deselecting rows doesn't push to undo stack.

**Design decision:** Selection is transient UI state, not data mutation. Undo/redo is for data changes (name edits, reorders, visibility toggles).

**Not a bug** - working as designed.

---

## Testing Checklist (Post-Migration)

### Bug #1: Label Creation
- [ ] Create first label → Works
- [ ] Create second label → Creates with (2) suffix
- [ ] Create third label → Creates with (3) suffix
- [ ] Error handling → Shows error if actual failure

### Bug #2: Action Bar (Auto-fixed)
- [ ] Clone label in MenuTableView → Works
- [ ] Clone category in MenuTableView → Works
- [ ] Remove label in MenuTableView → Works
- [ ] Remove category in MenuTableView → Works
- [ ] Undo after remove → Restores item
- [ ] Redo after undo → Re-removes item

### Bug #3: Type Cleanup
- [ ] Single CheckboxState definition
- [ ] All imports point to canonical location
- [ ] TypeScript compiles clean
