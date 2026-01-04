# Menu Builder - Documentation Hub

**Status:** Phase 1 Complete ✅  
**Last Updated:** January 3, 2026

---

## 📚 All Menu Builder Documentation

### **Main Documents** (in `/docs`)

1. **[menu-builder-implementation.md](./menu-builder-implementation.md)** ⭐ **START HERE**
   - Complete Phase 1 implementation guide
   - Architecture overview
   - URL state persistence
   - Action strategy pattern
   - Testing guide
   - File structure
   - Next steps

2. **[final-menu-builder-feature-spec.md](./final-menu-builder-feature-spec.md)**
   - Complete feature specification
   - UI/UX design
   - Data model
   - All 5 table views
   - Action bar specifications
   - Navigation system

3. **[product-menu-builder-breakout.md](./product-menu-builder-breakout.md)**
   - Original planning document
   - Feature breakdown
   - Technical decisions

4. **[menu-builder-filesystem-ui.md](./menu-builder-filesystem-ui.md)**
   - UI concept documentation
   - File explorer metaphor
   - User experience design

---

## 🚀 Quick Start Guide

### **New to Menu Builder?**

1. **Understand the Feature:**
   - Read [final-menu-builder-feature-spec.md](./final-menu-builder-feature-spec.md) (overview)
   - Understand the 3-level hierarchy: Labels → Categories → Products

2. **Learn the Implementation:**
   - Read [menu-builder-implementation.md](./menu-builder-implementation.md) (complete guide)
   - Understand the architecture and state management

3. **Start Developing:**
   - Check existing code in `app/admin/(product-menu)/menu-builder/`
   - Review `hooks/useMenuBuilder.ts` - the main state hook
   - Review `hooks/actionStrategies.ts` - action configuration

### **Adding Features?**

**To add a new view:**

1. Add view type to `types/builder-state.ts`
2. Add strategy config to `hooks/actionStrategies.ts`
3. Add action bar config to `constants/action-bar-config.ts`
4. Create table component in `menu-builder/components/table-views/`
5. Add to MenuBuilder.tsx render switch

**To add a new action:**

1. Add action type to `hooks/actionStrategies.ts`
2. Add strategy for each view that supports it
3. Add button config to `constants/action-bar-config.ts`
4. Add handler to `hooks/useMenuBuilder.ts`
5. Write tests in `hooks/__tests__/`

---

## 📊 Project Status

### ✅ **Phase 1 Complete** (January 3, 2026)

**What's Built:**

- ✅ Central state management hook (`useMenuBuilder`)
- ✅ URL state persistence (navigation survives refresh)
- ✅ Action strategy pattern (no if/else chains)
- ✅ Action bar integration (buttons → strategies)
- ✅ Navigation system (breadcrumb with dropdowns)
- ✅ Comprehensive tests (hooks + strategies)

**Key Features:**

- Single source of truth for all state
- Declarative action configuration
- Type-safe throughout
- Fully tested
- Production-ready foundation

### 🔜 **Phase 2 Next** (Table Views)

**To Build:**

- [ ] Shared table components (CheckboxCell, ExpandToggle, etc.)
- [ ] AllLabelsTableView (flat list)
- [ ] AllCategoriesTableView (flat list)
- [ ] LabelTableView (2-level hierarchy)
- [ ] CategoryTableView (product linking)
- [ ] MenuTableView (3-level hierarchy)
- [ ] Drag & drop support
- [ ] Inline editing
- [ ] Integration tests

---

## 📂 Repository Structure

