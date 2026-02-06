---
name: verify-workflow
description: Full verification workflow automation - precheck, tests, UI verification before human review
---

# Verify Workflow Skill

This skill orchestrates the full autonomous feature development loop — from implementation through verification — with human checkpoints, iterating until ready for review.

## Purpose

Drive a complete **implement → verify → iterate** loop so that:

1. Code is implemented per plan
2. UI is visually verified against ACs at all breakpoints
3. Issues are fixed autonomously, re-verified
4. Code quality passes (TypeScript, ESLint)
5. Test suite passes
6. A consolidated report confirms "ready for review"

**Goal:** Autonomous completion with human-in-the-loop only for approval gates.

## Usage

```text
/verify-workflow                           # Run full loop (implement → verify → review-ready)
/verify-workflow --verify-only             # Skip implementation, run verify + test only
/verify-workflow --skip-ui                 # Skip UI verification (code-only changes)
/verify-workflow --acs "AC1" "AC2"         # Verify specific ACs only
```

## The Loop

```text
┌─────────────────────────────────────────────────┐
│  1. IMPLEMENT                                   │
│     - Write code per approved plan              │
│     - Track progress with task list             │
│     - Run precheck after implementation         │
│     - Fix any TS/ESLint errors before moving on │
│                                                 │
│  2. UI VERIFY                                   │
│     - Ensure dev server is running              │
│     - Take screenshots at all breakpoints       │
│     - Read screenshots, verify each AC          │
│     - Generate AC verification table            │
│                                                 │
│  3. ITERATE (if issues found)                   │
│     - Fix code based on screenshot findings     │
│     - Re-take screenshots                       │
│     - Re-verify failed ACs                      │
│     - Repeat until all ACs pass                 │
│                                                 │
│  4. UI VERIFY (confirmation pass)               │
│     - Final screenshot pass after fixes         │
│     - Confirm all ACs pass                      │
│                                                 │
│  5. END-TO-END FUNCTIONAL CHECK                 │
│     - Verify existing functionality preserved   │
│     - Check interactive elements (buttons,      │
│       forms, state transitions)                 │
│     - Flag any regressions                      │
│                                                 │
│  6. PRECHECK + TESTS                            │
│     - npm run precheck (TypeScript + ESLint)    │
│     - npm run test:ci (full test suite)         │
│     - If failures → fix → re-run               │
│                                                 │
│  7. READY FOR REVIEW                            │
│     - All ACs pass                              │
│     - All tests pass                            │
│     - Consolidated report generated             │
│     - Exit loop                                 │
└─────────────────────────────────────────────────┘
```

## Detailed Steps

### Step 1: Implement

Execute the approved plan. Track progress with task list (TaskCreate/TaskUpdate).

**After implementation:**

```bash
npm run precheck
```

**Pass criteria:** Exit code 0. Fix any errors before proceeding.

### Step 2: UI Verify

**Prerequisites:**

- Dev server running (check with `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`)
- If server restarted on a different port, update `BASE_URL` env var
- Puppeteer installed (`npm install -D puppeteer`)

**Process:**

1. Clear stale cache if needed (`rm -rf .next` + restart dev server)
2. Take screenshots:

   ```bash
   BASE_URL=http://localhost:3000 npx tsx scripts/take-responsive-screenshots.ts after
   ```

3. Read each product-page screenshot at every breakpoint
4. Verify against ACs from the plan

**Output:** AC verification table:

```text
### AC 1 — Feature Name
| Breakpoint | Status | Notes |
|------------|--------|-------|
| mobile     | PASS   | Description of what was verified |
| sm         | PASS   | ... |
| tablet     | PASS   | ... |
| desktop    | PASS   | ... |
```

### Step 3: Iterate (if needed)

If any AC fails:

1. Identify the root cause from the screenshot
2. Fix the code
3. Re-take screenshots (Step 2)
4. Re-verify only the failed ACs
5. Repeat until all pass

**Key:** Don't re-verify passing ACs unless the fix could affect them.

### Step 4: UI Verify — Confirmation Pass

After fixes, do a full screenshot pass to confirm:

- Previously passing ACs still pass (no regressions)
- Previously failing ACs now pass

### Step 5: End-to-End Functional Check

Verify interactive behavior hasn't regressed. Check against functional ACs:

- Buttons clickable, state transitions correct
- Form inputs functional
- Navigation works
- No console errors
- No layout overflow or broken elements

**Note:** This is a visual/manual check from screenshots + code review, not automated E2E tests.

### Step 6: Precheck + Tests

```bash
npm run precheck    # TypeScript + ESLint
npm run test:ci     # Full test suite
```

**On failure:**

- Report specific errors
- Fix the issue
- Re-run only the failing check
- Do NOT skip to review

### Step 7: Ready for Review

Generate consolidated report:

```text
## Verification Report

### Implementation
- Files modified: 4
- Files created: 1
- Task completion: 6/6

### Code Quality
- TypeScript: PASS
- ESLint: PASS

### Tests
- Total: 694
- Passed: 694
- Failed: 0

### UI Verification
| AC | mobile | sm | tablet | desktop | Result |
|----|--------|----|--------|---------|--------|
| Header area | PASS | PASS | PASS | PASS | PASS |
| Two-col layout | — | — | — | PASS | PASS |
| Stacked layout | PASS | PASS | PASS | — | PASS |

### Iterations
- Iteration 1: All ACs passed (no fixes needed)

### OVERALL: PASS — Ready for review
```

## Human Checkpoints

The loop is autonomous but pauses for human input at these gates:

| Gate | When | Why |
|------|------|-----|
| **Dev server** | Server not running or wrong port | Need human to start/confirm |
| **Cache stale** | Screenshots show old UI after code changes | Need `rm -rf .next` + server restart |
| **Ambiguous AC** | Screenshot doesn't clearly pass or fail | Ask human to verify visually |
| **Scope creep** | Fix for one AC breaks another | Ask human whether to accept tradeoff |

## Gotchas & Lessons Learned

### Next.js Cache

After modifying client components, the dev server may serve stale builds. If screenshots don't reflect code changes:

1. Stop dev server
2. `rm -rf .next`
3. Restart dev server
4. Wait for compilation before taking screenshots

### Screenshot Script Port

The screenshot script defaults to `localhost:3000`. If the dev server runs on a different port:

```bash
BASE_URL=http://localhost:3001 npx tsx scripts/take-responsive-screenshots.ts after
```

The script reads `process.env.BASE_URL` with fallback to `http://localhost:3000`.

### Puppeteer Not Installed

The screenshot script requires puppeteer. Install as dev dependency:

```bash
npm install -D puppeteer
```

### Prisma Client in Scripts

To run ad-hoc DB verification scripts, use the project's own prisma instance (`import { prisma } from "./lib/prisma"`) rather than `new PrismaClient()` directly, since the project uses custom adapters (Neon/PG).

### TypeScript Union Narrowing in Seed Data

When adding optional fields to seed product objects, ensure ALL union members include the field (even as `undefined`) or TypeScript will error on property access. Example fix:

```typescript
// Merch product needs the field too (even if undefined)
variety: undefined as string | undefined,
```

## Integration with Other Skills

| Skill | Role in Loop |
|-------|-------------|
| `/ui-verify` | Called during Steps 2–4 for screenshot capture and AC verification |
| `/release` | Called after review approval to tag and publish |

## Quick Reference

```text
# Full autonomous loop
/verify-workflow

# After code-only changes (no UI)
/verify-workflow --skip-ui

# Re-verify after manual fixes
/verify-workflow --verify-only
```
