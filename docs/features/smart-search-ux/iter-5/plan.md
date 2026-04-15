# Iter 5 — Plan

**Branch:** TBD
**Base:** `main` (after iter-4 merge)
**Status:** DRAFT — scope captured from iter-4 planning session (2026-04-15)

---

## Deferred from Iter-4

- **pgvector semantic search** — pulled from iter-4 commit 13. Pending extension/platform architecture decision: don't ship OSS infrastructure as a platform-gated feature. Needs a clear answer on where the line is between free OSS capability and platform service before implementation.

---

## Context

Iter-4 ships the embedded Counter preview panel in admin AI settings (commit 12b), giving admins a live test loop before changes reach customers. Iter-5 closes the final gap: voice settings don't go live the moment an admin edits them — they stay in draft until the admin has tested in the Counter preview and explicitly publishes.

**The problem with auto-save-to-live:**
Currently, editing a voice example auto-saves and immediately affects every customer interaction. An admin mid-edit — typing a half-finished answer — could produce incoherent AI responses live on the storefront. There's no staging layer, no confidence gate, no rollback.

**The publish gate closes this loop:**
- Voice examples and surface settings land in a `draft` state on save
- The embedded Counter preview (iter-4, commit 12b) runs against draft settings
- Admin tests until satisfied → clicks Publish
- Published settings replace live settings atomically
- Storefront Counter is unaffected until publish

---

## Key Design Decisions (to resolve during planning)

1. **Draft storage** — separate DB rows (e.g. `ai_voice_examples_draft`) or a `isDraft` flag on existing settings? Separate rows are cleaner for atomic publish.
2. **Rollback** — should Publish preserve the previous published version so admin can roll back? Likely yes — store `ai_voice_examples_published_prev`.
3. **Publish scope** — does the publish gate cover only voice examples, or also the Smart Search toggle and AI provider settings? Probably voice examples + generated surfaces only. Provider/model config is lower-risk and can stay auto-save.
4. **Counter preview isolation** — the embedded Counter (12b) must pass a `draft=true` flag to `/api/search` and `/api/settings/voice-surfaces` so it reads draft settings, not published. Storefront Counter never sends this flag.

---

## Planned Scope

| # | Commit | Scope | Risk |
|---|--------|-------|------|
| 0 | `docs: add plan for iter-5 voice publish gate` | — | — |
| 1 | `feat: draft voice settings DB layer — separate draft/published storage` | prisma schema, migration | Medium |
| 2 | `feat: auto-save writes to draft — decoupled from live settings` | ai-search/route.ts | Low |
| 3 | `feat: Counter preview reads draft settings via flag` | voice-surfaces/route.ts, search/route.ts | Medium |
| 4 | `feat: Publish action — atomically promotes draft to live, archives previous` | ai-search/route.ts, admin UI | Medium |
| 5 | `feat: admin publish UI — publish button, draft indicator, last-published timestamp` | AISearchSettingsSection.tsx | Medium |
| 6 | `feat: rollback — restore previous published version from archive` | ai-search/route.ts, admin UI | Low |
| 7 | `test: draft/publish lifecycle — save, preview, publish, rollback` | tests | Low |

---

## Dependencies

- **iter-4 commit 12b** (Counter preview panel in admin) must be shipped — iter-5 builds the publish gate on top of the preview panel
- **Prisma migration** required — backup before starting (`npm run db:backup`)

---

## Notes

- Draft/publish gate applies to: voice examples (`ai_voice_examples`), generated surfaces (`ai_voice_surfaces`)
- Does NOT apply to: AI provider settings (baseUrl, apiKey, model), Smart Search toggle — these remain auto-save
- The storefront Counter always reads the published settings — the `draft` flag is admin-only
