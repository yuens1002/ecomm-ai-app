# Iter-6 — Counter Quality & Architecture

**Branch:** `feat/counter-iter6` (TBD)  
**Base:** `main` (after iter-5 merge)  
**Status:** PLANNING — bugs captured 2026-04-15, plan to be written in next session  
**Bug log:** `docs/features/smart-search-ux/iter-6/BUGS.md`

---

## Context

Post-ship manual spot-check of iter-5 revealed a cluster of quality and architectural gaps that share a common pattern: the Counter handles well-formed single-intent queries but breaks on merch discovery, comparison queries, and any scenario where the AI's acknowledgment and the actual product results diverge.

Three root causes underpin most surface bugs:

1. **Merch search path is fundamentally broken** — uses raw NL query string for `name/description ILIKE` match. No NL query phrase will ever match a product name reliably. Needs a `productKeywords` extraction step.

2. **Acknowledgment and products are independently generated** — two AI calls with no shared grounding. The acknowledgment can hallucinate products that don't appear in results.

3. **No prompt version tracking** — generation prompt changes don't auto-invalidate stored surfaces. The voice/DB mismatch recurs every iteration without a structural fix.

Additionally, two architectural debts need addressing:
- `route.ts` is 1000+ lines with 8+ responsibilities (SRP violation)
- `FiltersExtracted` TypeScript type and the extraction prompt JSON spec are two separate definitions that can drift

---

## Scope (from BUGS.md)

| ID | Summary | Priority |
|----|---------|---------|
| BUG-1 | Merch search broken — raw query string match | P0 |
| BUG-2 | Grounded truth mismatch — acknowledgment diverges from results | P0 |
| BUG-3 | Chip re-query fires full AI pipeline (no progressive filtering) | P1 |
| OBS-4 | Comparison/recommend intent shows product cards (should show `products: []`) | P1 |
| OBS-5 | Q&A verbatim examples bleed into AI voice | P1 |
| OBS-6 | Voice/DB mismatch is structural — no prompt version invalidation | P1 |
| OBS-7 | `route.ts` SRP violation (1000+ lines, 8+ responsibilities) | P2 |
| OBS-8 | `FiltersExtracted` and extraction prompt spec can drift — need Zod | P2 |
| GAP-9 | Test suite verifies prompt text, not product quality | P1 |
| GAP-10 | Named merch product lookup fails across intents | P2 (subsumed by BUG-1) |

---

## Deferred from Prior Iters

- **pgvector semantic search** — pulled from iter-4, pending platform/architecture decision on OSS vs. platform-gated feature
- **Draft/publish voice gate** — planned in the prior stale iter-6 draft (2026-04-15). Remains valuable but is lower priority than fixing the active Counter quality bugs. Defer to iter-7.

---

## Plan (to be written)

See `BUGS.md` for full root cause analysis and fix directions. When entering plan mode for iter-6:

1. Read `BUGS.md` fully — each bug has a root cause and 1–2 fix direction options
2. Confirm which fix direction to take for BUG-2 (unified call vs. post-query acknowledgment) and BUG-3 (client-side vs. server-side progressive filter) — both have trade-offs
3. Produce structured plan + ACs following `docs/templates/plan-template.md`
4. OBS-7 + OBS-8 (route refactor + Zod) are strong candidates for a separate PR with no behavior change — confirm with user whether to bundle or separate

**Suggested commit sequencing:**
1. `docs: add plan for counter-iter6` 
2. `fix: merch search — productKeywords extraction + keyword-based Prisma query` (BUG-1, GAP-10)
3. `fix: compare/recommend intent returns products: [] with AI reasoning` (OBS-4)
4. `fix: grounded truth — post-query acknowledgment constrained to actual results` (BUG-2)
5. `fix: extraction prompt examples neutralized — remove verbatim example phrases` (OBS-5)
6. `fix: prompt hash invalidation — auto-regen surfaces on prompt change` (OBS-6)
7. `test: counter-qa harness — 18 scenarios against live dev server` (GAP-9)
8. `fix: chip progressive filtering — client-side result narrowing` (BUG-3)
9. `refactor: route.ts SRP — split into extraction/prompts/catalog/types modules` (OBS-7, OBS-8, separate PR)

---

## Notes for Planning Session

- **Counter QA harness (GAP-9):** 18 scenarios were designed in the prior session. They cover: regression (existing working queries), cadence shape (acknowledgment + chips), merch path, comparison/recommendation, voice mismatch detection. Scenario list is in the session transcript. Build `scripts/counter-qa.ts`.
- **BUG-2 recommendation:** Post-query acknowledgment (Option B) is lower risk. Unified call (Option A) requires restructuring the extraction/generation flow. Start with B, revisit A in a future iter if latency is acceptable.
- **OBS-7 refactor:** This is a no-behavior-change PR. If sequenced last or as a separate branch, it won't block shipping quality fixes. But if done first, all subsequent fixes are easier to write and test.
