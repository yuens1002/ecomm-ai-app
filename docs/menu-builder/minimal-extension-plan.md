# Menu Builder - Minimal State Extension Plan

**Date:** January 3, 2026  
**Goal:** Extend ProductMenuProvider with ONLY menu-builder UI state, keep rest untouched

---

## 🎯 Core Principle

**"Don't expand the surface area - only extend what exists for menu-builder needs"**

- ✅ Labels/Categories pages stay as-is (they work fine)
- ✅ ProductMenuProvider stays as-is (it works fine)
- ✅ Only add menu-builder specific UI state to provider
- ✅ Let sub-components (action bar, nav, tables) get their own data needs

---

## 📊 Current Architecture (What Works)

```
ProductMenuProvider (EXISTS, WORKS)
  ├─> useProductMenuData (data fetching)
  └─> useProductMenuMutations (CRUD operations)

Labels Page (EXISTS, WORKS)
  └─> uses useProductMenuData directly

Categories Page (EXISTS, WORKS)
  └─> uses useProductMenuData directly

Menu Builder (NEW, NEEDS ONLY UI STATE)
  └─> needs: selections, navigation, expand/collapse
```

---

## ✅ Proposed Minimal Extension

### **Add to ProductMenuProvider: UI State Hook**

**New hook:** `useMenuBuilderState.ts` (UI state only)

```typescript
export function useMenuBuilderState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ==================== NAVIGATION (URL-backed) ====================
  const currentView = (searchParams.get("view") as ViewType) || "menu";
  const currentLabelId = searchParams.get("labelId") || undefined;
  const currentCategoryId = searchParams.get("categoryId") || undefined;

  // ==================== UI STATE (local) ====================
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // ==================== NAVIGATION ACTIONS ====================
  const navigateToView = useCallback(
    (view: ViewType) => {
      router.push(`/admin/menu-builder?view=${view}`);
      setSelectedIds([]); // Clear on navigation
    },
    [router]
  );

  const navigateToLabel = useCallback(
    (labelId: string) => {
      router.push(`/admin/menu-builder?view=label&labelId=${labelId}`);
      setSelectedIds([]);
    },
    [router]
  );

  // ... other navigation actions

  // ==================== SELECTION ACTIONS ====================
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // ==================== EXPAND/COLLAPSE ====================
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return {
    // Navigation state
    currentView,
    currentLabelId,
    currentCategoryId,

    // UI state
    selectedIds,
    expandedIds,

    // Navigation actions
    navigateToView,
    navigateToLabel,
    navigateToCategory,
    navigateBack,

    // Selection actions
    toggleSelection,
    selectAll,
    clearSelection,

    // Expand actions
    toggleExpand,
    expandAll,
    collapseAll,
  };
}
```

**Add to ProductMenuProvider:**

```typescript
export function ProductMenuProvider({ children }) {
  const data = useProductMenuData();
  const mutations = useProductMenuMutations();
  const builderState = useMenuBuilderState(); // ← Add this

  const value = {
    ...data,
    ...mutations,
    builder: builderState, // ← Namespaced!
  };

  return (
    <ProductMenuContext.Provider value={value}>
      {children}
    </ProductMenuContext.Provider>
  );
}
```

---

## 🏗️ Component Architecture

### **MenuBuilder.tsx (Compositional Container)**

```typescript
"use client";

export default function MenuBuilder() {
  // MenuBuilder is just composition - no logic
  return (
    <>
      <PageTitle title="Menu Builder" action={<MenuSettingsDialog />} />
      <MenuNavBar />
      <MenuActionBar />
      {/* Table views will go here */}
    </>
  );
}
```

**That's it!** Pure composition. No state management.

---

### **Sub-components get their own data:**

#### **MenuNavBar.tsx**

```typescript
export function MenuNavBar() {
  const {
    builder: { currentView, currentLabelId, navigateToView, ... },
    labels,
    categories,
    settings
  } = useProductMenu();

  // Use what it needs, render navigation
}
```

#### **MenuActionBar/index.tsx**

```typescript
export function MenuActionBar() {
  const {
    builder: { currentView, selectedIds, toggleSelection, ... },
    labels,
    categories,
    products,
    updateLabel,
    detachCategory,
    // ... mutations
  } = useProductMenu();

  // Use what it needs, render action buttons
}
```

#### **Future: MenuTableView**

```typescript
export function MenuTableView() {
  const {
    builder: { selectedIds, expandedIds, toggleSelection, toggleExpand },
    labels,
    categories,
  } = useProductMenu();

  // Render table with selections and expand/collapse
}
```

---

## 📝 What This Achieves

### **✅ Minimal Surface Area:**

- Only extends provider with UI state
- Doesn't touch labels/categories pages
- Doesn't change existing data fetching

