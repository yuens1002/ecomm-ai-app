# Action Strategy Pattern - Refactoring Documentation

**Date:** January 3, 2026  
**Refactoring:** Replace if/else chains with declarative strategy pattern

---

## 🎯 Problem

**Before:** Actions had deeply nested if/else chains:

```typescript

const removeSelected = useCallback(
  async () => {
    if (selectedIds.length === 0) return;

    try {
      if (currentView === "menu" || currentView === "all-labels") {
        // Hide labels...
        await Promise.all(/*...*/);
        mutateLabels();
      } else if (currentView === "label" && currentLabelId) {
        // Detach categories...
        await Promise.all(/*...*/);
        mutateLabels();
      } else if (currentView === "category" && currentCategoryId) {
        // Detach products...
        await Promise.all(/*...*/);
      } else if (currentView === "all-categories") {
        // Hide categories...
        await Promise.all(/*...*/);
        mutateCategories();
      }

      clearSelection();
    } catch (error) {
      console.error(error);
    }
  },
  [
    /* many dependencies */
  ]
);
```

**Issues:**

- ❌ Hard to read - nested if/else chains
- ❌ Hard to maintain - adding new views requires modifying all actions
- ❌ Repetitive - same pattern in `cloneSelected`, `removeSelected`, `toggleVisibility`
- ❌ Error-prone - easy to forget to call the right mutate function
- ❌ Hard to test - need to test all conditional branches

---

## ✅ Solution: Strategy Pattern

**After:** Declarative configuration object:

```typescript

// actionStrategies.ts - Configuration
export const ACTION_STRATEGIES = {
  menu: {
    remove: {
      execute: async ({ selectedIds, mutations }) => {
        await Promise.all(
          selectedIds.map((id) =>
            mutations.updateLabel(id, { isVisible: false })
          )
        );
      },
      refresh: ["labels"],
      errorMessage: "Failed to hide labels from menu",
    },
    // ... other actions
  },
  label: {
    /* ... */
  },
  category: {
    /* ... */
  },
  // ... other views
};

// useMenuBuilder.ts - Usage
const removeSelected = useCallback(
  async () => {
    if (selectedIds.length === 0) return;

    const context = {
      selectedIds,
      currentLabelId,
      currentCategoryId,
      mutations,
      labels,
      categories,
      products,
    };

    const result = await executeAction("remove", currentView, context, {
      labels: mutateLabels,
      categories: mutateCategories,
    });

    if (!result.ok) {
      console.error("[useMenuBuilder] Remove failed:", result.error);
    }

    clearSelection();
  },
  [
    /* dependencies */
  ]
);
```

**Benefits:**

- ✅ Declarative - easy to see what each action does in each view
- ✅ Maintainable - adding new views or actions is just configuration
- ✅ DRY - no repetition across actions
- ✅ Testable - can test strategies in isolation
- ✅ Type-safe - TypeScript ensures all views are covered
- ✅ Self-documenting - configuration is the documentation

---

## 📊 Architecture

```tsx
┌─────────────────────────────────────────────────────────────┐
│                    ACTION_STRATEGIES                        │
│                  (Configuration Object)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  View: "menu"                                               │
│  ├── remove: { execute, refresh, errorMessage }            │
│  ├── clone: { execute, refresh, errorMessage }             │
│  └── toggleVisibility: { execute, refresh, errorMessage }  │
│                                                             │
│  View: "label"                                              │
│  ├── remove: { execute, refresh }                          │
│  └── clone: { execute, refresh }                           │
│                                                             │
│  View: "category"                                           │
│  ├── remove: { execute, refresh }                          │
│  └── clone: { execute, refresh }                           │
│                                                             │
│  ... (all 5 views)                                          │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              executeAction(type, view, context)             │
│                    (Strategy Executor)                      │
├─────────────────────────────────────────────────────────────┤
│  1. Lookup strategy: ACTION_STRATEGIES[view][type]         │
│  2. Execute: await strategy.execute(context)               │
│  3. Refresh: strategy.refresh.forEach(mutate)              │
│  4. Handle errors: return { ok, error }                    │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                    useMenuBuilder                           │
│                (Simplified Handlers)                        │
├─────────────────────────────────────────────────────────────┤
│  removeSelected: buildContext → executeAction → clear      │
│  cloneSelected: buildContext → executeAction → clear       │
│  toggleVisibility: buildContext → executeAction → clear    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Strategy Definition

Each strategy has three parts:

### 1. **Execute Function**

The actual logic to perform:

```typescript

