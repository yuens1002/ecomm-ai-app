#!/usr/bin/env node
// .claude/hooks/test-qc-validator.js
//
// Test script for qc-validator.js. Run with:
//   node .claude/hooks/test-qc-validator.js
//
// Tests against synthetic ACs and optionally against a real ACs doc.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { validateQC, parseACTables } = require("./qc-validator");

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}`);
    failed++;
  }
}

// ── Helper: write temp ACs doc and validate ──

const tmpDir = path.join(__dirname, ".test-tmp");

function setup() {
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
}

function cleanup() {
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function writeDoc(filename, content) {
  fs.writeFileSync(path.join(tmpDir, filename), content, "utf8");
}

// ── Test 1: Rubber stamp QC ──

console.log("\nTest 1: Rubber stamp QC ('Confirmed')");
setup();
writeDoc(
  "test1.md",
  `## UI Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | Badge color | Screenshot: badge element | Blue badge | PASS — blue badge visible | Confirmed | |
| AC-FN-1 | API route | Code review | Returns 200 | PASS — returns 200 at route.ts:15 | Confirmed | |
`
);

let result = validateQC(tmpDir, "test1.md");
assert(!result.valid, "Should be invalid");
assert(result.issues.length >= 2, `Should have at least 2 issues (got ${result.issues.length})`);
assert(
  result.issues[0].includes("rubber stamp"),
  `First issue should mention rubber stamp (got: ${result.issues[0]})`
);

// ── Test 2: Substantive QC with screenshot evidence ──

console.log("\nTest 2: Substantive QC with screenshot evidence (should pass)");
writeDoc(
  "test2.md",
  `## UI Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | Badge color | Screenshot: badge element | Blue badge | PASS — blue badge visible in .screenshots/verify-badge.png | PASS — .screenshots/verify-badge.png shows blue bg-blue-100 badge | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | API route | Code review | Returns 200 | PASS — returns 200 at route.ts:15 | Route handler validates with Zod schema and returns correct status code | |
`
);

result = validateQC(tmpDir, "test2.md");
assert(result.valid, "Should be valid");
assert(result.issues.length === 0, `Should have 0 issues (got ${result.issues.length})`);

// ── Test 3: Empty QC ──

console.log("\nTest 3: Empty QC column");
writeDoc(
  "test3.md",
  `## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | API route | Code review | Returns 200 | PASS — returns 200 | | |
| AC-FN-2 | Auth check | Code review | Returns 403 | PASS — returns 403 |  | |
`
);

result = validateQC(tmpDir, "test3.md");
assert(!result.valid, "Should be invalid");
assert(result.issues.length === 2, `Should have 2 issues (got ${result.issues.length})`);
assert(
  result.issues[0].includes("empty"),
  `Issue should mention empty (got: ${result.issues[0]})`
);

// ── Test 4: UI AC with Screenshot How but no screenshot evidence ──

console.log("\nTest 4: UI AC with Screenshot How but only code evidence (should fail)");
writeDoc(
  "test4.md",
  `## UI Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | Badge color | Screenshot: badge element | Blue badge | PASS — code review confirms class at Component.tsx:42 | Confirmed: Component.tsx:42 applies bg-blue-100 class to badge element | |
`
);

result = validateQC(tmpDir, "test4.md");
assert(!result.valid, "Should be invalid");
assert(result.issues.length >= 1, `Should have at least 1 issue (got ${result.issues.length})`);
assert(
  result.issues.some((i) => i.includes("screenshot evidence")),
  `Should mention missing screenshot evidence (got: ${result.issues.join("; ")})`
);

// ── Test 4b: UI AC with Code review How and file:line evidence (should pass individually) ──

console.log("\nTest 4b: UI AC with Code review How and file:line evidence");
writeDoc(
  "test4b.md",
  `## UI Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | Manage redirect | Code review: manage/page.tsx | Redirects to /terms | PASS — redirect at manage/page.tsx:4 | Confirmed: manage/page.tsx:4 calls redirect to /admin/support/terms?tab=license | |
