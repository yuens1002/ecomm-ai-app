# Menu Builder State Management - Architectural Decision

**Date:** January 3, 2026  
**Issue:** Duplicate data fetching between `ProductMenuProvider` and `useMenuBuilder`

---

## 🚨 Problem Identified

We currently have **two separate systems** fetching the same data:

### **System 1: ProductMenuProvider (Existing)**

```tsx

ProductMenuProvider
  └─> useProductMenuData
      └─> listMenuData() // Fetches labels, categories, products, settings
```

### **System 2: useMenuBuilder (New)**

```tsx

useMenuBuilder
  ├─> useSWR("menu-labels") → listLabels()
  ├─> useSWR("menu-categories") → listCategories()
  └─> Separate settings extraction
```

**Issues:**

- ❌ Duplicate API calls
- ❌ Two separate SWR caches
- ❌ Potential data inconsistency
- ❌ Violates single source of truth

---

## ✅ Recommended Solution

**`useMenuBuilder` should consume from `ProductMenuProvider`, not duplicate it:**

```typescript

export function useMenuBuilder() {
  // ==================== DATA FROM PROVIDER ====================
  // Single source of truth - use existing ProductMenuProvider
  const {
    labels,
    categories,
    products,
    settings,
    isLoading,
    error,
    mutate,
    ...mutations // All CRUD operations
  } = useProductMenu();

  // ==================== UI STATE (Menu Builder Specific) ====================
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);

  // ... rest of menu builder logic
}
```

---

## 📊 Architecture Comparison

### **Current (Problematic):**

```tsx
MenuBuilder
    ├─> useMenuBuilder
    │   ├─> useSWR (labels)
    │   ├─> useSWR (categories)
    │   └─> useProductMenuMutations
    │
    └─> [Not using ProductMenuProvider]
```

### **Proposed (Correct):**

```tsx
<ProductMenuProvider>  ← Wraps entire (product-menu) section
    ├─> useProductMenuData (single SWR cache)
    ├─> useProductMenuMutations
    │
    └─> MenuBuilder
        └─> useMenuBuilder
            ├─> useProductMenu() ← Consumes from provider
            └─> Adds UI state (selections, navigation, etc.)
```

---

## 🔧 Implementation Steps

### **1. Refactor `useMenuBuilder` to consume from provider:**

**Remove:**

- useSWR calls to listLabels/listCategories
- Duplicate settings extraction
- Direct mutation imports

**Add:**

- `const {...} = useProductMenu()` at top
- Use provider's data, mutations, and cache management

### **2. Wrap MenuBuilder in ProductMenuProvider:**

**Before:**

```typescript

export default function MenuBuilder() {
  const {...} = useMenuBuilder();
  // ...
}
```

**After:**

```typescript

function MenuBuilderContent() {
  const {...} = useMenuBuilder();
  // ...
}

export default function MenuBuilder() {
  return (
    <ProductMenuProvider>
      <MenuBuilderContent />
    </ProductMenuProvider>
  );
}
```

### **3. Update action strategies to use provider mutations:**

Action strategies already receive mutations in context, so no changes needed there.

---

## ✅ Benefits

### **Performance:**

- ✅ Single API call instead of multiple
- ✅ One SWR cache, not two
- ✅ Automatic cache invalidation

### **Maintainability:**

- ✅ Single source of truth for data
- ✅ Mutations centralized in provider
- ✅ Easier to debug (one data flow)

### **Consistency:**

- ✅ All components see same data
- ✅ Updates propagate immediately
- ✅ No sync issues

---

## 📝 What to Keep in useMenuBuilder

`useMenuBuilder` should **only** manage:

✅ **UI State:**

- Selection state (checkboxes)
- Expand/collapse state
- Undo/redo stacks

✅ **Navigation:**

- URL param management
- View routing logic

✅ **Actions:**

- Combine UI state + provider mutations
- Strategy pattern integration

❌ **NOT Data Fetching:**

- Let ProductMenuProvider handle that

---

## 🎯 Action Plan

1. ✅ **Identify the issue** (Done - this document)
2. 🔄 **Refactor useMenuBuilder** to consume from ProductMenuProvider
3. 🔄 **Wrap MenuBuilder** in ProductMenuProvider
4. 🔄 **Test integration** - verify no duplicate calls
5. 🔄 **Update tests** to mock ProductMenuProvider
6. 🔄 **Update documentation** to reflect correct architecture

---

## 💡 Key Principle

> **Data fetching should happen in ONE place (ProductMenuProvider).**  
> **UI-specific state should happen in useMenuBuilder.**  
> **Never duplicate data sources.**

---

**Status:** Identified - Needs Refactoring  
**Priority:** High (architectural issue)  
**Effort:** ~30 minutes to refactor
