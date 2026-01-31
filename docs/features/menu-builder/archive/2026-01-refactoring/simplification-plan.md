# Menu Builder - State Management Simplification Plan

**Date:** January 3, 2026  
**Goal:** Reduce cognitive load by using existing ProductMenuProvider architecture

---

## 🎯 Current Situation Analysis

### **What We Have:**

1. **`ProductMenuProvider`** - Provides data + mutations
   - Already fetches: labels, categories, products, settings
   - Already provides: all CRUD mutations
   - Ready to use, just needs to be wrapped

2. **`useMenuBuilder`** - Our new hook with duplicated fetching
   - ❌ Duplicates data fetching (useSWR calls)
   - ✅ Adds UI state (selections, navigation, expand/collapse)
   - ✅ Adds action handlers (strategy pattern)

3. **Other pages** - Not using the provider
   - Labels page: Uses `useProductMenuData` directly
   - Categories page: Uses `useProductMenuData` directly
   - Menu Builder: Uses `useMenuBuilder` (duplicate)

### **The Problem:**

We created `useMenuBuilder` that **duplicates** the data fetching that `ProductMenuProvider` was designed to handle.

---

## ✅ **Proposed Solution: Simplify & Consolidate**

### **Architecture:**

```
app/admin/(product-menu)/
├── layout.tsx (NEW)
│   └── Wraps everything in <ProductMenuProvider>
│
├── labels/page.tsx
│   └── useProductMenu() ← from provider
│
├── categories/page.tsx
│   └── useProductMenu() ← from provider
│
└── menu-builder/
    ├── page.tsx
    └── MenuBuilder.tsx
        └── useMenuBuilder()
            ├── useProductMenu() ← from provider (data + mutations)
            └── Local UI state (selections, navigation, etc.)
```

---

## 📝 **What Needs to Change:**

### **1. Create Route Layout** (NEW FILE)

**File:** `app/admin/(product-menu)/layout.tsx`

```typescript
"use client";

import { ProductMenuProvider } from "./ProductMenuProvider";

export default function ProductMenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProductMenuProvider>{children}</ProductMenuProvider>;
}
```

**Purpose:** Wrap entire route group so all pages share the provider.

---

### **2. Simplify `useMenuBuilder`** (REFACTOR)

**File:** `app/admin/(product-menu)/hooks/useMenuBuilder.ts`

**Remove:**

```typescript
// ❌ Remove these
import useSWR from "swr";
import { listLabels } from "../actions/labels";
import { listCategories } from "../actions/categories";

const { data: labelsResponse, ... } = useSWR(...);
const { data: categoriesResponse, ... } = useSWR(...);
```

**Add:**

```typescript
// ✅ Add this
import { useProductMenu } from "../ProductMenuProvider";

export function useMenuBuilder() {
  // Get data from provider (single source of truth)
  const {
    labels,
    categories,
    products,
    settings,
    isLoading,
    error,
    mutate,
    // All mutations spread here
    updateLabel,
    updateCategory,
    detachCategory,
    // ... etc
  } = useProductMenu();

  // URL navigation state
  const currentView = ...;
  const currentLabelId = ...;

  // UI state
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Build mutations object for action strategies
  const mutations = {
    updateLabel,
    updateCategory,
    detachCategory,
    // ... etc
  };

  // ... rest of the hook
}
```

**Changes:**

- ✅ Remove duplicate data fetching
- ✅ Consume from `useProductMenu()`
- ✅ Keep all UI state management
- ✅ Keep all action handlers
- ✅ Keep strategy pattern integration

---

### **3. Update Other Pages** (OPTIONAL - for consistency)

**Files:**

- `app/admin/(product-menu)/labels/page.tsx`
- `app/admin/(product-menu)/categories/page.tsx`

**Before:**

```typescript
import { useProductMenuData } from "../hooks/useProductMenuData";

export default function Page() {
  const { labels, categories, isLoading } = useProductMenuData();
  // ...
}
```

**After:**

```typescript
import { useProductMenu } from "../ProductMenuProvider";

export default function Page() {
  const { labels, categories, isLoading } = useProductMenu();
  // ...
}
```

**Why:** Consistency - everyone uses the same provider.

---

## 📊 **What This Achieves:**

### **Before (Complex):**