`
);

result = validateQC(tmpDir, "test4b.md");
// Individual AC should pass its own validation (file:line evidence for Code review How)
const acIssues = result.issues.filter((i) => i.startsWith("AC-UI-1:"));
assert(acIssues.length === 0, `Individual AC should pass (got: ${acIssues.join("; ") || "none"})`);
// But the 50% rule should flag it (1 UI AC, 0 screenshot methods)
const ruleIssues = result.issues.filter((i) => i.includes("screenshot verification"));
assert(ruleIssues.length === 1, `Should flag 50% rule (got ${ruleIssues.length} issues)`);

// ── Test 5: QC echoes Agent column ──

console.log("\nTest 5: QC echoes Agent column text");
writeDoc(
  "test5.md",
  `## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | API route | Code review | Returns 200 | PASS — returns 200 at route.ts:15 with Zod validation | PASS — returns 200 at route.ts:15 with Zod validation confirmed | |
`
);

result = validateQC(tmpDir, "test5.md");
assert(!result.valid, "Should be invalid");
assert(result.issues.length === 1, `Should have 1 issue (got ${result.issues.length})`);
assert(
  result.issues[0].includes("overlap") || result.issues[0].includes("substring"),
  `Issue should mention overlap or substring (got: ${result.issues[0]})`
);

// ── Test 5b: Escaped pipes in Agent column ──

console.log("\nTest 5b: Escaped pipes (\\|) in Agent column don't break parsing");
writeDoc(
  "test5b.md",
  `## UI Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-8 | Completed tab | Interactive: click tab → screenshot | DELIVERED visible | CODE_REVIEW PASS: filter: SHIPPED \\| DELIVERED \\| PICKED_UP | Confirmed | |
`
);

result = validateQC(tmpDir, "test5b.md");
assert(!result.valid, "Should be invalid (rubber stamp)");
assert(result.issues.length >= 1, `Should have at least 1 issue (got ${result.issues.length})`);
assert(
  result.issues.some((i) => i.includes("AC-UI-8") && i.includes("rubber stamp")),
  `Should flag AC-UI-8 rubber stamp (got: ${result.issues.join("; ")})`
);

// ── Test 6: No ACs doc (should skip) ──

console.log("\nTest 6: No ACs doc file (should skip)");
result = validateQC(tmpDir, "nonexistent-ACs.md");
assert(result.valid, "Should be valid (skipped)");
assert(result.skipped === true, "Should be skipped");

// ── Test 7: No ACs doc path (should skip) ──

console.log("\nTest 7: No ACs doc path provided (should skip)");
result = validateQC(tmpDir, "");
assert(result.valid, "Should be valid (skipped)");
assert(result.skipped === true, "Should be skipped");

// ── Test 8: Min substance after prefix strip ──

console.log("\nTest 8: Minimum substance after stripping prefix");
writeDoc(
  "test8.md",
  `## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | API route | Code review | Returns 200 | PASS — returns 200 | PASS — looks ok | |
`
);

result = validateQC(tmpDir, "test8.md");
assert(!result.valid, "Should be invalid (too short)");
assert(
  result.issues[0].includes("lacks substance"),
  `Issue should mention substance (got: ${result.issues[0]})`
);

// ── Test 9: Multiple tables with proper How + screenshot evidence ──

console.log("\nTest 9: Multiple tables with screenshot How + evidence");
writeDoc(
  "test9.md",
  `## UI Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | Badge | Screenshot: badge element | Blue | PASS — .screenshots/badge.png shows blue | Badge renders blue in .screenshots/badge.png verified | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | Route | Code review | 200 | PASS | Route handler validates input with Zod at route.ts:25 | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | Tests pass | Test run | All green | PASS | 845 tests pass, precheck clean, no regressions found | |
