# Menu Builder - Documentation Hub

**Status:** Foundation + first table view shipped ✅  
**Last Updated:** January 8, 2026

---

## 📚 All Menu Builder Documentation

### **Main Documents**

1. **[menu-builder-implementation.md](./menu-builder-implementation.md)** ⭐ **START HERE**
   - Current architecture overview (provider composition)
   - URL state persistence
   - Action bar (`ACTION_BAR_CONFIG`) execution model
   - View config layer (`VIEW_CONFIGS`) and table rendering
   - How to add new views/actions

2. **[final-menu-builder-feature-spec.md](./final-menu-builder-feature-spec.md)**
   - Target UX + final table views
   - Hierarchy: Labels → Categories → Products

3. **[menu-builder-filesystem-ui.md](./menu-builder-filesystem-ui.md)**
   - UI metaphor and navigation concept

4. **[menu-builder-architecture-map.md](./menu-builder-architecture-map.md)**
   - “Forest view” diagrams (composition + configs + data layer)
   - View matrix + milestone checklist

---

## 🚀 Quick Start

### **Where to look in code**

- Provider + composition: `app/admin/(product-menu)/menu-builder/MenuBuilderProvider.tsx`
- UI state (URL + selection): `app/admin/(product-menu)/hooks/useMenuBuilderState.ts`
- Data fetch (SWR): `app/admin/(product-menu)/hooks/useProductMenuData.ts`
- Mutations (refresh on success): `app/admin/(product-menu)/hooks/useProductMenuMutations.ts`
- Action bar config (IDs + execute logic): `app/admin/(product-menu)/constants/action-bar-config.ts`
- View surface config (table/context-menu metadata): `app/admin/(product-menu)/constants/view-configs.ts`
- Table switcher (reads `VIEW_CONFIGS`): `app/admin/(product-menu)/menu-builder/components/table-views/TableViewRenderer.tsx`

---

## 🧩 Adding Features

### **Add a new table view**

1. Add a new `ViewType` (if needed) in `app/admin/(product-menu)/types/builder-state.ts`.
2. Add/adjust view entry in `app/admin/(product-menu)/constants/view-configs.ts`.
3. Implement your table in `app/admin/(product-menu)/menu-builder/components/table-views/`.
4. Add a new `tableViewId` and map it to your component in `TableViewRenderer.tsx`.

### **Add a new action**

1. Add an action definition to `app/admin/(product-menu)/constants/action-bar-config.ts` (ID, label, shortcuts, disabled logic).
2. Implement behavior in `action.execute[view]` using mutations from `useProductMenuMutations`.
3. If needed, add Zod schemas/types in `app/admin/(product-menu)/types/*` and use them in server actions + mutations.

---

## 📊 Current Status

### ✅ Implemented

- Provider-based architecture via `MenuBuilderProvider` + `useMenuBuilder()` context
- URL-backed navigation (`view`, `labelId`, `categoryId`) via `useMenuBuilderState`
- Action bar driven by `ACTION_BAR_CONFIG` (no view-specific switch statements)
- View surface config layer via `VIEW_CONFIGS` + `TableViewRenderer`
- `AllCategoriesTableView` wired under the `all-categories` view

### 🔜 Next

- Implement remaining view tables (`menu`, `label`, `category`, `all-labels`)
- Add row/bulk context menus using `VIEW_CONFIGS[view].actionIds` (planned surface)

---

## 📂 Key Paths

```
docs/menu-builder/
  menu-builder-README.md
  menu-builder-implementation.md

app/admin/(product-menu)/
  menu-builder/
    MenuBuilder.tsx
    MenuBuilderProvider.tsx
    components/
      menu-action-bar/
      table-views/
  hooks/
    useMenuBuilderState.ts
    useProductMenuData.ts
    useProductMenuMutations.ts
  constants/
    action-bar-config.ts
    view-configs.ts
```

---

## 🧪 Checks

```bash
npm run precheck

# Jest (CI mode)
npm run test:ci

# Or run the action bar config test only
npx jest --ci app/admin/(product-menu)/constants/__tests__/action-bar-config.test.ts
```

---

## 🤝 Contributing

### **Documentation Standards:**

1. Keep all menu builder docs in `/docs`
2. Update this README when adding new docs
3. Include date and status in all docs
4. Use code examples liberally
5. Link related documents

### **Code Standards:**

1. Follow existing patterns
2. Write tests for new features
3. Update type definitions
4. Document complex logic
5. Run linter before commit

---

## 💡 Key Concepts

### **1. Provider Composition**

`MenuBuilderProvider` composes data, mutations, and UI state into a single context.

### **2. URL-backed Navigation**

`useMenuBuilderState` persists `view`/IDs in the URL; selection/expand stay local.

### **3. Config-driven Actions**

`ACTION_BAR_CONFIG` is the source of truth for action bar buttons and per-view execution.

### **4. Config-driven Surfaces**

`VIEW_CONFIGS` declares which surfaces are present per view; `TableViewRenderer` selects the table component.

### **5. Type Safety**

Types live in `app/admin/(product-menu)/types/*` and Zod schemas validate server action payloads.

---

## 🎯 Goals

### **Accomplished (Phase 1):**

- ✅ Clean, maintainable architecture
- ✅ Single source of truth
- ✅ URL state persistence
- ✅ Config-driven action bar
- ✅ Precheck + Jest test coverage
- ✅ Full documentation

### **Upcoming (Phase 2):**

- 🔜 Table view components
- 🔜 Inline editing
- 🔜 Drag & drop
- 🔜 Keyboard shortcuts
- 🔜 Touch gestures
- 🔜 Undo/redo

---

## 📞 Need Help?

1. **Check documentation first:**
   - [Implementation guide](./menu-builder-implementation.md)
   - [Feature spec](./final-menu-builder-feature-spec.md)

2. **Review existing code:**
   - `app/admin/(product-menu)/menu-builder/MenuBuilderProvider.tsx`
   - `app/admin/(product-menu)/constants/action-bar-config.ts`
   - `app/admin/(product-menu)/constants/view-configs.ts`

3. **Ask the team!**

---

## 📝 Document History

| Date       | Version | Changes                                     |
| ---------- | ------- | ------------------------------------------- |
| 2026-01-03 | 1.0.0   | Phase 1 complete - Foundation & integration |
| 2026-01-08 | 1.1.0   | Updated docs to match current architecture  |

---