execute: async (context: ActionContext) => {
  // Do the work
  await Promise.all(
    context.selectedIds.map((id) =>
      context.mutations.updateLabel(id, { isVisible: false })
    )
  );
};
```

### 2. **Refresh Array**

Which data to refresh after success:

```text

refresh: ["labels"]; // Will call mutateLabels()
refresh: ["labels", "categories"]; // Will call both
```

### 3. **Error Message** (Optional)

Custom error message for this strategy:

```text

errorMessage: "Failed to hide labels from menu";
```

---

## 📝 Adding a New View

**Before:** Modify 3+ action handlers with if/else

**After:** Add one configuration object:

```typescript

// actionStrategies.ts
export const ACTION_STRATEGIES = {
  // ... existing views

  "new-view": {
    remove: {
      execute: async ({ selectedIds, mutations }) => {
        // Your logic here
      },
      refresh: ["labels"],
      errorMessage: "Failed to remove items",
    },

    clone: {
      execute: async ({ selectedIds }) => {
        // Your logic here
      },
      refresh: ["labels"],
    },
  },
};
```

Done! All action handlers automatically work with the new view.

---

## 📝 Adding a New Action

**Before:** Create new function with if/else for all views

**After:** Add strategy for each view that supports it:

```typescript

// actionStrategies.ts
export const ACTION_STRATEGIES = {
  menu: {
    // ... existing actions

    newAction: {
      execute: async ({ selectedIds, mutations }) => {
        // Your logic
      },
      refresh: ["labels"],
    },
  },

  // Add for other views that support this action
};

// useMenuBuilder.ts - Minimal boilerplate
const handleNewAction = useCallback(
  async () => {
    if (selectedIds.length === 0) return;

    const context = buildContext();
    const result = await executeAction(
      "newAction",
      currentView,
      context,
      mutate
    );

    if (!result.ok) {
      console.error("New action failed:", result.error);
    }

    clearSelection();
  },
  [
    /* deps */
  ]
);
```

---

## 🧪 Testing Benefits

### **Before:**

```typescript

it("should remove labels in menu view", () => {
  // Mock currentView, selectedIds, mutations
  // Call removeSelected()
  // Assert mutations.updateLabel was called
  // Assert mutateLabels was called
});

it("should detach categories in label view", () => {
  // Mock currentView, selectedIds, currentLabelId, mutations
  // Call removeSelected()
  // Assert mutations.detachCategory was called
  // Assert mutateLabels was called
});

// ... 3 more tests for other views
```

### **After:**

```typescript

// Test strategies in isolation
describe("ACTION_STRATEGIES", () => {
  it("menu.remove should hide labels", async () => {
    const strategy = ACTION_STRATEGIES.menu.remove;
    const context = createMockContext();

    await strategy.execute(context);

    expect(context.mutations.updateLabel).toHaveBeenCalled();
  });

  it("label.remove should detach categories", async () => {
    const strategy = ACTION_STRATEGIES.label.remove;
    const context = createMockContext();

    await strategy.execute(context);

    expect(context.mutations.detachCategory).toHaveBeenCalled();
  });
});

// Test executor
describe("executeAction", () => {
  it("should execute strategy and refresh", async () => {
    const result = await executeAction("remove", "menu", context, mutate);

    expect(result.ok).toBe(true);
    expect(mutate.labels).toHaveBeenCalled();
  });

  it("should return error for unsupported action", async () => {
    const result = await executeAction("invalid", "menu", context, mutate);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("not available");
  });
});
```

---

## 📊 Code Metrics

### **Lines of Code:**

- Before: ~120 lines across 3 action handlers
- After: ~80 lines in strategies + ~40 lines in handlers = **120 lines** (but much cleaner!)

### **Cyclomatic Complexity:**

- Before: 5-6 per action handler (lots of branches)
- After: 1 per action handler (no branches)

### **Maintainability:**

- Before: Modify 3+ places to add a view
- After: Modify 1 place (configuration)

---

## ✅ Summary

**Key Improvement:** Replace imperative if/else chains with declarative strategy configuration.

**Result:**

- Cleaner code
- Easier maintenance
- Better testability
- Self-documenting
- Type-safe
- Single source of truth for action behavior

**Pattern:** Strategy Pattern + Configuration Object = Win! 🎉