### **✅ Clear Separation:**

- Data: `useProductMenuData` (unchanged)
- Mutations: `useProductMenuMutations` (unchanged)
- UI State: `useMenuBuilderState` (new, namespaced)

### **✅ Component Autonomy:**

- Each component gets exactly what it needs
- No prop drilling
- Easy to add/remove components

### **✅ Single Source of Truth:**

- All menu builder state in provider
- No duplicate fetching
- Consistent everywhere

---

## 🔧 Implementation Steps

### **Step 1: Create UI State Hook (NEW)**

```
File: hooks/useMenuBuilderState.ts
Purpose: UI state for menu builder only
Size: ~150 lines
```

### **Step 2: Extend Provider (MODIFY)**

```
File: ProductMenuProvider.tsx
Change: Add builder state under "builder" namespace
Lines: +3 lines
```

### **Step 3: Simplify MenuBuilder.tsx (SIMPLIFY)**

```
File: menu-builder/MenuBuilder.tsx
Change: Remove useMenuBuilder, just compose sub-components
Lines: Remove ~30 lines
```

### **Step 4: Update Sub-components (MODIFY)**

```
Files: MenuNavBar.tsx, MenuActionBar/index.tsx
Change: Get data from useProductMenu() instead of props
Lines: -props +useProductMenu()
```

### **Step 5: Delete useMenuBuilder (DELETE)**

```
File: hooks/useMenuBuilder.ts
Action: Delete (replaced by useMenuBuilderState in provider)
```

---

## ⚖️ Before vs After

### **Before (Current):**

```
useMenuBuilder (373 lines)
  ├─> Duplicates data fetching
  ├─> UI state
  ├─> Actions
  └─> Props to children

MenuBuilder
  └─> Gets everything from useMenuBuilder
      └─> Passes props to children
```

### **After (Proposed):**

```
ProductMenuProvider
  ├─> useProductMenuData (existing)
  ├─> useProductMenuMutations (existing)
  └─> useMenuBuilderState (new, 150 lines)

MenuBuilder
  └─> Pure composition (20 lines)
      ├─> MenuNavBar (gets own data from provider)
      ├─> MenuActionBar (gets own data from provider)
      └─> Table views (get own data from provider)
```

---

## 💾 Strategy Pattern Integration

**Action strategies stay the same**, just get mutations from provider:

```typescript
// constants/action-strategies.ts (NO CHANGE)
export const ACTION_STRATEGIES = {
  menu: {
    remove: {
      execute: async ({ selectedIds, mutations }) => {
        await Promise.all(
          selectedIds.map(id => mutations.updateLabel(id, { isVisible: false }))
        );
      },
      // ...
    }
  }
};

// Usage in MenuActionBar (gets from provider)
const {
  builder: { selectedIds, currentView },
  updateLabel,
  detachCategory,
  // ... all mutations
} = useProductMenu();

// Build context for strategies
const context = {
  selectedIds,
  currentView,
  mutations: { updateLabel, detachCategory, ... }
};
```

---

## 🎯 Benefits

### **Cognitive Load:**

- ✅ Much lower - provider does everything
- ✅ Components are simple - just render + hooks
- ✅ No prop drilling

### **Maintainability:**

- ✅ Add state → add to provider hook
- ✅ Add component → compose in MenuBuilder
- ✅ No cascade of prop changes

### **Performance:**

- ✅ Single data fetch
- ✅ Single cache
- ✅ Components only re-render when their data changes

### **Testing:**

- ✅ Mock provider once
- ✅ Test components in isolation
- ✅ Test UI state hook separately

---

## ⏱️ Execution Plan

### **Phase 1: Create UI State Hook (30 min)**

- Extract navigation + selection logic
- Add expand/collapse logic
- Return clean interface

### **Phase 2: Extend Provider (5 min)**

- Import UI state hook
- Add to provider value under "builder"

### **Phase 3: Simplify Components (20 min)**

- MenuBuilder → pure composition
- MenuNavBar → get from provider
- MenuActionBar → get from provider

### **Phase 4: Clean Up (10 min)**

- Delete useMenuBuilder.ts
- Update tests to mock provider

**Total: ~1 hour**

---

## ✅ Approval Checklist

- [ ] Understand: Only extend provider, don't touch other pages
- [ ] Agree: Components get their own data from provider
- [ ] Confirm: MenuBuilder is just composition
- [ ] Ready: Can proceed with implementation

---

**Status:** 📋 Plan Ready  
**Approach:** Minimal extension, maximum simplicity  
**Surface Area:** Only menu-builder, rest untouched  
**Cognitive Load:** Much lower ✅

---

**This is the right approach!** Minimal changes, leverages what exists, no unnecessary complexity. 🎯

Ready to implement?
