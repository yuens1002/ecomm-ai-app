# Agentic Feature Workflow

A formalized, sub-agent-driven workflow for autonomous feature development with human-in-the-loop review gates.

## Overview

```text
PLAN ──► IMPLEMENT ──► VERIFY (sub-agent) ──► HUMAN REVIEW ──► RELEASE
  │                         │                      │
  │   structured ACs        │   pass/fail report   │  pass → /release
  │   become contract       │                      │  fail → back to IMPLEMENT
  └─────────────────────────┘──────────────────────┘
```

The main thread (implementation agent) orchestrates. Verification is delegated to a sub-agent to protect context and enable parallelism. The human reviews a consolidated report and approves or rejects.

## When to Use This Workflow

**Use for:** Feature branches with UI or functional changes that benefit from structured verification.

**Skip for:** Docs-only changes, single-line fixes, config tweaks, dependency updates.

**Trigger:** The main thread decides when to invoke verification — it is NOT automatic on every code change. Typically invoked once after implementation is complete, then again after each fix iteration.

## Phase 1: Plan (with ACs)

Enter plan mode. Explore the codebase, design the approach, and produce a plan that includes a structured **Acceptance Criteria** section.

### AC Format

ACs are split into three categories. Each category maps to a verification method:

```markdown
## Acceptance Criteria

### UI (verified by screenshots)
- AC-UI-1: Ship To column visible in order history table at all breakpoints
- AC-UI-2: Edit button appears only on rows with PENDING status
- AC-UI-3: Modal opens with address fields pre-populated from order data

### Functional (verified by code review + tests)
- AC-FN-1: PATCH /api/user/orders/[id]/address validates with Zod schema
- AC-FN-2: Only order owner can update their own order (auth check)
- AC-FN-3: Non-PENDING orders return 403

### Regression (verified by test suite + visual spot-check)
- AC-REG-1: Existing order history columns render unchanged
- AC-REG-2: Order status badges still display correctly
- AC-REG-3: Cancel button still appears for PENDING one-time orders
```

**Rules:**
- Each AC is a single, testable statement
- UI ACs reference specific visual elements and breakpoints
- Functional ACs reference specific endpoints, validations, or behaviors
- Regression ACs protect existing functionality
- ACs are numbered with category prefix for traceability in reports

### Plan Approval

Human reviews the plan and ACs. On approval, ACs become the **verification contract** — the sub-agent will verify exactly these criteria, nothing more, nothing less.

## Phase 2: Implement (main thread)

The main thread implements the approved plan:

1. Create feature branch
2. Write code per plan
3. Track progress with task list (TaskCreate/TaskUpdate)
4. Run `npm run precheck` after each logical chunk
5. Fix any TS/ESLint errors immediately

**Exit criteria:** All planned code changes complete, precheck passes.

## Phase 3: Verify (sub-agent)

When implementation is complete, the main thread spawns a verification sub-agent.

### How to Trigger

The main thread uses the Task tool to spawn a `general-purpose` sub-agent with the `/ac-verify` skill prompt template:

```text
Task(subagent_type="general-purpose", prompt="""
Run /ac-verify with these parameters:

ACs:
- AC-UI-1: Ship To column visible in order history at all breakpoints
- AC-UI-2: Edit button appears only for PENDING orders
- AC-FN-1: PATCH endpoint validates address with Zod
...

Pages to screenshot:
- /account (order history tab)

Dev server: http://localhost:3000

Additional context:
- The Edit button should only appear in the Actions column for PENDING orders
- Modal should pre-populate from order.shippingAddress fields
""")
```

### What the Sub-Agent Does

1. **UI ACs**: Takes screenshots at mobile/tablet/desktop, reads each screenshot, verifies each UI AC
2. **Functional ACs**: Reviews code for the specific behaviors (endpoint validation, auth checks, error handling)
3. **Regression ACs**: Runs test suite, spot-checks screenshots for unchanged elements
4. **Returns**: Structured verification report

### Verification Report Format

