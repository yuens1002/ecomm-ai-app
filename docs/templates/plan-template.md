# {Feature Name} — Plan

**Branch:** `feat/{branch-name}`
**Base:** `main`

---

## Context

{Brief description of the problem/feature and why it's needed.}

---

## Commit Schedule

| # | Message | Issues | Risk |
|---|---------|--------|------|
| 0 | `docs: add plan for {feature}` | — | — |
| 1 | `{type}: {description}` | {issue IDs} | Low/Medium/High |
| 2 | `{type}: {description}` | {issue IDs} | Low/Medium/High |

---

## Acceptance Criteria

{Copy the ACs here during planning. After plan approval, these are extracted into the ACs tracking doc (see `docs/templates/acs-template.md`).}

### UI (verified by screenshots)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-UI-1 | {element/state} | {Static/Interactive/Exercise: steps} | {pass condition} |
| AC-UI-2 | {element/state} | {Static/Interactive/Exercise: steps} | {pass condition} |

### Functional (verified by code review)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-FN-1 | {behavior} | {Code review: file + trace path} | {pass condition} |
| AC-FN-2 | {behavior} | {Code review: file + trace path} | {pass condition} |

### Regression (verified by test suite + spot-check)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-REG-1 | {existing behavior} | {Test run / Screenshot} | {pass condition} |
| AC-REG-2 | {existing behavior} | {Test run / Screenshot} | {pass condition} |

---

## Implementation Details

### Commit {n}: {title}

**Files:**

- `path/to/file.tsx` — {what changes}

{Implementation notes, code snippets, key decisions.}

---

## Files Changed ({n} modified, {n} new)

| File | Commit | Issues |
|------|--------|--------|
| `path/to/file.tsx` | {n} | {issue IDs} |

---

## Verification & Workflow Loop

After plan approval:

1. Commit plan to branch
2. Register `verification-status.json`: `{ status: "planned", acs_total: {n} }`
3. Extract ACs into `docs/plans/{feature}-ACs.md` using the ACs template
4. Transition to `"implementing"` when coding begins

After implementation:

1. Transition to `"pending"`
2. Run `npm run precheck`
3. Spawn `/ac-verify` sub-agent — sub-agent fills the **Agent** column
4. Main thread reads report, fills **QC** column
5. If any fail → fix → re-verify ALL ACs
6. When all pass → hand off ACs doc to human → human fills **Reviewer** column
