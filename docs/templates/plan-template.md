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

> **How column methods:** `Screenshot:`, `Interactive:`, `Exercise:` (require `.png` evidence), or `Code review:` (only for non-visual ACs like redirects/route registration). At least 50% of UI ACs must use screenshot-based methods. See `docs/templates/acs-template.md` for full rules.

| AC | What | How | Pass |
|----|------|-----|------|
| AC-UI-1 | {element/state} | {Screenshot/Interactive/Exercise: steps} | {pass condition} |
| AC-UI-2 | {element/state} | {Screenshot/Interactive/Exercise: steps} | {pass condition} |

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

## UX Flows

{For UI features, walk through key user journeys and answer these questions. Skip for backend-only changes.}

| Flow | Question | Answer |
|------|----------|--------|
| Post-action | What happens after the user submits/saves/deletes? | {e.g., list auto-refreshes, toast shown, form clears} |
| Response | How does the user respond/follow up? | {e.g., reply via admin UI, click to view on GitHub, no action needed} |
| Error | What does the user see when something fails? | {e.g., toast with retry, inline error, fallback state} |
| Empty | What does the user see with no data? | {e.g., dashed border empty state with helper text} |
| Loading | What does the user see while waiting? | {e.g., spinner on button, skeleton, optimistic update} |

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
