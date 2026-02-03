# Navigation Architecture

## Pub/Sub Pattern

The navigation system uses a publisher/subscriber architecture where:

1. **Publisher (Navigation API)**: The Route Registry and Navigation Core generate navigation state
2. **Subscribers**: UI components consume state via purpose-built hooks

```text
┌─────────────────────────────────────────────────────────────────┐
│                 Navigation API (Publisher)                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Route Registry - Single Source of Truth                │    │
│  │  - All navigable routes with parent/child hierarchy     │    │
│  │  - Match modes (exact, prefix, param)                   │    │
│  │  - Labels, icons, metadata                              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                    ┌─────────┴─────────┐                        │
│                    ▼                   ▼                        │
│  ┌─────────────────────┐  ┌─────────────────────────────┐      │
│  │ resolveRoute()      │  │ buildBreadcrumbChain()      │      │
│  │ (matches URL)       │  │ (builds trail from parents) │      │
│  └─────────────────────┘  └─────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Top Nav        │  │  Mobile Nav     │  │  Breadcrumbs    │
│  (Subscriber)   │  │  (Subscriber)   │  │  (Subscriber)   │
│                 │  │                 │  │                 │
│  Decides:       │  │  Decides:       │  │  Decides:       │
│  - Highlighting │  │  - Collapsible  │  │  - Show links   │
│  - Expand/      │  │  - Drawer style │  │  - Separators   │
│    collapse     │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Data Flow

```text
URL Change
    │
    ▼
┌─────────────────────────────────┐
│  NavigationProvider             │
│  - usePathname()                │
│  - useSearchParams()            │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│  resolveRoute(pathname, params) │
│  - Scores all routes            │
│  - Returns best match           │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│  Compute derived state:         │
│  - activeRoute                  │
│  - activeAncestorIds            │
│  - breadcrumbs                  │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│  NavigationContext.Provider     │
│  (provides state to hooks)      │
└─────────────────────────────────┘
    │
    ├──► useIsRouteActive()
    ├──► useHasActiveDescendant()
    ├──► useBreadcrumbTrail()
    └──► useActiveMenuBuilderView()
```

## Route Matching Algorithm

Routes are matched using a scoring system:

```typescript
function calculateMatchScore(route, pathname, searchParams): number {
  switch (route.matchMode) {
    case "exact":
      // Pathname must match exactly
      return pathname === route.pathname ? 100 : -1;

    case "param":
      // Pathname matches AND all query params match
      if (pathname !== route.pathname) return -1;
      for (const [key, value] of route.queryParams) {
        if (searchParams.get(key) !== value) return -1;
      }
      return 90 + Object.keys(route.queryParams).length;

    case "prefix":
      // Pathname starts with route pathname
      if (pathname.startsWith(route.pathname)) {
        return 50 + route.pathname.length / 10;
      }
      return -1;
  }
}
```

**Score priority:**

1. `param` match: 110+ points (more params = higher score) - most specific
2. `exact` match: 100 points
3. `prefix` match: 50+ points (longer prefix = higher score)

Param matches score highest because they require BOTH pathname AND query params to match, making them more specific than exact pathname-only matches.

## Design Decisions

### Why Purpose-Built Hooks?

**Problem with exposing raw state:**

```typescript
// Every component must translate state
const { activeRoute, activeAncestorIds } = useNavigation();
const isActive = activeRoute?.id === routeId || activeAncestorIds.has(routeId);
```

**Solution - hooks answer specific questions:**

```typescript
// Zero translation code
const isActive = useIsRouteActive(routeId);
```

**Benefits:**

- Components don't know internal state structure
- All matching logic in one place
- Type-safe return values
- Easier to change internals without breaking consumers

### Why Not Fix matchesNavChild()?

The buggy function was a symptom, not the cause. The real problem was:

- Navigation logic scattered across 3+ files
- No single source of truth
- Query params handled inconsistently

A centralized system prevents future bugs.

### Why Static Breadcrumbs?

Dynamic breadcrumbs (fetching product names from DB) would require:

- Importing Prisma into client bundles
- Async state management
- Loading states for every navigation

Instead:

- Navigation provides static trail (Home > Products > Coffees)
- Page components add entity names via `BreadcrumbContext`
- Data is already fetched by the page, no extra requests

## Component Integration

### AdminShell

```tsx
<Suspense fallback={null}>
  <NavigationProvider>
    <BreadcrumbProvider>
      {/* ... */}
    </BreadcrumbProvider>
  </NavigationProvider>
</Suspense>
```

### AdminTopNav

```tsx
function NavChildLink({ child }) {
  const isActive = useIsHrefActive(child.href);
  return <Link className={isActive ? 'active' : ''}>{child.label}</Link>;
}

function NavDropdown({ item }) {
  const hasActiveChild = useHasActiveDescendant(parentRouteId);
  return <Trigger className={hasActiveChild ? 'active' : ''}>...</Trigger>;
}
```

### AdminBreadcrumb

```tsx
function AdminBreadcrumb() {
  const navBreadcrumbs = useBreadcrumbTrail();  // Static trail
  const customItems = useBreadcrumbItems();      // Entity names

  return (
    <Breadcrumb>
      {[...navBreadcrumbs, ...customItems].map(item => (
        <BreadcrumbItem key={item.id}>{item.label}</BreadcrumbItem>
      ))}
    </Breadcrumb>
  );
}
```

## Testing

The navigation core has comprehensive unit tests:

```bash
npm run test:ci -- --testPathPatterns="navigation-core"
```

Key test scenarios:

- Route resolution with query params
- Menu Builder bug fix verification
- Ancestor ID computation
- Active state checking