`
);

const parsed = parseACTables(
  fs.readFileSync(path.join(tmpDir, "test9.md"), "utf8")
);
assert(parsed.length === 3, `Should parse 3 ACs (got ${parsed.length})`);
assert(parsed[0].isUI === true, "First AC should be UI");
assert(parsed[1].isUI === false, "Second AC should not be UI");
assert(parsed[0].how === "Screenshot: badge element", `Should parse How column (got: "${parsed[0].how}")`);

result = validateQC(tmpDir, "test9.md");
assert(result.valid, `Should be valid (got issues: ${result.issues.join("; ") || "none"})`);

// ── Test 10: All UI ACs use Code review (should fail 50% rule) ──

console.log("\nTest 10: All UI ACs use Code review (should fail 50% rule)");
writeDoc(
  "test10.md",
  `## UI Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | Nav labels | Code review: admin-nav.ts | Correct labels | PASS — admin-nav.ts:82 | Confirmed: admin-nav.ts:82 shows correct label in config | |
| AC-UI-2 | Page title | Code review: PageClient.tsx | Title matches | PASS — PageClient.tsx:15 | Confirmed: PageClient.tsx:15 renders correct title text | |
| AC-UI-3 | Redirect | Code review: manage/page.tsx | Redirects correctly | PASS — manage/page.tsx:4 | Confirmed: manage/page.tsx:4 redirects to correct URL path | |
| AC-UI-4 | Route registry | Code review: route-registry.ts | Routes registered | PASS — route-registry.ts:307 | Confirmed: route-registry.ts:307 has correct route entry configured | |
`
);

result = validateQC(tmpDir, "test10.md");
assert(!result.valid, "Should be invalid (50% rule)");
assert(
  result.issues.some((i) => i.includes("screenshot verification")),
  `Should mention screenshot verification rule (got: ${result.issues.join("; ")})`
);

// ── Test 11: Mixed screenshot + code review UI ACs (should pass) ──

console.log("\nTest 11: Mixed screenshot + code review UI ACs (should pass)");
writeDoc(
  "test11.md",
  `## UI Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | Plan card layout | Screenshot: /admin/support/plans | Cards visible | PASS — .screenshots/plans.png | Plans page renders card layout in .screenshots/plans.png | |
| AC-UI-2 | License tab | Screenshot: /admin/support/terms | Tab content shown | PASS — .screenshots/terms.png | License tab shows key input in .screenshots/terms.png | |
| AC-UI-3 | Redirect | Code review: manage/page.tsx | Redirects correctly | PASS — manage/page.tsx:4 | Confirmed: manage/page.tsx:4 redirects to /admin/support/terms?tab=license | |
| AC-UI-4 | Route registry | Code review: route-registry.ts | Routes registered | PASS — route-registry.ts:307 | Confirmed: route-registry.ts:307 has correct route entry for support | |
`
);

result = validateQC(tmpDir, "test11.md");
assert(result.valid, `Should be valid (got issues: ${result.issues.join("; ") || "none"})`);

// ── Test 12: Interactive How method with screenshot evidence ──

console.log("\nTest 12: Interactive How method with screenshot evidence");
writeDoc(
  "test12.md",
  `## UI Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | Dialog opens | Interactive: click Edit → wait for dialog | Modal visible | PASS — .screenshots/dialog.png shows modal | Dialog opens correctly in .screenshots/dialog.png with fields populated | |
`
);

result = validateQC(tmpDir, "test12.md");
assert(result.valid, `Should be valid (got issues: ${result.issues.join("; ") || "none"})`);

// ── Test 13: Interactive How without screenshot evidence (should fail) ──

console.log("\nTest 13: Interactive How without screenshot evidence (should fail)");
writeDoc(
  "test13.md",
  `## UI Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | Dialog opens | Interactive: click Edit → wait for dialog | Modal visible | PASS — code review confirms DialogComponent.tsx:55 renders modal | Confirmed: DialogComponent.tsx:55 renders the modal with correct fields mapped | |
`
);

result = validateQC(tmpDir, "test13.md");
assert(!result.valid, "Should be invalid (Interactive needs screenshot)");
assert(
  result.issues.some((i) => i.includes("screenshot evidence")),
  `Should mention screenshot evidence (got: ${result.issues.join("; ")})`
);

// ── Cleanup ──

cleanup();

// ── Summary ──

console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("All tests passed!");
  process.exit(0);
}
