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