```markdown
## Verification Report — feat/order-ship-to-edit

### UI Verification
| AC | mobile | tablet | desktop | Result |
|----|--------|--------|---------|--------|
| AC-UI-1: Ship To column visible | PASS | PASS | PASS | PASS |
| AC-UI-2: Edit button for PENDING only | PASS | PASS | PASS | PASS |
| AC-UI-3: Modal pre-populated | — | — | PASS | PASS |

### Functional Verification
| AC | Method | Result | Notes |
|----|--------|--------|-------|
| AC-FN-1: Zod validation | Code review | PASS | Schema validates all address fields |
| AC-FN-2: Auth check | Code review | PASS | getServerSession + owner check |
| AC-FN-3: Non-PENDING 403 | Code review | PASS | Status guard before update |

### Regression
| AC | Method | Result | Notes |
|----|--------|--------|-------|
| AC-REG-1: Existing columns | Screenshot | PASS | Order #, Date, Items, Status, Total unchanged |
| AC-REG-2: Status badges | Screenshot | PASS | All badge colors render correctly |
| AC-REG-3: Cancel button | Screenshot | PASS | Still shows for PENDING orders |

### Test Suite
- Total: 694 | Passed: 694 | Failed: 0

### Overall: PASS
```

## Phase 4: Main Thread Reads Report

The main thread receives the sub-agent's report:

- **All ACs pass** → Update `verification-status.json` → Present report to human
- **Any AC fails** → Fix code in main thread → Re-spawn sub-agent to re-verify ALL ACs
- **Repeat** until every AC passes

### Updating Verification Status

```jsonc
// .claude/verification-status.json
{
  "branches": {
    "feat/order-ship-to-edit": {
      "status": "verified",        // "verified" | "partial" | "pending"
      "acs_passed": 9,
      "acs_total": 9,
      "tasks": [],
      "notes": "All 9 ACs verified via sub-agent report. 0 iterations needed."
    }
  }
}
```

The pre-commit hook reads this file and blocks commits unless `status === "verified"`.

## Phase 5: Human Review

The main thread presents the consolidated report to the human:

```text
## Ready for Review

### Summary
- Branch: feat/order-ship-to-edit
- Files changed: 5
- ACs: 9/9 passed
- Tests: 694/694 passed
- Iterations: 1

### Verification Report
[full report from sub-agent]

### Next Steps
- Approve → I'll commit, create PR, and release
- Reject → Tell me what to fix, I'll iterate
```

**Human decision:**
- **Approve** → Main thread commits, creates PR, runs `/release`
- **Reject with feedback** → Main thread fixes, re-verifies (back to Phase 3)

## Phase 6: Release

On approval, the main thread runs the standard release workflow:

1. Commit (pre-commit hook passes because verification-status is "verified")
2. Push + create PR
3. Wait for CI
4. Merge PR
5. Tag release (`/release patch` or `/release minor`)

## Sub-Agent Architecture

### Why Sub-Agents?

| Concern | Main thread | Sub-agent |
|---------|-------------|-----------|
| Context window | Protected — screenshots don't bloat it | Disposable — screenshots consumed and discarded |
| Parallelism | Can continue working while verification runs | Runs independently |
| Specialization | Feature design + implementation | Verification protocol |
| Iteration | Fixes code, re-spawns fresh verifier | Always starts clean |

### Sub-Agent Boundaries

The verification sub-agent:
- **CAN**: Read files, take screenshots, run tests, read screenshots, produce reports
- **CANNOT**: Edit files, write code, make commits, push branches
- **RECEIVES**: AC list, pages to screenshot, dev server URL, additional context
- **RETURNS**: Structured pass/fail report with evidence

### Parallelism

For features with both UI and code-only changes, the main thread can spawn two sub-agents in parallel:

```text
Task(subagent_type="general-purpose", prompt="Verify UI ACs: ...")    ─┐
Task(subagent_type="general-purpose", prompt="Run test suite...")      ─┤── parallel
                                                                        │
Main thread reads both reports when complete                           ─┘
```

## Skill Reference

| Skill | Phase | Purpose |
|-------|-------|---------|
| Plan mode | 1 | Explore + design + produce ACs |
| `/ac-verify` | 3 | Sub-agent verification template |
| `/ui-verify` | 3 | Screenshot capture + comparison (used by sub-agent) |
| `/verify-workflow` | 2-4 | Full orchestration (when running without sub-agents) |
| `/release` | 6 | Version bump + tag + PR |

## Quick Reference

```text
# Standard feature flow
1. Enter plan mode → produce plan with ACs → human approves
2. Implement on feature branch
3. Spawn verification sub-agent with ACs
4. Read report → fix if needed → re-verify
5. Present report to human → approve/reject
6. Commit → PR → merge → /release

# Code-only feature (skip UI verification)
- Same flow, but AC-UI section is empty
- Sub-agent only runs code review + tests

# Urgent fix (skip formal verification)
- Implement fix
- Manually set verification-status to "verified" with notes explaining why
- Commit → PR → merge → /release
```

## Process Loop & State Machine

The workflow is enforced by a state machine tracked in `verification-status.json`. Each state controls what hooks allow or block.

