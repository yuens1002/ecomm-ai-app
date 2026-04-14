# Retro Log

Running log of process lessons learned and applied. Each entry documents a gap discovered during a session, the root cause, and the durable fixes applied. See `.claude/skills/retro/SKILL.md` for the retro protocol.

---

## 2026-04-12 — Verification sub-agent spawned without ac-verify.md reference across session boundaries

**Gap:** On session resume on a `pending` branch (`feat/phase2-voice-cadence`), the main thread spawned a verification sub-agent without the mandatory first line `Run the AC verification protocol from .claude/commands/ac-verify.md.`. The sub-agent improvised its own conventions: screenshots saved to `verification-screenshots/phase-2-iter-2/` instead of `.screenshots/smart-search-verify/`, and Puppeteer script written to `scripts/verify-phase2-iter2.mjs` instead of the scratchpad. Both violations required manual cleanup. The QC process was also skipped — prose notes written at the bottom of the ACs doc instead of filling individual QC cells. This pattern recurred across multiple sessions.

**Root cause:** Two gaps:
1. The session-start hook for `pending`/`partial` states only said "Run /verify-workflow or /ac-verify before declaring done" — vague enough that the main thread interpreted it as permission to spawn any verification sub-agent, not necessarily one that references the skill file.
2. The exact sub-agent spawn template (with the mandatory first line) was buried inside `verify-workflow.md` with no special prominence — easy to miss when a session resumes mid-workflow without full context.

**Fix applied to:**
- `.claude/hooks/session-start-loop-node.js` — `pending` and `partial` cases now inject the exact mandatory first line, the sub-agent spawn template (copy-verbatim), and a specific warning referencing the 2026-04-12 incident.
- `.claude/commands/verify-workflow.md` — Added `⚠️ CRITICAL` callout block directly above the sub-agent spawn template making the first-line requirement impossible to miss.

**Prevented by:** Session-start hook now provides the exact spawn template with the first-line requirement in context at session start. The verify-workflow skill has a prominent warning that any sub-agent prompt missing the ac-verify.md reference will fail.

---

## 2026-04-10 — Verification sub-agent saved screenshots to docs/ and modified source files

**Gap:** Verification sub-agent (spawned for iter-3 ACs) saved Puppeteer screenshots to `docs/features/smart-search-ux/iter-3-voice-and-conversation/screenshots/` — a non-gitignored directory inside the project. Also accidentally modified `SiteHeader.tsx` and `layout.tsx` (reverting intentional layout changes) and created stray plan docs (`chat-lifecycle-ACs.md`, `chat-lifecycle-plan.md`) that were never requested.

**Root cause:** Three gaps in the ac-verify skill:
1. Rule 1 ("read, don't write") existed but wasn't strong enough — sub-agent still wrote to source files and created docs
2. No explicit rule specified WHERE screenshots must be saved — sub-agent chose a seemingly logical path inside the feature directory
3. The Puppeteer template showed `.screenshots/` in the `OUTPUT_DIR` but this wasn't marked as mandatory

**Fix applied to:**
- `.claude/commands/ac-verify.md` — Rule 1 rewritten as "Read, don't write — ever" with explicit prohibition on editing `.tsx`, `.ts`, `.md`, and any project file; added Rule 5 mandating `.screenshots/{feature-name}/` as the ONLY valid screenshot directory; updated Puppeteer template `OUTPUT_DIR` with mandatory comment
- `.gitignore` — Added `**/screenshots/` pattern to gitignore any `screenshots/` subdirectory anywhere in the project tree, as a safety net against future deviations

**Prevented by:** ac-verify Rule 5 now explicitly names `docs/`, `app/`, `lib/` as forbidden screenshot destinations. Rule 1 now says "ever" and names file types. `.gitignore` provides a last-line-of-defence catch even if a sub-agent deviates.

---

## 2026-03-28 — KV-2 fix + local QA test flow undocumented

**Gap:** After fixing `AC_HINTS["AC-KV-2"]` (wrong field label `"Email address"` → `"Email"`), the local test flow to reproduce and verify the fix was undocumented. We had to discover `qa:reset`, `STOP_AFTER`, and `RUN_ONLY` through trial and error rather than following documented steps. The doc update only happened after the user explicitly asked — it wasn't part of the fix.

