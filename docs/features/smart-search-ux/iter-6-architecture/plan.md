# Counter Iter-6: Architecture — Route SRP Refactor — Plan

**Branch:** `feat/counter-iter6`
**Base:** `main`
**Source:** `docs/features/smart-search-ux/iter-6-architecture/BUGS.md` (OBS-7, OBS-8 partial)

---

## Context

`app/api/search/route.ts` has grown to 1000+ lines across 5 iterations with 8+ distinct responsibilities: URL parsing, catalog snapshot building, NL heuristic detection (hardcoded stop words), extraction prompt construction, system prompt construction, Prisma query construction, app-side price sorting, cadence enforcement, and response serialization. This makes the file difficult to reason about, test, and modify — and every subsequent iter-7 behavior fix will land in an already-overloaded file.

This iteration is a **pure refactor** — no behavior change, no new features, no bug fixes. The goal is to establish clean module boundaries before behavior changes arrive in iter-7. Passing `npm run test:ci` and `npm run precheck` with zero regressions is the only success criterion.

**Target module structure:**

```text
lib/ai/
  extraction.ts       — buildExtractionPrompt(), extractAgenticFilters()
  prompts.ts          — buildSystemPrompt()
  catalog.ts          — buildCatalogSnapshot()
  voice-surfaces.ts   — already exists (unchanged)
  voice-surfaces.server.ts — already exists (unchanged)

types/
  search.ts           — FiltersExtracted, SearchParams, SearchResponse

app/api/search/
  route.ts            — orchestration only (~200 lines)
  __tests__/          — existing tests (imports updated, no logic change)
```

---

## Commit Schedule

| # | Message | Items | Risk |
|---|---------|-------|------|
| 0 | `docs: add plan for counter-iter6` | — | — |
| 1 | `refactor: extract FiltersExtracted type + SearchResponse to types/search.ts` | OBS-7, OBS-8 (types) | Low |
| 2 | `refactor: extract buildCatalogSnapshot to lib/ai/catalog.ts` | OBS-7 | Low |
| 3 | `refactor: extract buildExtractionPrompt + extractAgenticFilters to lib/ai/extraction.ts` | OBS-7 | Medium |
| 4 | `refactor: extract buildSystemPrompt to lib/ai/prompts.ts` | OBS-7 | Low |
| 5 | `refactor: slim route.ts to orchestration-only (~200 lines)` | OBS-7 | Medium |

---

## Acceptance Criteria

**→ See [`acs.md`](acs.md) for the full verification table (Agent / QC / Reviewer columns).**

12 ACs total: 2 UI (visual regression), 7 functional (code review), 3 test coverage.

---

## UX Flows

> Refactor-only — all UX flows are unchanged. No new states, no new error paths.

| Flow | Question | Answer |
|------|----------|--------|
| All existing | Do any Counter user journeys change? | No — pure code reorganization, zero behavior change |

---

## Implementation Details

### Pre-read required

Before writing any code, read these files to understand current structure:

- `app/api/search/route.ts` (full) — identify all function boundaries and data flow
- `app/api/search/__tests__/route.test.ts` — understand which imports will need updating
- `app/api/search/__tests__/build-system-prompt.test.ts` — same

### Commit 1: Types extraction

**File:** `types/search.ts` (new)

Move `FiltersExtracted` interface from `route.ts` to `types/search.ts`. Add `SearchResponse` type (shape of the JSON returned by the route). Add `SearchParams` type (parsed URL params). Update all `route.ts` references to import from `types/search.ts`.

### Commit 2: Catalog extraction

**File:** `lib/ai/catalog.ts` (new)

Move `buildCatalogSnapshot()` and its helper types from `route.ts` to `lib/ai/catalog.ts`. The function signature stays identical — only the file changes. Update `route.ts` import.

### Commit 3: Extraction extraction

**File:** `lib/ai/extraction.ts` (new)

Move `buildExtractionPrompt()` and `extractAgenticFilters()` from `route.ts`. Move the hardcoded NL stop words array (heuristic classification) here too — it belongs with extraction logic, not orchestration. Update `route.ts` import and all test imports.

This is the riskiest commit because `extractAgenticFilters` makes the AI API call — ensure the function signature (params, return type) is exactly preserved.

### Commit 4: System prompt extraction

**File:** `lib/ai/prompts.ts` (new)

Move `buildSystemPrompt()` from `route.ts`. Update `route.ts` import and test imports.

### Commit 5: Route slim

**File:** `app/api/search/route.ts`

After commits 1–4, `route.ts` should be reduced to: param parsing, auth/config checks, calls to the extracted functions, Prisma query construction, app-side sort, cadence enforcement, response serialization. Target ≤250 lines. If over budget, identify remaining candidates for extraction — but don't extract Prisma query logic yet (that's iter-7 scope).

---

## Files Changed (estimated 9 modified, 4 new)

| File | Commit | Notes |
|------|--------|-------|
| `types/search.ts` | 1 | New — FiltersExtracted, SearchParams, SearchResponse |
| `lib/ai/catalog.ts` | 2 | New — buildCatalogSnapshot |
| `lib/ai/extraction.ts` | 3 | New — buildExtractionPrompt, extractAgenticFilters, NL heuristics |
| `lib/ai/prompts.ts` | 4 | New — buildSystemPrompt |
| `app/api/search/route.ts` | 1–5 | Slimmed to orchestration; imports updated |
| `app/api/search/__tests__/route.test.ts` | 3, 4 | Import paths updated |
| `app/api/search/__tests__/build-system-prompt.test.ts` | 4 | Import path updated |
| `app/api/search/__tests__/integration/counter-cadence.integration.test.ts` | 3 | Import paths updated if any |
| `docs/features/smart-search-ux/iter-6-architecture/plan.md` | 0 | This plan |

---

## Verification & Workflow Loop

After plan approval:

1. Commit plan to branch: `git commit --no-verify -m "docs: add plan for counter-iter6"`
2. Register `verification-status.json`: `{ status: "planned", acs_total: 12 }`
3. Transition to `"implementing"` when coding begins

After implementation:

1. Transition to `"pending"`
2. Run `npm run precheck`
3. Run `npm run test:ci`
4. Spawn `/ac-verify` sub-agent — sub-agent fills **Agent** column
5. Main thread reads report, fills **QC** column
6. If any fail → fix → re-verify ALL ACs
7. When all pass → hand off ACs doc to human → human fills **Reviewer** column
