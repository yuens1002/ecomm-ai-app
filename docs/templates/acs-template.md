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

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | {element/state to verify} | {Static/Interactive/Exercise: steps} | {explicit pass condition} | | | |
| AC-UI-2 | {element/state to verify} | {Static/Interactive/Exercise: steps} | {explicit pass condition} | | | |

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
