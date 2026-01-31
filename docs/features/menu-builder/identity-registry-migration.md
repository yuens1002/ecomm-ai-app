# Identity Registry Migration Plan

> Step-by-step migration from current architecture to unified IdentityRegistry.

## Current State

### Files to Migrate

| File | Current Role | Migration Action |
|------|--------------|------------------|
| `hooks/useContextSelectionModel.ts` | Selection + key utilities | Keep selection logic, move key utils to registry |
| `hooks/useFlattenedMenuRows.ts` | Row flattening + `buildMenuHierarchy` | Replace hierarchy builder with registry builder |
| `MenuTableView.tsx` | Complex per-view click handling | Use unified `useRowClickHandler` |
| `AllLabelsTableView.tsx` | Simple click handling | Use unified `useRowClickHandler` |
| `AllCategoriesTableView.tsx` | Simple click handling | Use unified `useRowClickHandler` |
| `CategoryTableView.tsx` | Simple click handling | Use unified `useRowClickHandler` |
| `LabelTableView.tsx` | Simple click handling | Use unified `useRowClickHandler` |
| `MenuTableView.types.ts` | Duplicate `CheckboxState` type | Remove, import from selection model |
| `constants/action-bar/actions.ts` | Uses `getIdFromKey` incorrectly | Use `registry.getEntityId()` |

### Current Key Flow

```
View builds key → Selection stores key → Action extracts ID (BROKEN)
     ↓                    ↓                       ↓
"category:L1-C1"    selectedIds has      getIdFromKey returns
                    "category:L1-C1"     "L1-C1" (wrong!)
```

### Target Key Flow

```
View builds registry → All systems use registry.get(key)
     ↓                           ↓
IdentityRegistry         { entityId: "C1", ... } (correct!)
```

---

## Migration Phases

### Phase 1: Create Core Types and Builders

**Files to create:**
- `types/identity-registry.ts`
- `hooks/useIdentityRegistry.ts`

**Steps:**

1. Create `RowIdentity` type
2. Create `IdentityRegistry` type
3. Implement `buildFlatRegistry()` for flat views
4. Implement `buildMenuHierarchyRegistry()` for MenuTableView
5. Add unit tests for builders

**Verification:**
- Types compile
- Builders produce correct output for sample data
- O(1) lookups work

---

### Phase 2: Create Unified Handlers

**Files to create:**
- `hooks/useRowClickHandler.ts`
- `hooks/useActionHandler.ts`

**Steps:**

1. Implement `useRowClickHandler` with:
   - `handleClick` (selection + expand sync)
   - `handleDoubleClick` (navigation)
2. Implement `useActionHandler` with:
   - `handleClone`
   - `handleRemove`
3. Handlers should work with ANY registry (flat or hierarchical)

**Verification:**
- Handlers work with mock registry
- No view-specific logic in handlers

---

### Phase 3: Migrate Flat Views First

**Order:** AllLabels → AllCategories → CategoryView → LabelView

**Per-view steps:**

1. Add `registry = useMemo(() => buildFlatRegistry(...), [data])`
2. Replace `createKey()` calls with registry key access
3. Replace inline click handlers with `useRowClickHandler`
4. Remove unused imports (`createKey`, `parseKey`, etc.)

**Example diff (AllLabelsTableView):**

```diff
- const selectableLabelKeys = useMemo(
-   () => labels.map((l) => createKey("label", l.id)),
-   [labels]
- );
+ const registry = useMemo(
+   () => buildFlatRegistry(labels, "label"),
+   [labels]
+ );

- onRowClick={() => onToggle(labelKey)}
- onRowDoubleClick={() => builder.navigateToLabel(label.id)}
+ onRowClick={() => handleClick(key)}
+ onRowDoubleClick={() => handleDoubleClick(key)}
```

**Verification per view:**
- Selection works (single, multi, select-all)
- Navigation works (double-click)
- Drag reorder works
- No regressions

---

### Phase 4: Migrate MenuTableView

**Steps:**

1. Replace `buildMenuHierarchy()` with `buildMenuHierarchyRegistry()`
2. Replace `handleRowClick` callback with `useRowClickHandler`
3. Replace `handleRowDoubleClick` callback with handler
4. Remove `useFlattenedMenuRows` hierarchy building (keep row flattening)
5. Update row render to use `registry.get(key)` for depth

**Key changes:**

