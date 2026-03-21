# Install Assurance — AC Verification Report

**Branch:** `feat/install-assurance`
**Commits:** 6
**Iterations:** 0

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
| AC-UI-1 | VERIFICATION.md renders correctly on GitHub | Code review: open VERIFICATION.md, inspect table structure | All AC tables render; sections visible; no raw markdown artifacts | | | |

---

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | qa-agent parses all AC tables from VERIFICATION.md | Code review: scripts/qa-agent.js — table parsing logic | All three sections (Install Flow, Known Value Round-Trips, Initial App State) parsed into structured rows |  | | |
| AC-FN-2 | Agent works through every AC in VERIFICATION.md in order | Code review: scripts/qa-agent.js system prompt + done tool | done tool returns results array with one entry per AC row | | | |
| AC-FN-3 | Agent uses Claude computer use (screenshot → action) not Puppeteer tools | Code review: scripts/qa-agent.js | Uses `computer_use` tool type; no custom click-finder DOM logic | | | |
| AC-FN-4 | Production workflow debounces on push to main (30 min) | Code review: .github/workflows/install-test.yml | `on: push`, `cancel-in-progress: true`, `sleep 1800` in job | | | |
| AC-FN-5 | Development dispatch bypasses debounce | Code review: .github/workflows/install-test.yml | `skip_debounce` input skips the sleep step when true | | | |
| AC-FN-6 | GitHub issue opened on agent fail OR infra fail | Code review: .github/workflows/install-test.yml | `gh issue create` in `if: failure()` with per-AC results from agent output | | | |
| AC-FN-7 | VERIFICATION.md never modified by agent or workflow | Code review: scripts/qa-agent.js + install-test.yml | No file write or git commit to VERIFICATION.md anywhere in the system | | | |
| AC-FN-8 | Known values resolved from env vars before being passed to Claude | Code review: scripts/qa-agent.js | process.env values injected into system prompt; no $VAR strings sent to Claude | | | |
| AC-FN-9 | Spec-drift check posts PR comment when setup files change without VERIFICATION.md | Code review: .github/workflows/spec-drift.yml | paths-filter detects setup paths changed + spec not changed → comment posted | | | |
| AC-FN-10 | Model used is claude-sonnet-4-6 not Opus | Code review: scripts/qa-agent.js | model field = "claude-sonnet-4-6" | | | |

---

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | Existing nightly-build.yml unaffected | Code review: .github/workflows/nightly-build.yml | File unchanged | | | |
| AC-REG-2 | Existing build-safe-main.yml unaffected | Code review: .github/workflows/build-safe-main.yml | File unchanged | | | |
| AC-REG-3 | install-matrix.yml unaffected | Code review: .github/workflows/install-matrix.yml | File unchanged | | | |

---

## Agent Notes

_To be filled by verification sub-agent during `/ac-verify`._

## QC Notes

_To be filled by main thread during QC pass._

## Reviewer Feedback

_To be filled by human reviewer._
