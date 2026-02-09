---
name: ac-verify
description: Verification sub-agent template — verifies acceptance criteria via screenshots, code review, and tests
---

# AC Verification Sub-Agent

This skill is a **prompt template** for the main thread to spawn a verification sub-agent. The sub-agent receives structured ACs and returns a structured pass/fail report.

**This skill is invoked by the main thread via the Task tool, NOT directly by the user.**

## Usage (by main thread)

The main thread fills in the template and spawns a sub-agent:

```text
Task(subagent_type="general-purpose", prompt="""
Run the AC verification protocol from .claude/skills/ac-verify/SKILL.md.

BRANCH: feat/order-ship-to-edit
DEV_SERVER: http://localhost:3000

ACS:
### UI (verify by screenshots)
- AC-UI-1: Ship To column visible in order history at all breakpoints
- AC-UI-2: Edit button appears only for PENDING orders

### Functional (verify by code review)
- AC-FN-1: PATCH endpoint validates address with Zod
- AC-FN-2: Auth check prevents other users from editing

### Regression (verify by tests + spot-check)
- AC-REG-1: Existing columns unchanged
- AC-REG-2: Cancel button still works for PENDING

PAGES_TO_SCREENSHOT:
- /account (click Orders tab, wait for table to load)

CONTEXT:
- Order history table is in app/(site)/account/OrdersPageClient.tsx
- New endpoint at app/api/user/orders/[id]/address/route.ts
""")
```

## Verification Protocol

When this skill is invoked, follow these steps exactly:

### Step 1: Parse Inputs

Extract from the prompt:
- **Branch name** (for the report header)
- **Dev server URL**
- **AC list** grouped by category (UI / Functional / Regression)
- **Pages to screenshot** with any interaction instructions
- **Additional context** (file paths, component names, behavioral notes)

### Step 1.5: Categorize UI ACs by Verification Method

For each UI AC, determine the verification method:

| Method | When to use | Puppeteer pattern |
|--------|-------------|-------------------|
| **Static** | Element presence, layout, visibility | Navigate → wait → screenshot |
| **Interactive** | State after UI interaction (open dialog, hover, click) | Navigate → click/hover → wait → screenshot |
| **Exercise** | End-to-end flow with data mutation (form submit, state change) | Navigate → interact → fill form → submit → wait for result → screenshot |

Record the method chosen per AC in the final report (e.g., `Interactive: clicked edit → dialog opened`).

### Step 2: Verify UI ACs (screenshots)

For each page in PAGES_TO_SCREENSHOT:

1. Write a Puppeteer script to the scratchpad directory that:
   - Navigates to the page at the given dev server URL
   - Performs any interaction steps (click tab, wait for load, etc.)
   - Captures screenshots at three breakpoints:
     - mobile: 375x812
     - tablet: 768x1024
     - desktop: 1440x900
   - Saves to `.screenshots/verify-{breakpoint}-{page-name}.png`

2. Run the script: `npx tsx {scratchpad}/verify-screenshot.ts`

3. Read each screenshot with the Read tool

4. For each UI AC, check every screenshot and record:
   - PASS: The element/layout/behavior matches the AC description
   - FAIL: Describe exactly what's wrong and what was expected
   - N/A: AC doesn't apply at this breakpoint (e.g., mobile-only feature)

### Step 3: Verify Functional ACs (code review)

For each functional AC:

1. Read the relevant source files mentioned in CONTEXT
2. Verify the specific behavior described in the AC:
   - For endpoint ACs: Check route handler, validation schema, error responses
   - For auth ACs: Check session/permission guards
   - For logic ACs: Trace the code path
3. Record PASS/FAIL with specific file:line references as evidence

### Step 4: Verify Regression ACs (tests + spot-check)

1. Run the test suite:

   ```bash
   npm run test:ci
   ```

2. Record total/passed/failed counts

3. For screenshot-based regression ACs, check the screenshots from Step 2 for unchanged elements

4. Record PASS/FAIL for each regression AC

### Step 5: Produce Report