**Root cause:** No rule in the retro protocol required updating the workflow doc as part of the fix. "Update the runbook" was treated as a follow-up, not as part of completing the fix.

**Fix applied to:**
- `scripts/qa-agent.js` — added `RUN_ONLY` and `STOP_AFTER` env var filters for targeted local testing
- `scripts/qa-reset.js` — new wrapper script; reads `QA_DATABASE_URL` from `.env.local`, auto-extracts Neon endpoint ID, calls `qa-teardown.js`
- `package.json` — added `qa:reset` npm script
- `docs/internal/runbook-qa-nightly.md` — replaced outdated "Local reproduction" section with accurate instructions covering all three run modes (`full`, `STOP_AFTER`, `RUN_ONLY`)
- `.claude/commands/retro.md` (global + project) — added Step 3.5 requiring doc updates as part of process fixes, and Principle 6 making it explicit

**Prevented by:** Retro protocol now has an explicit step: if a fix changes how a process is run, the workflow doc update is part of the fix — not a follow-up.

---

## 2026-03-15 — UI ACs verified without screenshots

**Gap:** All 24 UI ACs on `feat/support-plans-restructure` were verified via code review only — no Puppeteer screenshots were taken during `/ac-verify`, despite the workflow being designed for screenshot-based UI verification.

**Root cause:** Three enforcement gaps across three layers:
1. QC validator (`qc-validator.js`) accepted code evidence (file:line refs) as valid for UI ACs — it had no awareness of the How column's verification method
2. AC-verify skill (`SKILL.md`) categorized UI ACs by method but didn't enforce that screenshot-method ACs actually produce `.png` evidence
3. Templates (`acs-template.md`, `plan-template.md`) didn't document which How methods require screenshots vs code-only evidence

**Fix applied to:**
- `docs/templates/acs-template.md` — Added How column method table with evidence requirements and 50% screenshot rule
- `docs/templates/plan-template.md` — Added How column guidance in UI ACs section
- `.claude/hooks/qc-validator.js` — Added How-column parsing (`parseACTables` returns `how` field), `classifyHowMethod()` function, evidence-to-method matching (Rule 4), 50% screenshot minimum (Rule 6)
- `.claude/hooks/test-qc-validator.js` — Added 7 new tests: Screenshot How without screenshot evidence (Test 4), Code review How with file:line (Test 4b), all-code-review 50% rule (Test 10), mixed methods passing (Test 11), Interactive with screenshots (Test 12), Interactive without screenshots (Test 13)
- `.claude/skills/ac-verify/SKILL.md` — Replaced Step 1.5 with How-column validation, added mandatory pre-verification checks (count methods, enforce 50% rule, match evidence to How, never downgrade), added rules 10-11
- `docs/AGENTIC-WORKFLOW.md` — Added "How Column — Verification Methods for UI ACs" section with method table and screenshot method rules

**Prevented by:** QC validator now rejects screenshot-method ACs without `.png` evidence, flags plans where <50% of UI ACs use screenshot methods, and the ac-verify skill validates How methods before starting verification.

---

## 2026-03-16 — UI code patterns not applied by shadcn commands

**Gap:** shadcn MCP commands (`/rui`, `/iui`, `/cui`, `/ftc`) generated code using default shadcn patterns (Card wrappers, gap-6, full-width buttons) that conflicted with established project conventions. Every session required 10+ corrections for the same issues: flat cards vs Card wrappers, gap-4 vs gap-8, icon muting, button alignment, desktop max-width.

**Root cause:** Two gaps:
1. shadcn commands (`.claude/commands/*.md`) were bare wrappers with no project context — they called the MCP and blindly followed output
2. No UX flow review in the plan template — post-action behavior (auto-refresh, user response paths) was discovered late during implementation

