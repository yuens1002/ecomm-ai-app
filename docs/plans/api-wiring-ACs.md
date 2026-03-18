# API Wiring — AC Verification Report

**Branch:** `feat/api-wiring`
**Commits:** 1
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

_None — this feature is code-only (no UI changes)._

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | `listTickets()` calls `supportFetch` directly | Code review: `lib/support.ts` → `listTickets` function body | No `if (process.env.MOCK_LICENSE_TIER)` guard; function body is a single `return supportFetch(...)` call | | | |
| AC-FN-2 | `submitPriorityTicket()` calls `supportFetch` directly | Code review: `lib/support.ts` → `submitPriorityTicket` function body | No mock guard block; function body is a single `return supportFetch(...)` call | | | |
| AC-FN-3 | `bookSession()` calls `supportFetch` directly | Code review: `lib/support.ts` → `bookSession` function body | No mock guard block; function body is a single `return supportFetch(...)` call | | | |
| AC-FN-4 | `getTicketDetail()` calls `supportFetch` directly | Code review: `lib/support.ts` → `getTicketDetail` function body | No mock guard block; function uses `Promise.all([supportFetch(...), supportFetch(...)])` | | | |
| AC-FN-5 | `replyToTicket()` calls `supportFetch` directly | Code review: `lib/support.ts` → `replyToTicket` function body | No mock guard block; function body is a single `return supportFetch(...)` call | | | |
| AC-FN-6 | `acceptLegalDocs()` calls real platform endpoint | Code review: `lib/legal.ts` → `acceptLegalDocs` function body | No `if (process.env.MOCK_LICENSE_TIER)` guard; function proceeds to `getLicenseKey()` and `fetch(PLATFORM_URL/api/legal/accept)` | | | |
| AC-FN-7 | Dead mock constants removed from `lib/support.ts` | Code review: `lib/support.ts` bottom section | `MOCK_TICKETS`, `MOCK_TICKETS_RESPONSE`, and `MOCK_REPLIES` constants do not exist in the file | | | |
| AC-FN-8 | `MOCK_LEGAL_DOCS` retained in `lib/legal.ts` | Code review: `lib/legal.ts` | `MOCK_LEGAL_DOCS` constant still present; used by `fetchLegalDoc` and `fetchAllLegalDocs` when `NODE_ENV === "test"` | | | |
| AC-FN-9 | `fetchLegalDoc` hybrid strategy unchanged | Code review: `lib/legal.ts` → `fetchLegalDoc` | `MOCK_LICENSE_TIER` branch still present in `fetchLegalDoc` — tries live platform first, falls back to `MOCK_LEGAL_DOCS` for offline dev | | | |
| AC-FN-10 | `createCommunityIssue()` unchanged | Code review: `lib/support.ts` → `createCommunityIssue` | Function body identical to pre-change; no mock guard was present, none added | | | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | TypeScript compiles clean | Test run: `npm run typecheck` | Exit 0, 0 errors | | | |
| AC-REG-2 | ESLint passes | Test run: `npm run lint` | Exit 0, 0 errors | | | |
| AC-REG-3 | Full test suite passes | Test run: `npm run test:ci` | All suites pass, 0 failures | | | |
| AC-REG-4 | No unused variable errors from deleted constants | Code review: `lib/support.ts` | No remaining references to `MOCK_TICKETS`, `MOCK_TICKETS_RESPONSE`, or `MOCK_REPLIES` anywhere in the file | | | |
| AC-REG-5 | `createCommunityIssue` still exported | Code review: `lib/support.ts` | Function is exported and callable without auth | | | |
| AC-REG-6 | `lib/legal.ts` exports unchanged | Code review: `lib/legal.ts` | `fetchLegalDoc`, `fetchAllLegalDocs`, `acceptLegalDocs`, `getLegalUrl`, `LegalDocument` all still exported | | | |

---

## Agent Notes

{Sub-agent writes iteration-specific notes here.}

## QC Notes

{Main thread writes fix notes here.}

## Reviewer Feedback

{Human writes review feedback here.}