```diff
- const hierarchy = useMemo(
-   () => buildMenuHierarchy(visibleLabels, products),
-   [visibleLabels, products]
- );
+ const registry = useMemo(
+   () => buildMenuHierarchyRegistry(visibleLabels, products),
+   [visibleLabels, products]
+ );

- const handleRowClick = useCallback((row: FlatMenuRow) => {
-   // 30+ lines of key building, expand sync, toggle
- }, [...]);
+ const { handleClick, handleDoubleClick } = useRowClickHandler(registry, {
+   onToggle: builder.toggleSelection,
+   onToggleWithHierarchy,
+   // ...
+ });
```

**Verification:**
- 3-level hierarchy renders correctly
- Selection cascade works (parent → children)
- Tri-state checkboxes work
- Expand/collapse syncs with selection
- Navigation works for all levels

---

### Phase 5: Migrate Action Bar

**Steps:**

1. Update action handlers to use `registry.getEntityId(key)`
2. Update action handlers to use `registry.getParentId(key)`
3. Pass registry to action bar context/props
4. Remove `getIdFromKey()` usage from actions

**Example diff (actions.ts):**

```diff
- const id = getIdFromKey(selectedIds[0]);
- const item = categories.find(c => c.id === id);
+ const identity = registry.get(selectedIds[0]);
+ const item = categories.find(c => c.id === identity?.entityId);
```

**Verification:**
- Clone action works for all entity types
- Remove action works for all entity types
- Actions receive correct database IDs

---

### Phase 6: Cleanup

**Steps:**

1. Remove `createKey`, `parseKey`, `getIdFromKey`, `getKindFromKey` from `useContextSelectionModel.ts`
2. Remove `buildMenuHierarchy` from `useFlattenedMenuRows.ts`
3. Remove duplicate `CheckboxState` from `MenuTableView.types.ts`
4. Update imports across codebase
5. Delete dead code

**Files to modify:**
- `useContextSelectionModel.ts` - Remove key utilities
- `useFlattenedMenuRows.ts` - Remove hierarchy builder
- `MenuTableView.types.ts` - Remove CheckboxState

---

## Migration Checklist

### Phase 1: Core Types
- [ ] Create `types/identity-registry.ts`
- [ ] Create `hooks/useIdentityRegistry.ts`
- [ ] Implement `buildFlatRegistry()`
- [ ] Implement `buildMenuHierarchyRegistry()`
- [ ] Add tests

### Phase 2: Unified Handlers
- [ ] Create `hooks/useRowClickHandler.ts`
- [ ] Create `hooks/useActionHandler.ts`
- [ ] Add tests

### Phase 3: Flat Views
- [ ] Migrate `AllLabelsTableView.tsx`
- [ ] Migrate `AllCategoriesTableView.tsx`
- [ ] Migrate `CategoryTableView.tsx`
- [ ] Migrate `LabelTableView.tsx`
- [ ] Verify each view works

### Phase 4: MenuTableView
- [ ] Replace hierarchy builder
- [ ] Replace click handlers
- [ ] Update row rendering
- [ ] Verify all features work

### Phase 5: Action Bar
- [ ] Update clone action
- [ ] Update remove action
- [ ] Update other actions
- [ ] Verify all actions work

### Phase 6: Cleanup
- [ ] Remove old key utilities
- [ ] Remove old hierarchy builder
- [ ] Remove duplicate types
- [ ] Delete dead code
- [ ] Final verification

---

## Rollback Plan

If issues arise during migration:

1. **Phase 1-2:** Safe to abandon, no production code changed
2. **Phase 3:** Revert individual view files
3. **Phase 4:** Revert MenuTableView.tsx
4. **Phase 5:** Revert action bar files
5. **Phase 6:** Don't start until all else verified

Each phase should be a separate commit for easy rollback.

---

## Testing Strategy

### Unit Tests
- Registry builders produce correct identities
- Handlers call correct callbacks
- Edge cases (empty data, single item, etc.)

### Integration Tests
- Selection works across all views
- Actions execute with correct IDs
- Navigation routes correctly

### Manual Testing
- Walk through all table views
- Test selection in each view
- Test actions (clone, remove) in each view
- Test undo/redo
- Test drag reorder

---

## Estimated Effort

| Phase | Effort | Risk |
|-------|--------|------|
| Phase 1: Core Types | Small | Low |
| Phase 2: Unified Handlers | Medium | Low |
| Phase 3: Flat Views | Medium | Low |
| Phase 4: MenuTableView | Large | Medium |
| Phase 5: Action Bar | Medium | Medium |
| Phase 6: Cleanup | Small | Low |

**Total:** Medium-large effort, phased for safety.