**Fix applied to:**
- `.claude/commands/rui.md` — Added project code conventions block (flat cards, gap-4, max-w-[72ch], icon rules, button alignment, config-driven state)
- `.claude/commands/iui.md` — Same conventions block
- `.claude/commands/cui.md` — Same conventions block
- `.claude/commands/ftc.md` — Same conventions block
- `.claude/skills/ui-guide/SKILL.md` — NEW: design-only skill for loading visual language before UI work
- `docs/templates/plan-template.md` — Added "UX Flows" section (post-action, response, error, empty, loading)
- `~/.claude/projects/.../memory/ui_patterns_admin.md` — Canonical code pattern reference

**Prevented by:** All 4 shadcn commands now inject project conventions as a post-processing step. Plans now require explicit UX flow answers before implementation starts.

---

## 2026-03-16 — Corrections from prior sessions not carried to new sessions

**Gap:** UI corrections made in session N (flat cards, gap-4, icon muting, auto-refresh) were not applied in session N+1 on the same branch. The agent repeated the same mistakes because memory files are linked but not always proactively read.

**Root cause:** UI patterns were stored in memory (`ui_patterns_admin.md`) which is a linked file from `MEMORY.md`. Memory files are only read when the agent decides to check them — they're not in the always-loaded context. CLAUDE.md is the only file guaranteed to be in context every session.

**Fix applied to:**
- `CLAUDE.md` — Added "Admin UI conventions (always apply)" section under Code Quality with the 9 most critical rules (flat cards, gap-4, max-w-[72ch], spacing, CTAs, icons, clickable cards, auto-refresh, config-driven state)
- Also added `/ui-guide` reminder to the shadcn skills line

**Prevented by:** Critical UI conventions are now in CLAUDE.md (always loaded) rather than only in linked memory files. Every session starts with these rules in context.

---

## 2026-03-16 — Prior corrections reverted by subsequent edits

**Gap:** User asks for UI change A (e.g., flat cards). Agent applies it. User asks for change B on the same file (e.g., add badge). Agent edits from stale context and silently reverts change A. User has to re-request the same correction.

**Root cause:** The Edit tool uses string matching. When the agent works from a cached/stale version of the file (read earlier before change A was applied), the `old_string` may include pre-change-A content. The edit succeeds but overwrites change A with the stale version.

**Fix applied to:**
- `CLAUDE.md` — Added "Re-read before editing" rule as the first item under Must-have: if a file was modified earlier in the session (by agent or linter), always re-read before the next edit. Never edit from stale context.

**Prevented by:** The rule is in CLAUDE.md (always loaded) and positioned as the first code quality rule for visibility. The agent must re-read any previously-modified file before editing it again.

---

## 2026-04-14 — Admin nav active state regressed from naive pathname-prefix fix

**Gap:** A fix applied during `feat/counter-ux` (commit `37b29e4`) replaced `useHasActiveDescendant` with a direct pathname prefix check. The new check used `pathname.startsWith(childPath + "/")` — which is correct for most nav items but catastrophically wrong for Dashboard, whose Overview child has `href: "/admin"`. Since every admin page starts with `/admin/`, Dashboard lit up as active on every admin page. The regression shipped to main as part of a broader UX commit and wasn't caught until the next session.

**Root cause:** The navigation system docs (`docs/navigation/`) were not consulted before implementing the fix. The route registry and `useHasActiveDescendant` hook exist specifically to handle the `/admin` root-prefix edge case — but the fixer didn't know this and wrote a simpler (broken) alternative. The fix also didn't read `AdminTopNav.tsx` in context of the full navigation system.

**Fix applied to:**
- `lib/config/admin-nav.ts` — Added `routeId?: string` to `NavItem` type; wired `routeId` to route registry IDs for all 7 `adminNavConfig` items (e.g. `"admin.dashboard"`, `"admin.settings"`)
- `app/admin/_components/dashboard/AdminTopNav.tsx` — `NavDropdown` now uses `useHasActiveDescendant(item.routeId)` when `routeId` is present; falls back to pathname matching only for synthetic overflow "...More" item (no registry entry)
- `CLAUDE.md` — Added `docs/navigation/` to Critical Files section with explicit "Read before any admin nav change" instruction and warning about the Dashboard regression

**Prevented by:** `docs/navigation/` is now listed in CLAUDE.md Critical Files. The route registry + `useHasActiveDescendant` pattern is the canonical solution documented there — any nav fix that reads this doc will find the right approach before writing code.
