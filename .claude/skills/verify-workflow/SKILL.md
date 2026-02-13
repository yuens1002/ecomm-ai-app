---
name: verify-workflow
description: Full verification workflow automation - precheck, tests, UI verification before human review
---

# Verify Workflow Skill

Orchestrates the full autonomous feature development loop — from implementation through verification — with sub-agent delegation and human-in-the-loop review gates.

See `docs/AGENTIC-WORKFLOW.md` for the complete architecture document.

## Purpose

Drive a complete **implement -> verify -> iterate -> review** loop using sub-agents for verification, keeping the main thread's context clean for implementation work.

## Usage

```text
/verify-workflow                           # Full loop: implement -> verify -> review-ready
/verify-workflow --verify-only             # Skip implementation, verify + test only
/verify-workflow --skip-ui                 # Skip UI verification (code-only changes)
/verify-workflow --acs "AC1" "AC2"         # Verify specific ACs only
```

**Triggering:** This workflow is invoked explicitly by the user or the main thread when ready. It does NOT run automatically on every code change.

## The Loop

```text
┌──────────────────────────────────────────────────────────┐
│  1. IMPLEMENT (main thread)                              │
│     - Write code per approved plan                       │
│     - Track progress with task list                      │
│     - Run precheck after implementation                  │
│                                                          │
│  2. VERIFY (sub-agent)                                   │
│     - Spawn general-purpose sub-agent with /ac-verify    │
│     - Sub-agent: screenshots + code review + tests       │
│     - Sub-agent returns: structured pass/fail report     │
│                                                          │
│  3. ITERATE (main thread, if issues found)               │
│     - Read sub-agent report                              │
│     - Fix code based on findings                         │
│     - Re-spawn sub-agent for re-verification             │
│     - Repeat until all ACs pass                          │
│                                                          │
│  4. READY FOR REVIEW (main thread)                       │
│     - Update verification-status.json                    │
│     - Present consolidated report to human               │
│     - Human approves -> commit, PR, release              │
│     - Human rejects -> back to step 3                    │
└──────────────────────────────────────────────────────────┘
```

## Step-by-Step

### Step 0: Pre-Flight Checks & Registration

Before implementation, verify prerequisites and set up the workflow tracking:

**Pre-flight checks (autonomous — no human needed):**

1. **Dev server running?** Hit `http://localhost:3000` (or the configured port). If not reachable, ask the human to start it — this is the one human checkpoint before the autonomous loop begins.
2. **Verification status clean?** Read `.claude/verification-status.json` and confirm the current branch either has no entry yet or is in `"planned"` state. If it's in `"pending"` or `"partial"`, a previous iteration was interrupted — resume from there instead of restarting.

**Registration:**

1. **Create feature branch:** `git checkout -b feat/{feature-name}`
2. **Commit the approved plan** to the branch: `git commit -m "docs: add plan for {feature}"`
3. **Create ACs tracking doc** from the template at `docs/templates/acs-template.md` → save as `docs/plans/{feature}-ACs.md` with all ACs listed and Agent/QC/Reviewer columns empty.
4. **Register in verification-status.json:**

   ```jsonc
   // .claude/verification-status.json → branches["{branch}"]
   {
     "status": "planned",
     "acs_passed": 0,
     "acs_total": {count from plan},
     "tasks": [],
     "notes": "Plan approved and committed."
   }
   ```

5. **When coding begins**, update status to `"implementing"`
6. **When all code is written + precheck passes**, update status to `"pending"`

This activates the enforcement hooks: SessionStart will inject workflow context, Stop will block premature completion, and the commit gate will allow intermediate commits.

### Step 1: Implement

Execute the approved plan. Track progress with TaskCreate/TaskUpdate.

Follow the **commit schedule** defined in the plan — commit logical chunks as you go (status must be `"planned"` or `"implementing"` for intermediate commits).

**After implementation, run precheck:**

```bash
npm run precheck
```

Fix any TS/ESLint errors, then update verification-status to `"pending"` before proceeding to verification.

### Step 2: Verify (sub-agent delegation)

Spawn a verification sub-agent using the `/ac-verify` skill template. The sub-agent fills the **Agent** column in the ACs tracking doc (`docs/plans/{feature}-ACs.md`):

```text
Task(subagent_type="general-purpose", prompt="""
Run the AC verification protocol from .claude/skills/ac-verify/SKILL.md.

BRANCH: {current branch name}
DEV_SERVER: http://localhost:3000
ACS_DOC: docs/plans/{feature}-ACs.md

ACS:
{paste the AC list from the approved plan}

PAGES_TO_SCREENSHOT:
{list pages and interaction steps}

CONTEXT:
{relevant file paths and behavioral notes}
""")
```

**Parallelism option:** For large features, spawn UI verification and test suite as separate sub-agents:

```text
# Parallel sub-agents
Task("UI ACs", subagent_type="general-purpose", prompt="Verify UI ACs: ...")
Task("Test suite", subagent_type="general-purpose", prompt="Run npm run test:ci and report results...")
```

**Sub-agent monitoring:** Run sub-agents in the background (`run_in_background: true`). Check back after **5 minutes** using the Read tool on the output file. If the sub-agent is stuck (repeating the same action, retrying a failing step, or making no progress), stop it with TaskStop and either:

- Re-spawn with corrected instructions (e.g., fix a selector, adjust navigation steps)
- Take over the task in the main thread if the sub-agent lacks the context to recover

### Step 3: Iterate (if needed)

Read the sub-agent's report (the **Agent** column in the ACs doc). For each failed AC:

1. Identify root cause from the report's evidence (screenshot, file:line)
2. Fix the code in the main thread
3. Fill in the **QC** column with your assessment (confirms or overrides Agent result, with fix notes)
4. Re-spawn a **new** sub-agent to re-verify **ALL** ACs (not just failed ones)
5. Repeat until all pass

**Key:** Always re-verify all ACs after fixes to catch regressions.

**This loop is fully autonomous — the human does not need to be present during implement/verify/iterate cycles.** The human is only needed at plan approval (Phase 1) and final review (Step 4).

### Step 4: Ready for Review

When all ACs pass:

1. **Update verification status:**

   ```jsonc
   // .claude/verification-status.json
   {
     "branches": {
       "{branch}": {
         "status": "verified",
         "acs_passed": 9,
         "acs_total": 9,
         "tasks": [],
         "notes": "All ACs verified via sub-agent. {n} iterations."
       }
     }
   }
   ```

2. **Ensure ACs doc is complete:** All three columns should be filled — **Agent** (by sub-agent), **QC** (by main thread). The **Reviewer** column is left empty for the human.

3. **Present handoff to human:**

   ```text
   ## Ready for Review

   - Branch: {branch}
   - Files changed: {n}
   - ACs: {passed}/{total} passed
   - Tests: {passed}/{total} passed
   - Iterations: {n}

   ACs tracking doc: docs/plans/{feature}-ACs.md
   Please review and fill in the Reviewer column.

   Approve to commit and release, or provide feedback to iterate.
   ```

4. **On approval:** Commit -> PR -> merge -> `/release`
5. **On rejection:** Fix -> re-verify (back to Step 2)

## AC Categories

Plans must include ACs in these categories:

| Category | Prefix | Verified By | Example |
|----------|--------|-------------|---------|
| UI | AC-UI-{n} | Screenshots at 3 breakpoints | "Button visible at mobile width" |
| Functional | AC-FN-{n} | Code review with file:line evidence | "Endpoint returns 403 for non-owner" |
| Regression | AC-REG-{n} | Test suite + screenshot spot-check | "Existing columns unchanged" |

## Human Checkpoints

The implement → verify → iterate loop is **fully autonomous**. The human only needs to be present at two gates:

| Gate | When | Why |
|------|------|-----|
| **Plan approval** | Before implementation | Human approves ACs as verification contract, then can step away |
| **Dev server** | Server not running (pre-flight) | Human starts server, then can step away |
| **Review gate** | All ACs pass, Agent + QC columns filled | Human fills Reviewer column in ACs doc, approves or rejects |

The human does NOT need to be present during autonomous iteration cycles (implement → verify → fix → re-verify).

## Templates

| Template | Path | Purpose |
|----------|------|---------|
| Plan template | `docs/templates/plan-template.md` | Structure for feature plans with ACs and commit schedule |
| ACs template | `docs/templates/acs-template.md` | 3-column (Agent/QC/Reviewer) tracking doc for verification handoff |

## Integration with Other Skills

| Skill | Role in Loop |
|-------|-------------|
| `/ac-verify` | Sub-agent prompt template (Step 2) — sub-agent fills Agent column |
| `/ui-verify` | Screenshot capture and comparison (used by sub-agent) |
| `/release` | Version bump + tag + PR (Step 4, after approval) |

## Gotchas

### Next.js Cache

After modifying client components, dev server may serve stale builds:

1. Stop dev server
2. `rm -rf .next`
3. Restart dev server
4. Wait for compilation before spawning verification sub-agent

### Screenshot Script Port

Default is localhost:3000. If dev server runs on different port, pass it in the sub-agent prompt as `DEV_SERVER: http://localhost:{port}`.

### Sub-Agent Context

Each sub-agent starts fresh — it does not have the main thread's conversation history. Include all relevant context (file paths, component names, behavioral notes) in the sub-agent prompt.

## Quick Reference

```text
# Full loop (plan -> implement -> verify -> review)
/verify-workflow

# Verify only (skip implementation)
/verify-workflow --verify-only

# Code-only (no UI screenshots)
/verify-workflow --skip-ui

# Specific ACs
/verify-workflow --acs "AC-UI-1" "AC-FN-2"
```