Return a structured report in this exact format:

```markdown
## Verification Report — {BRANCH}

### UI Verification
| AC | Method | mobile | tablet | desktop | Result |
|----|--------|--------|--------|---------|--------|
| AC-UI-1: {description} | Static/Interactive/Exercise: {steps taken} | PASS/FAIL | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| AC-UI-2: {description} | Interactive: clicked edit → dialog opened | PASS/FAIL | PASS/FAIL | PASS/FAIL | PASS/FAIL |

### Functional Verification
| AC | Method | Result | Notes |
|----|--------|--------|-------|
| AC-FN-1: {description} | Code review | PASS/FAIL | {evidence with file:line} |
| AC-FN-2: {description} | Code review | PASS/FAIL | {evidence with file:line} |

### Regression
| AC | Method | Result | Notes |
|----|--------|--------|-------|
| AC-REG-1: {description} | Screenshot | PASS/FAIL | {what was checked} |
| AC-REG-2: {description} | Test suite | PASS/FAIL | {test count} |

### Test Suite
- Total: {n} | Passed: {n} | Failed: {n}
{If failures, list the failing test names}

### Issues Found
{List any failures with detailed description, or "None" if all pass}

### Suggested Fixes
{For each failure, suggest what to change, or "N/A" if all pass}

### Overall: {PASS or FAIL}
- ACs passed: {n}/{total}
- Iterations needed: {suggest 0 if all pass, or describe what needs fixing}
```

## Important Rules

1. **Read, don't write.** The sub-agent verifies — it does NOT fix code or make edits.
2. **Evidence-based.** Every PASS/FAIL must reference a screenshot or file:line.
3. **Complete coverage.** Verify ALL ACs, don't skip any.
4. **Screenshot every breakpoint.** Even if an AC seems desktop-only, capture all three.
5. **Clean scratchpad.** Write Puppeteer scripts to the scratchpad, not `scripts/`.
6. **Report everything.** Include test output, screenshot paths, and code references.
7. **Combine interaction + evidence.** When an AC requires UI interaction before verification, write a single Puppeteer flow that interacts and captures evidence in sequence. Do not split interaction and screenshot into separate scripts.
8. **Exercise cautiously.** For ACs requiring form submission or data mutation, verify the UI response (toast, state change) — do not verify database state directly.

## Puppeteer Script Template

Use this as the base for screenshot scripts:

```typescript
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(process.cwd(), ".screenshots");

const BREAKPOINTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });

  for (const bp of BREAKPOINTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: bp.width, height: bp.height });

    // Navigate to the target page
    await page.goto(`${BASE_URL}/account`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Perform any interactions (click tabs, open modals, etc.)
    // await page.click('[data-tab="orders"]');
    // await new Promise((r) => setTimeout(r, 1000));

    await page.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-orders.png`),
      fullPage: false,
    });

    await page.close();
  }

  await browser.close();
  console.log("Screenshots captured.");
}

main().catch(console.error);
```

### Interactive / Exercise Patterns

For ACs that require interaction before screenshots, extend the template:

```typescript
// Interactive: click to open dialog, then screenshot
await page.click('[data-testid="edit-address-btn"]');
await page.waitForSelector('[role="dialog"]', { visible: true });
await page.screenshot({ path: path.join(OUTPUT_DIR, "verify-dialog-open.png") });

// Exercise: fill form and submit
await page.type('#recipientName', 'Jane Doe');
await page.type('#street', '456 Oak Ave');
await page.click('button[type="submit"]');
await page.waitForSelector('[data-sonner-toast]', { visible: true });
await page.screenshot({ path: path.join(OUTPUT_DIR, "verify-after-submit.png") });
```

## Error Handling

- **Dev server not reachable**: Report as blocker, don't fabricate results
- **Screenshot blank/loading**: Increase wait time and retry once. If still blank, report as blocker.
- **Test suite fails**: Still complete all other verification. Report test failures in the Tests section.
- **File not found**: Report which file was expected and couldn't be read. Mark related ACs as FAIL.