```text
  ┌─────────┐    plan      ┌──────────────┐   implement   ┌──────────────┐
  │ (start) │──committed──>│   planned     │──────────────>│ implementing │
  └─────────┘              └──────────────┘               └──────┬───────┘
                                                                 │
                              ┌───────────┐    all done    ┌─────v──────┐
                              │  verified  │<──────────────│  pending   │
                              └─────┬─────┘               └─────┬──────┘
                                    │                           │
                               commit/PR                  ┌────v─────┐
                                                          │ partial  │──fix──> (back to pending)
                                                          └──────────┘
```

| State | Intermediate commits | Final commit | Stop hook |
|-------|---------------------|-------------|-----------|
| `planned` | Allowed | Blocked | Allows (reminds to implement) |
| `implementing` | Allowed | Blocked | Allows (reminds to verify) |
| `pending` | Blocked | Blocked | **Blocks** — must verify |
| `partial` | Blocked | Blocked | **Blocks** — must complete verification |
| `verified` | Allowed | Allowed | Allows |

### State Transitions

| Transition | Who | When |
|-----------|-----|------|
| (none) → `planned` | Main thread | After plan approved + committed to branch |
| `planned` → `implementing` | Main thread | When coding begins |
| `implementing` → `pending` | Main thread | After all code written + precheck passes |
| `pending` → `partial` | Sub-agent / verify-workflow | After partial AC verification |
| `pending`/`partial` → `verified` | Sub-agent / verify-workflow | After all ACs pass |

## Branch & Commit Protocol

Full workflow for AC-driven features:

1. **Create feature branch** from `main`
2. **Plan** on the branch (explore codebase, produce plan with ACs)
3. **Commit the plan**: `git commit -m "docs: add plan for {feature}"`
4. **Register** `verification-status.json` entry with status `"planned"` and `acs_total` = AC count
5. **Transition** to `"implementing"` when coding begins
6. **Follow the commit schedule** defined in the plan (intermediate commits allowed)
7. **Transition** to `"pending"` when implementation is complete
8. **Run verification** → transitions to `"verified"`
9. **Final commit** + PR

### Commit Schedule Convention

Plans must include a commit schedule section:

```markdown
## Commit Schedule
1. Plan commit: `docs: add plan for {feature}` (after plan approval)
2. API route: `feat: add PATCH endpoint` (after route + validation)
3. Client UI: `feat: add dialog component` (after UI changes)
4. Verification: `chore: update verification status` (after all ACs pass)
```

## Enforcement Hooks

| Hook | Event | File | Purpose | Blocks? |
|------|-------|------|---------|---------|
| Session awareness | SessionStart | `session-start-loop-node.js` | Injects process loop context at session start | Context injection (exit 2) |
| Stop gate | Stop | `verify-before-stop-node.js` | Prevents declaring done without verification | Yes (`pending`/`partial`) |
| Commit gate | PreToolUse (Bash) | `verify-before-commit-node.js` | Prevents commits in unverified states | Yes (`pending`/`partial`) |

### How They Work Together

1. **Session starts** → SessionStart hook reads branch status, injects context message
2. **During implementation** → Stop hook allows, commit gate allows intermediate commits
3. **Implementation complete** → Main thread sets status to `"pending"`
4. **Claude tries to stop** → Stop hook blocks, tells Claude to run verification
5. **Claude tries to commit** → Commit gate blocks, tells Claude to verify first
6. **Verification passes** → Status set to `"verified"`, all hooks allow

## Files

| File | Shared | Purpose |
|------|--------|---------|
| `.claude/settings.json` | Yes | Hook registration (SessionStart, PreToolUse, Stop) |
| `.claude/settings.local.json` | No | Personal bash allow-list |
| `.claude/hooks/session-start-loop-node.js` | Yes | SessionStart workflow context injection |
| `.claude/hooks/verify-before-stop-node.js` | Yes | Stop gate — blocks premature completion |
| `.claude/hooks/verify-before-commit-node.js` | Yes | Pre-commit verification gate |
| `.claude/verification-status.json` | No | Per-branch AC tracking |
| `.claude/skills/ac-verify/SKILL.md` | Yes | Verification sub-agent prompt template |
| `.claude/skills/verify-workflow/SKILL.md` | Yes | Full workflow orchestration |
| `.claude/skills/ui-verify/SKILL.md` | Yes | Screenshot capture + comparison |
| `.claude/skills/release/SKILL.md` | Yes | Release workflow |
| `docs/AGENTIC-WORKFLOW.md` | Yes | This document |
