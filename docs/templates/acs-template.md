# {Feature Name} — AC Verification Report

**Branch:** `feat/{branch-name}`
**Commits:** {n}
**Iterations:** {n}

---

## Column Definitions

| Column | Filled by | When |
|--------|-----------|------|
| **Agent** | Verification sub-agent | During `/ac-verify` — PASS/FAIL with brief evidence |
| **QC** | Main thread agent | After reading sub-agent report — confirms or overrides |
| **Reviewer** | Human (reviewer) | During manual review — final approval per AC |

---

## UI Acceptance Criteria

> **How column — verification methods for UI ACs:**
>
> | Method | Format | Evidence required |
> |--------|--------|-------------------|
> | **Screenshot** | `Screenshot: {page/element at breakpoint}` | `.png` file path in Agent/QC columns |
> | **Interactive** | `Interactive: {click/hover} → screenshot` | `.png` file path in Agent/QC columns |
> | **Exercise** | `Exercise: {form flow} → screenshot` | `.png` file path in Agent/QC columns |
> | **Code review** | `Code review: {file}` | file:line refs (no screenshot needed) |
>
> **Rules:**
> - Screenshot/Interactive/Exercise are the **default** for UI ACs — use these unless the AC genuinely cannot be screenshotted (e.g., server redirect, route registration, build config).
> - At least 50% of UI ACs must use screenshot-based methods. If all say `Code review`, the plan is missing visual verification.
> - The QC validator enforces this: screenshot-method ACs require `.png`/`screenshot` evidence; code-review ACs require file:line evidence.

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | {element/state to verify} | {Screenshot/Interactive/Exercise: steps} | {explicit pass condition} | | | |
| AC-UI-2 | {element/state to verify} | {Screenshot/Interactive/Exercise: steps} | {explicit pass condition} | | | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | {behavior to verify} | {Code review: file path + what to trace} | {explicit pass condition} | | | |
| AC-FN-2 | {behavior to verify} | {Code review: file path + what to trace} | {explicit pass condition} | | | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | {existing behavior to protect} | {Test run / Screenshot / Code review} | {explicit pass condition} | | | |
| AC-REG-2 | {existing behavior to protect} | {Test run / Screenshot / Code review} | {explicit pass condition} | | | |

---

## Agent Notes

{Sub-agent writes iteration-specific notes here: blockers, evidence references, screenshots taken.}

## QC Notes

{Main thread writes fix notes here: what failed, what was changed, re-verification results.}

## Reviewer Feedback

{Human writes review feedback here. Items marked for revision go back into the iteration loop.}
