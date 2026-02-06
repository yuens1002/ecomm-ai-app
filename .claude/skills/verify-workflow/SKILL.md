---
name: verify-workflow
description: Full verification workflow automation - precheck, tests, UI verification before human review
---

# Verify Workflow Skill

This skill orchestrates a complete verification workflow before handing off to human review. It ensures all automated checks pass before stopping for iteration.

## Purpose

Automate the verification loop so that:

1. Code quality is verified (TypeScript, ESLint)
2. Tests pass
3. UI matches acceptance criteria (visual verification)
4. A consolidated report is generated

**Goal:** "Work is done and verified" before human review.

## Usage

```text
/verify-workflow                           # Run full verification
/verify-workflow --skip-ui                 # Skip UI verification (code-only changes)
/verify-workflow --acs "AC1" "AC2"         # Verify specific ACs
```

## Workflow Steps

### Step 1: Precheck (TypeScript + ESLint)

```bash
npm run precheck
```

**Pass criteria:** Exit code 0, no errors

**On failure:**

- Report specific TypeScript/ESLint errors
- Suggest fixes based on error messages
- Do NOT proceed to next steps

### Step 2: Test Suite

```bash
npm run test:ci
```

**Pass criteria:** All tests pass

**On failure:**

- Report failing test names and assertions
- Show relevant code context
- Do NOT proceed to next steps

### Step 3: UI Verification (if applicable)

Only runs when:

- Changes affect UI components
- `--skip-ui` flag is NOT set

**Process:**

1. Ensure dev server is running on localhost:3000
2. Take screenshots: `npx tsx scripts/take-responsive-screenshots.ts after`
3. Read screenshots and verify against ACs
4. Report pass/fail for each AC at each breakpoint

### Step 4: Consolidated Report

Generate a summary report:

```text
## Verification Report

### Code Quality
- TypeScript: PASS
- ESLint: PASS

### Tests
- Total: 45
- Passed: 45
- Failed: 0
- Status: PASS

### UI Verification
| AC | Mobile | Tablet | Desktop | Status |
|----|--------|--------|---------|--------|
| ProductCard layout | PASS | PASS | PASS | PASS |
| +/- stepper visible | PASS | PASS | PASS | PASS |

### Overall: PASS - Ready for human review
```

Or if failures:

```text
## Verification Report

### Code Quality
- TypeScript: PASS
- ESLint: FAIL (2 errors)

### Failures Found

#### ESLint
1. src/components/Button.tsx:45 - 'unused' is defined but never used
2. src/components/Card.tsx:12 - Missing return type

### Recommended Actions
1. Remove unused variable 'unused' in Button.tsx
2. Add return type to function in Card.tsx

### Overall: FAIL - Fix issues before human review
```

## Integration with Development Flow

### Typical Feature Development

```text
1. Plan feature (plan mode)
2. Implement changes
3. /verify-workflow              # Automated verification
4. If FAIL → fix issues → repeat step 3
5. If PASS → create PR for human review
```

### Quick Iteration Loop

```text
1. Make code change
2. /verify-workflow --skip-ui    # Quick check (no screenshots)
3. Fix any failures
4. /verify-workflow              # Full verification before PR
```

## Configuration

### Default ACs (from feature docs)

The skill automatically looks for ACs in:

- `docs/feature/*/README.md` - Testing Checklist section
- Current plan file (if in plan mode)

### Custom ACs

Pass specific ACs to verify:

```text
/verify-workflow --acs "Button shows correct label" "Price displays correctly"
```

## Prerequisites

- Node.js and npm installed
- Dev server running (for UI verification)
- Puppeteer installed: `npm install -D puppeteer`

## Error Handling

### Dev Server Not Running

```text
WARNING: Dev server not detected on localhost:3000
UI verification will be skipped.

To enable UI verification:
1. Open a new terminal
2. Run: npm run dev
3. Re-run: /verify-workflow
```

### Screenshot Failures

If screenshots fail to capture:

1. Check dev server is responding
2. Increase wait times in screenshot script
3. Check for hydration issues

## Example Output

### All Passing

```text
## Verification Report

Ran verification workflow at 2026-02-05 10:30:00

### Code Quality
npm run precheck... PASS (12.3s)

### Tests
npm run test:ci... PASS (8.5s)
- 45 tests passed

### UI Verification
Taking screenshots... done
Verifying ACs...

| AC | Mobile | Tablet | Desktop | Result |
|----|--------|--------|---------|--------|
| ProductCard: button left, price right | PASS | PASS | PASS | PASS |
| ProductQuantityCart: +/- stepper | PASS | PASS | PASS | PASS |
| Footer links visible | PASS | PASS | PASS | PASS |

### Summary
- Code Quality: PASS
- Tests: PASS
- UI: PASS (3/3 ACs)

**OVERALL: PASS**

Ready for human review. Create PR when ready.
```

### With Failures

```text
## Verification Report

Ran verification workflow at 2026-02-05 10:30:00

### Code Quality
npm run precheck... FAIL (5.2s)

Errors:
1. app/(site)/_components/product/ProductCard.tsx:45:12
   error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'

### Summary
- Code Quality: FAIL (1 error)
- Tests: SKIPPED (blocked by precheck failure)
- UI: SKIPPED (blocked by precheck failure)

**OVERALL: FAIL**

Fix the TypeScript error above before proceeding.
```

## Best Practices

1. **Run early, run often** - Catch issues before they compound
2. **Don't skip UI verification** - Visual regressions are easy to miss
3. **Fix failures immediately** - Don't accumulate technical debt
4. **Update ACs when requirements change** - Keep verification aligned with expectations
