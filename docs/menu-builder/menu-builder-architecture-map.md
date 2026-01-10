# Menu Builder — Architecture Map (Forest View)

**Purpose:** Quick, high-signal map of “what drives what” so we can reason about the data-driven config model without re-reading the whole codebase.

**Last Updated:** January 9, 2026

---

## 1) Big Picture: Composition + Config + Data

```mermaid
flowchart TD
  Page[Menu Builder Page] --> Provider[MenuBuilderProvider]

  Provider --> DataHook[useProductMenuData (SWR fetch)]
  Provider --> MutationHook[useProductMenuMutations (SWR refresh)]
  Provider --> StateHook[useMenuBuilderState (URL + selection)]

  StateHook --> URL[URL params: view/labelId/categoryId]

  Provider --> ActionBar[MenuActionBar]
  Provider --> TableRenderer[TableViewRenderer]

  ActionBar --> ABC[ACTION_BAR_CONFIG]
  TableRenderer --> VC[VIEW_CONFIGS]

  MutationHook --> ServerActions[Server actions: actions/*]
  ServerActions --> DataLayer[Data layer: data/*]
  AdminApi[Admin API routes: app/api/admin/*] --> DataLayer

  DataLayer --> Prisma[Prisma client]
```

---

## 2) “Single Source of Truth” Table

| Concern                                      | Source of truth                    | What it decides                                              | Where it lives                                                                       |
| -------------------------------------------- | ---------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| View navigation state                        | URL params + `useMenuBuilderState` | `view`, selected entity IDs                                  | `app/admin/(product-menu)/hooks/useMenuBuilderState.ts`                              |
| Action bar UI + per-view behavior            | `ACTION_BAR_CONFIG`                | Buttons shown, execute logic, refresh targets                | `app/admin/(product-menu)/constants/action-bar-config.ts`                            |
| View surface metadata                        | `VIEW_CONFIGS`                     | `tableViewId`, feature flags, action IDs for future surfaces | `app/admin/(product-menu)/constants/view-configs.ts`                                 |
| Table component selection                    | `TableViewRenderer`                | `tableViewId → component` mapping                            | `app/admin/(product-menu)/menu-builder/components/table-views/TableViewRenderer.tsx` |
| DB access for product-menu labels/categories | Product-menu data layer            | Canonical Prisma operations + DTO mapping                    | `app/admin/(product-menu)/data/*`                                                    |

---

## 3) View Matrix (What the user sees vs what drives it)

This is the “trees in the forest” bridge: it tells you which config knobs matter per view.

| View (`builder.currentView`) | Table surface (`tableViewId`) | Expected primary rows                                     | Notes                             |
| ---------------------------- | ----------------------------- | --------------------------------------------------------- | --------------------------------- |
| `menu`                       | `placeholder` (for now)       | Labels (top-level), with nested categories/products later | Final target is 3-level hierarchy |
| `label`                      | `placeholder` (for now)       | Categories within a label                                 | Final target is 2-level hierarchy |
| `category`                   | `placeholder` (for now)       | Products within a category                                | Final target is product linking   |
| `all-labels`                 | `placeholder` (for now)       | Flat list of labels                                       | Good “Phase 2” table to ship next |
| `all-categories`             | `all-categories`              | Flat list of categories                                   | First real table view shipped     |

---

## 4) Pathway: Data-driven config without a rewrite

This is the anti-pipe-dream checklist: each step should be small enough to ship and validate.

| Milestone                               | Deliverable                                            | “Done means”                                                               |
| --------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------- |
| A. Config boundaries are stable         | Document what is config vs code                        | No business logic embedded in configs; configs reference IDs/capabilities  |
| B. Rendering is config-driven           | `tableViewId → component` registry                     | Adding a view table requires no view-specific `if` chains outside registry |
| C. Shared primitives reduce duplication | Shared table cells + patterns                          | The 2nd table view reuses cells with minimal copy/paste                    |
| D. Secondary surfaces reuse action IDs  | Context menus reference `ACTION_BAR_CONFIG` action IDs | One action definition powers action bar + context menus                    |
| E. Invariants are tested                | Config + DTO invariants tests                          | Regressions show up as small, focused test failures                        |

