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

### Step 0: Register & Branch

Before implementation, set up the workflow tracking:

1. **Create feature branch:** `git checkout -b feat/{feature-name}`
2. **Commit the approved plan** to the branch: `git commit -m "docs: add plan for {feature}"`
3. **Register in verification-status.json:**

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

4. **When coding begins**, update status to `"implementing"`
5. **When all code is written + precheck passes**, update status to `"pending"`

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

Spawn a verification sub-agent using the `/ac-verify` skill template:

```text
Task(subagent_type="general-purpose", prompt="""
Run the AC verification protocol from .claude/skills/ac-verify/SKILL.md.

BRANCH: {current branch name}
DEV_SERVER: http://localhost:3000

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

Read the sub-agent's report. For each failed AC:

1. Identify root cause from the report's evidence (screenshot, file:line)
2. Fix the code in the main thread
3. Re-spawn a **new** sub-agent to re-verify **ALL** ACs (not just failed ones)
4. Repeat until all pass

**Key:** Always re-verify all ACs after fixes to catch regressions.

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

2. **Present report to human:**

   ```text
   ## Ready for Review

   - Branch: {branch}
   - Files changed: {n}
   - ACs: {passed}/{total} passed
   - Tests: {passed}/{total} passed
   - Iterations: {n}

   [Full verification report from sub-agent]

   Approve to commit and release, or provide feedback to iterate.
   ```

3. **On approval:** Commit -> PR -> merge -> `/release`
4. **On rejection:** Fix -> re-verify (back to Step 2)

## AC Categories

Plans must include ACs in these categories:

| Category | Prefix | Verified By | Example |
|----------|--------|-------------|---------|
| UI | AC-UI-{n} | Screenshots at 3 breakpoints | "Button visible at mobile width" |
| Functional | AC-FN-{n} | Code review with file:line evidence | "Endpoint returns 403 for non-owner" |
| Regression | AC-REG-{n} | Test suite + screenshot spot-check | "Existing columns unchanged" |

## Human Checkpoints

The loop is autonomous but pauses for human input at these gates:

| Gate | When | Why |
|------|------|-----|
| **Plan approval** | Before implementation | Human approves ACs as verification contract |
| **Dev server** | Server not running or wrong port | Need human to start/confirm |
| **Ambiguous AC** | Sub-agent can't clearly pass/fail | Escalate to human |
| **Review gate** | All ACs pass | Human approves or rejects |

## Integration with Other Skills

| Skill | Role in Loop |
|-------|-------------|
| `/ac-verify` | Sub-agent prompt template (Step 2) |
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
