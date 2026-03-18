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
| AC-FN-1 | `listTickets()` calls `supportFetch` directly | Code review: `lib/support.ts` → `listTickets` function body | No `if (process.env.MOCK_LICENSE_TIER)` guard; function body is a single `return supportFetch(...)` call | PASS — support.ts:129-131, single `return supportFetch(...)`, no guard | PASS — confirmed support.ts:129-131, single return, no guard present | |
| AC-FN-2 | `submitPriorityTicket()` calls `supportFetch` directly | Code review: `lib/support.ts` → `submitPriorityTicket` function body | No mock guard block; function body is a single `return supportFetch(...)` call | PASS — support.ts:147-154, single `return supportFetch(...)`, no guard | PASS — confirmed support.ts:147-154 | |
| AC-FN-3 | `bookSession()` calls `supportFetch` directly | Code review: `lib/support.ts` → `bookSession` function body | No mock guard block; function body is a single `return supportFetch(...)` call | PASS — support.ts:160-165, single `return supportFetch(...)`, no guard | PASS — confirmed support.ts:160-165 | |
| AC-FN-4 | `getTicketDetail()` calls `supportFetch` directly | Code review: `lib/support.ts` → `getTicketDetail` function body | No mock guard block; function uses `Promise.all([supportFetch(...), supportFetch(...)])` | PASS — support.ts:172-181, `Promise.all([supportFetch(...), supportFetch(...)])`, no guard | PASS — confirmed support.ts:172-181, Promise.all with two supportFetch calls, no guard | |
| AC-FN-5 | `replyToTicket()` calls `supportFetch` directly | Code review: `lib/support.ts` → `replyToTicket` function body | No mock guard block; function body is a single `return supportFetch(...)` call | PASS — support.ts:184-192, single `return supportFetch(...)`, no guard | PASS — confirmed support.ts:184-192 | |
| AC-FN-6 | `acceptLegalDocs()` calls real platform endpoint | Code review: `lib/legal.ts` → `acceptLegalDocs` function body | No `if (process.env.MOCK_LICENSE_TIER)` guard; function proceeds to `getLicenseKey()` and `fetch(PLATFORM_URL/api/legal/accept)` | PASS — legal.ts:121-151, no `MOCK_LICENSE_TIER` guard; `getLicenseKey()` at line 124, `fetch(PLATFORM_URL/api/legal/accept)` at line 130 | PASS — confirmed legal.ts:121-151, getLicenseKey() at 124, fetch at 130, no guard | |
| AC-FN-7 | Dead mock constants removed from `lib/support.ts` | Code review: `lib/support.ts` bottom section | `MOCK_TICKETS`, `MOCK_TICKETS_RESPONSE`, and `MOCK_REPLIES` constants do not exist in the file | PASS — none of `MOCK_TICKETS`, `MOCK_TICKETS_RESPONSE`, `MOCK_REPLIES` appear anywhere in support.ts | PASS — file ends at line 234 after createCommunityIssue; no mock constants anywhere | |
| AC-FN-8 | `MOCK_LEGAL_DOCS` retained in `lib/legal.ts` | Code review: `lib/legal.ts` | `MOCK_LEGAL_DOCS` constant still present; used by `fetchLegalDoc` and `fetchAllLegalDocs` when `NODE_ENV === "test"` | PASS — legal.ts:157 defines `MOCK_LEGAL_DOCS`; used at legal.ts:58 (`fetchLegalDoc`) and legal.ts:87 (`fetchAllLegalDocs`) for `NODE_ENV === "test"` | PASS — confirmed legal.ts:157, referenced at :58 and :87 | |
| AC-FN-9 | `fetchLegalDoc` hybrid strategy unchanged | Code review: `lib/legal.ts` → `fetchLegalDoc` | `MOCK_LICENSE_TIER` branch still present in `fetchLegalDoc` — tries live platform first, falls back to `MOCK_LEGAL_DOCS` for offline dev | PASS — legal.ts:60-69, `MOCK_LICENSE_TIER` branch present; tries live platform at line 67, falls back to `mockDoc` for offline dev | PASS — confirmed legal.ts:60-69 intact | |
| AC-FN-10 | `createCommunityIssue()` unchanged | Code review: `lib/support.ts` → `createCommunityIssue` | Function body identical to pre-change; no mock guard was present, none added | PASS — support.ts:199-232, direct `fetch()` to platform, no mock guard | PASS — confirmed support.ts:199-232, direct fetch, no mock guard | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | TypeScript compiles clean | Test run: `npm run typecheck` | Exit 0, 0 errors | PASS — `npm run typecheck` exited 0, no errors | PASS — confirmed via precheck run (exit 0) | |
| AC-REG-2 | ESLint passes | Test run: `npm run lint` | Exit 0, 0 errors | PASS — `npm run lint` exited 0; 1 pre-existing warning in SalesClient.tsx (TanStack Table, acceptable per spec), 0 errors | PASS — confirmed exit 0; pre-existing warning is unrelated to this change | |
| AC-REG-3 | Full test suite passes | Test run: `npm run test:ci` | All suites pass, 0 failures | PASS — 93 suites, 1089 tests, 0 failures | PASS — 93 suites / 1089 tests match feature/phase3g-legal baseline | |
| AC-REG-4 | No unused variable errors from deleted constants | Code review: `lib/support.ts` | No remaining references to `MOCK_TICKETS`, `MOCK_TICKETS_RESPONSE`, or `MOCK_REPLIES` anywhere in the file | PASS — confirmed absent from support.ts (all 234 lines reviewed) | PASS — file read in full; no references remain | |
| AC-REG-5 | `createCommunityIssue` still exported | Code review: `lib/support.ts` | Function is exported and callable without auth | PASS — support.ts:199 `export async function createCommunityIssue(...)` | PASS — confirmed support.ts:199 | |
| AC-REG-6 | `lib/legal.ts` exports unchanged | Code review: `lib/legal.ts` | `fetchLegalDoc`, `fetchAllLegalDocs`, `acceptLegalDocs`, `getLegalUrl`, `LegalDocument` all still exported | PASS — legal.ts:12 (`LegalDocument`), legal.ts:13 (`getLegalUrl`), legal.ts:55 (`fetchLegalDoc`), legal.ts:85 (`fetchAllLegalDocs`), legal.ts:121 (`acceptLegalDocs`) | PASS — all 5 exports confirmed at their respective lines | |

---

## Agent Notes

Verified 2026-03-18. All 16 ACs passed on first run (0 iterations). Test suite: 93 suites / 1089 tests / 0 failures. TypeScript exits 0. ESLint exits 0 with 1 pre-existing TanStack Table warning in SalesClient.tsx (acceptable per spec). Both `lib/support.ts` and `lib/legal.ts` are clean — mock constants fully removed from support.ts, mock data correctly retained in legal.ts for test/dev use.

## QC Notes

0 iterations. All 16 ACs confirmed by independent file read. No fixes required.

## Reviewer Feedback

{Human writes review feedback here.}