---

## 5) Action Bar Roadmap: “mixed config” → data-driven model

Today `ACTION_BAR_CONFIG` is _mostly_ declarative, but it also contains:

- execution logic (`execute[view](context)`)
- refresh/invalidation targets (`refresh[view]`)
- error message selection (`errorMessage[view]`)
- disabled/aria logic (`disabled(state)`, `ariaLabel(state)`)

That’s fine for early speed, but it’s the exact place where complexity quietly accumulates.

### 5.1 Current vs Target (Concept Diagram)

```mermaid
flowchart LR
  subgraph Current[Current]
   ABC[ACTION_BAR_CONFIG]
   ABC --> UI[UI metadata]
   ABC --> AVAIL[Per-view availability]
   ABC --> DISABLED[disabled/aria logic]
   ABC --> EXEC[execute logic]
   ABC --> EFFECTS[refresh + errors]
  end

  subgraph Target[Target (incremental split)]
   DEF[ACTION_DEFINITIONS\n(UI only)]
   AV[ACTION_AVAILABILITY\n(view → actionIds)]
   BEH[ACTION_BEHAVIORS\n(actionId → disabled/aria + handler)]
   EF[ACTION_EFFECTS\n(actionId+view → refresh + error)]
   HYDRATE[getActionsForView(view)\n(hydrates UI + behavior)]

   AV --> HYDRATE
   DEF --> HYDRATE
   BEH --> HYDRATE
   EF --> HYDRATE
  end
```

### 5.2 What becomes “data” vs “code”

| Piece                                        | Should be mostly data? | Why                                                                             |
| -------------------------------------------- | ---------------------: | ------------------------------------------------------------------------------- |
| UI metadata (label/icon/kbd/position/type)   |                    Yes | Stable; shouldn’t change per view very often                                    |
| Per-view availability (which actions appear) |                    Yes | It’s an authoring decision; keeps UI consistent                                 |
| Disabled/aria logic                          |            Mostly code | Needs real state; best centralized per actionId                                 |
| Execute logic                                |                   Code | It’s behavior (mutations + business rules), not “config”                        |
| Refresh targets + error messages             |               Data-ish | Often a small mapping; can live next to behavior but not inline per-view arrays |

### 5.3 Migration steps (roadmap)

1. **Extract `ACTION_DEFINITIONS` (UI-only)**

- Goal: the UI shape is declared once per actionId.
- Acceptance: changing an icon/label doesn’t touch any execute logic.

2. **Change `ACTION_BAR_CONFIG` to reference action IDs, not full objects**

- e.g. `ACTION_BAR_CONFIG[view] = ["new-label", "add-labels", "clone", ...]`
- Acceptance: per-view arrays become small and readable.

3. **Move execute logic into `ACTION_BEHAVIORS` keyed by `actionId`**

- One place to define behavior; views opt in via availability.
- Acceptance: no inline `execute` functions inside per-view arrays.

4. **Move refresh/error mapping into `ACTION_EFFECTS`**

- Centralize refresh keys and per-view error messages.
- Acceptance: action execution flow reads effects from a mapping (no ad hoc refresh logic).

5. **Hydrate at the boundary**

- Implement a single `getActionsForView(view)` that composes: definitions + availability + behaviors + effects.
- Acceptance: `MenuActionBar` consumes the hydrated model and stays dumb.

6. **Lock with invariants tests**

- Every `actionId` referenced by availability must exist in definitions.
- Every `actionId` that claims to be executable must have a behavior.
- Optional: effects coverage for actions that mutate.

---

## 6) Quick sanity questions (when reviewing a change)

- If a PR adds a new “view feature”, which source-of-truth should it live in: `ACTION_BAR_CONFIG`, `VIEW_CONFIGS`, or a table component?
- Does a UI behavior change require touching both menu-builder and admin API? If yes, should it be moved into the `data/*` layer?
- Does a config change force business logic duplication? If yes, it’s probably the wrong layer.
