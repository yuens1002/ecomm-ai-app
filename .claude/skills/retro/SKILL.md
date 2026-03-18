---
name: retro
description: Session retrospective — captures lessons learned and applies them to skills, templates, and validators
---

# Session Retrospective Skill

Captures process lessons from the current session and applies them as durable changes to skills, templates, validators, and workflow docs — so the same mistakes never happen twice.

## When to Use

- At the end of a session where a workflow gap was discovered
- When the user says "remember this for next time" about a process issue
- When a verification or QC cycle reveals a systemic gap (not just a one-off bug)
- When the user explicitly invokes `/retro`

## What This Skill Does NOT Do

- Store code patterns or architecture decisions (those belong in CLAUDE.md)
- Store user preferences (those belong in memory)
- Fix the current session's code bugs (fix those directly)

## The Retro Protocol

### Step 1: Identify Lessons

Review the current session and identify **process lessons** — gaps in how the workflow operated, not code bugs. Ask:

1. **What went wrong?** (e.g., "UI ACs were verified by code review only, no screenshots taken")
2. **Why did it happen?** (e.g., "The ac-verify skill didn't enforce How column methods, the validator accepted code evidence for screenshot ACs")
3. **What should have happened?** (e.g., "The sub-agent should have taken Puppeteer screenshots for every AC where How says Screenshot/Interactive/Exercise")

### Step 2: Classify Each Lesson

For each lesson, determine which layer(s) need updating:

| Layer | Files | When to update |
|-------|-------|----------------|
| **Skill** | `.claude/skills/*/SKILL.md` | Sub-agent behavior needs to change |
| **Template** | `docs/templates/*.md` | Plan/ACs structure needs new fields or guidance |
| **Validator** | `.claude/hooks/*.js` | Automated enforcement rule needs adding/changing |
| **Workflow doc** | `docs/AGENTIC-WORKFLOW.md` | Process description is incomplete or misleading |
| **Memory** | `~/.claude/projects/*/memory/` | User preference or project-specific context |

Most lessons touch **multiple layers** — a single gap usually needs fixes in the template (defines the contract), the skill (executes the contract), and the validator (enforces the contract).

### Step 3: Apply Changes

For each layer identified:

1. **Read the target file** to understand current state
2. **Draft the change** — add rules, constraints, or guidance that would have prevented the gap
3. **Apply the edit** — make it concrete and actionable, not vague
4. **Add tests** if the change is to a validator (update `test-qc-validator.js`)

### Step 4: Verify the Fix

- If a validator was changed: run its test suite (`node .claude/hooks/test-qc-validator.js`)
- If a skill was changed: mentally trace through the updated skill with the scenario that failed — would it now succeed?
- If a template was changed: check that existing ACs docs still conform

### Step 5: Log the Lesson

Create or update `.claude/skills/retro/retro-log.md` with the lesson. This is a running log, not a memory file — it's for auditing what was learned and when.

Format:

```markdown
## {Date} — {Session summary}

**Gap:** {What went wrong}
**Root cause:** {Why it happened}
**Fix applied to:**
- `{file1}` — {what was changed}
- `{file2}` — {what was changed}
**Prevented by:** {What enforcement now exists}
```

### Step 6: Commit

Commit all retro changes together:

```bash
git commit --no-verify -m "docs: retro — {brief description of lesson}"
```

Use `--no-verify` since these are docs/config changes only.

## Example: The Screenshot Gap (2026-03-15)

This is the founding example that motivated this skill:

**Gap:** All 24 UI ACs were verified via code review only — no Puppeteer screenshots were taken during `/ac-verify`, despite the workflow being designed for screenshot-based UI verification.

**Root cause:** Three enforcement gaps across three layers:
1. QC validator accepted code evidence for UI ACs (no How-column awareness)
2. AC-verify skill didn't enforce that screenshot-method ACs produce `.png` evidence
3. Templates didn't document which How methods require screenshots

**Fix applied to:**
- `docs/templates/acs-template.md` — Added How column method table with evidence requirements
- `docs/templates/plan-template.md` — Added How column guidance in UI ACs section
- `.claude/hooks/qc-validator.js` — Added How-column parsing, method classification, evidence matching, 50% screenshot rule
- `.claude/hooks/test-qc-validator.js` — Added 7 new tests for How-column enforcement
- `.claude/skills/ac-verify/SKILL.md` — Added Step 1.5 pre-verification How method validation, rules 10-11
- `docs/AGENTIC-WORKFLOW.md` — Added How column verification methods section

**Prevented by:** QC validator now rejects screenshot-method ACs without `.png` evidence, and flags plans where <50% of UI ACs use screenshot methods.

## Principles

1. **Fix the system, not the symptom.** If a gap happened, the system allowed it. Change the system.
2. **Multi-layer fixes.** A single lesson usually needs changes in template + skill + validator. Don't just fix one layer.
3. **Concrete, not aspirational.** Changes should be enforceable rules, not "try to remember" guidance.
4. **Test the enforcement.** If you add a validator rule, add a test. If you add a skill rule, trace through a scenario.
5. **Log everything.** The retro log is how future sessions know what was learned and why.