```
Menu Builder
  └─> useMenuBuilder
      ├─> useSWR("labels") ← Duplicate fetch
      ├─> useSWR("categories") ← Duplicate fetch
      └─> useProductMenuMutations ← Duplicate import

Labels Page
  └─> useProductMenuData ← Different hook

Categories Page
  └─> useProductMenuData ← Different hook
```

### **After (Simple):**

```
<ProductMenuProvider> ← Wraps everything once
  │
  ├─> Menu Builder
  │     └─> useMenuBuilder
  │           ├─> useProductMenu() ← From provider
  │           └─> UI state (selections, etc.)
  │
  ├─> Labels Page
  │     └─> useProductMenu() ← From provider
  │
  └─> Categories Page
        └─> useProductMenu() ← From provider
```

---

## ✅ **Benefits:**

### **Simplicity:**

- ✅ One data source (ProductMenuProvider)
- ✅ All pages use same pattern
- ✅ No duplicate fetching
- ✅ Easier to understand

### **Performance:**

- ✅ Single SWR cache for entire route group
- ✅ Navigate between pages without refetch
- ✅ Mutations update all pages simultaneously

### **Maintainability:**

- ✅ Single place to modify data fetching
- ✅ Single place to add new mutations
- ✅ Clear separation: Provider = data, useMenuBuilder = UI

---

## 🎯 **What Stays the Same:**

### **useMenuBuilder keeps:**

- ✅ URL state management (navigation persistence)
- ✅ Selection state (checkboxes)
- ✅ Expand/collapse state
- ✅ Undo/redo stacks
- ✅ Action handlers (navigateToView, etc.)
- ✅ Strategy pattern integration
- ✅ BuilderState object construction

### **useMenuBuilder removes:**

- ❌ Data fetching (let provider handle it)
- ❌ Duplicate SWR calls
- ❌ Direct import of mutations

---

## 📝 **Implementation Checklist:**

### **Phase 1: Add Provider Wrapper**

- [ ] Create `app/admin/(product-menu)/layout.tsx`
- [ ] Wrap with `<ProductMenuProvider>`
- [ ] Test that provider is accessible in all pages

### **Phase 2: Refactor useMenuBuilder**

- [ ] Import `useProductMenu` from provider
- [ ] Remove `useSWR` calls for labels/categories
- [ ] Remove direct action imports
- [ ] Use provider's data, mutations, and mutate functions
- [ ] Keep all UI state and handlers
- [ ] Test that MenuBuilder still works

### **Phase 3: Update Tests**

- [ ] Update `useMenuBuilder.test.ts` to mock provider
- [ ] Verify all tests still pass
- [ ] Add integration test for provider

### **Phase 4: Update Other Pages (Optional)**

- [ ] Update labels page to use `useProductMenu()`
- [ ] Update categories page to use `useProductMenu()`
- [ ] Test navigation between pages

### **Phase 5: Update Documentation**

- [ ] Update architecture diagrams
- [ ] Update implementation guide
- [ ] Add provider usage examples

---

## ⚠️ **Potential Issues & Solutions:**

### **Issue 1: Tests Break**

**Solution:** Mock `useProductMenu` in tests instead of individual SWR calls

### **Issue 2: MenuBuilder breaks without provider**

**Solution:** Provider is required in layout, throws clear error if missing

### **Issue 3: Types mismatch**

**Solution:** Provider already has correct types, just use them

---

## 🚀 **Execution Order:**

1. **Create layout** (5 min) - Wrap route in provider
2. **Refactor useMenuBuilder** (15 min) - Use provider data
3. **Test manually** (10 min) - Verify everything works
4. **Update tests** (15 min) - Fix test mocks
5. **Update docs** (10 min) - Reflect new architecture

**Total Time:** ~1 hour

---

## 💡 **Key Principle:**

> **ProductMenuProvider provides data and mutations.**  
> **useMenuBuilder adds UI state and navigation logic.**  
> **Never duplicate data sources.**

---

## ✅ **Approval Checklist:**

Before proceeding, confirm:

- [ ] We understand the current problem (duplication)
- [ ] We agree on the solution (use provider)
- [ ] We have time to implement (~1 hour)
- [ ] We can test thoroughly after changes
- [ ] We're ready to update docs

---

**Status:** 📋 Plan Ready - Awaiting Approval  
**Estimated Effort:** 1 hour  
**Risk Level:** Low (reverting to existing pattern)  
**Cognitive Load:** Much Lower ✅

---

**Ready to proceed?** Let me know and we can execute this plan step by step! 🚀