```
docs/
├── menu-builder-README.md ← You are here
├── menu-builder-implementation.md ← Complete guide
├── final-menu-builder-feature-spec.md ← Feature spec
├── product-menu-builder-breakout.md ← Planning
└── menu-builder-filesystem-ui.md ← UI concepts

app/admin/(product-menu)/
├── menu-builder/
│   ├── MenuBuilder.tsx ← Main container
│   ├── page.tsx
│   └── components/
│       ├── MenuNavBar.tsx
│       └── menu-action-bar/
│
├── hooks/
│   ├── useMenuBuilder.ts ← 📍 Main state hook
│   ├── actionStrategies.ts ← 📍 Action config
│   ├── useProductMenuMutations.ts
│   └── __tests__/
│
├── actions/ ← Backend API
│   ├── labels.ts
│   ├── categories.ts
│   └── products.ts
│
├── types/
│   ├── builder-state.ts
│   └── menu.ts
│
└── constants/
    └── action-bar-config.ts
```

---

## 🔗 Key Code Files

### **State Management:**

- `hooks/useMenuBuilder.ts` - Central state hook (373 lines)
- `constants/action-strategies.ts` - Action configuration (249 lines)
- `types/builder-state.ts` - Type definitions

### **Components:**

- `menu-builder/MenuBuilder.tsx` - Main container
- `menu-builder/components/MenuNavBar.tsx` - Navigation
- `menu-builder/components/menu-action-bar/index.tsx` - Action buttons

### **Backend:**

- `actions/labels.ts` - Label CRUD operations
- `actions/categories.ts` - Category CRUD operations
- `actions/products.ts` - Product operations (TODO)

### **Tests:**

- `hooks/__tests__/useMenuBuilder.test.ts` - Hook tests (285 lines)
- `hooks/__tests__/actionStrategies.test.ts` - Strategy tests (242 lines)

---

## 🧪 Testing

### **Run Tests:**

```bash
# All menu builder tests
npm test -- menu-builder

# Specific test files
npm test -- useMenuBuilder
npm test -- actionStrategies

# Watch mode
npm test -- --watch
```

### **Test Coverage:**

- ✅ State management (selection, navigation, expand/collapse)
- ✅ Action strategies (all view/action combinations)
- ✅ Strategy executor (executeAction function)
- ✅ Error handling

---

## 📖 Related Documentation

### **Within This Repo:**

- [Code Quality Standards](./CODE_QUALITY_STANDARDS.md) - Coding standards
- [Testing Guide](./testing-recurring-orders.md) - General testing patterns
- [Git Workflow](./git-workflow.md) - Git practices

### **External Resources:**

- [Next.js App Router](https://nextjs.org/docs/app) - Framework docs
- [SWR](https://swr.vercel.app/) - Data fetching
- [Prisma](https://www.prisma.io/docs) - Database ORM
- [shadcn/ui](https://ui.shadcn.com/) - UI components

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

### **1. Single Source of Truth**

All state managed by `useMenuBuilder()` hook. No duplicate state.

### **2. URL State Persistence**

Navigation state (view, labelId, categoryId) persists in URL for bookmarking and refresh.

### **3. Strategy Pattern**

Actions configured declaratively in `ACTION_STRATEGIES` object. No if/else chains.

### **4. Composition over Monolith**

Components receive state and actions as props. Small, focused, reusable.

### **5. Type Safety**

TypeScript throughout. No `any` types. Zod for runtime validation.

---

## 🎯 Goals

### **Accomplished (Phase 1):**

- ✅ Clean, maintainable architecture
- ✅ Single source of truth
- ✅ URL state persistence
- ✅ Strategy pattern for actions
- ✅ Comprehensive tests
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
   - `hooks/useMenuBuilder.ts` - State management
   - `hooks/actionStrategies.ts` - Action patterns
   - Tests for examples

3. **Ask the team!**

---

## 📝 Document History

| Date       | Version | Changes                                     |
| ---------- | ------- | ------------------------------------------- |
| 2026-01-03 | 1.0.0   | Phase 1 complete - Foundation & integration |
| -          | -       | Created comprehensive documentation         |
| -          | -       | Consolidated all docs to `/docs`            |

---

**Status:** ✅ Phase 1 Complete - Ready for Phase 2  
**Last Updated:** January 3, 2026  
**Maintained By:** Development Team
