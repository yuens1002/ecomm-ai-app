# Retro Log

Running log of process lessons learned and applied. Each entry documents a gap discovered during a session, the root cause, and the durable fixes applied. See `.claude/skills/retro/SKILL.md` for the retro protocol.

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
