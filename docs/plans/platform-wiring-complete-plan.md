# Platform Wiring Complete — Plan

**Branch:** `feat/platform-wiring-complete`
**Release:** `0.98.2` patch
**ACs:** `docs/plans/platform-wiring-complete-ACs.md`

Both features were already fully coded and gated on platform delivery.
No app changes needed — scope is smoke-verify → test → ship.

---

## Features

### 1. `acceptedAt` / `acceptedVersions` in Terms Page

`DocVersionStatus` already reads `legalState?.acceptedVersions[slug]` and
`legalState?.acceptedAt[slug]`. `validateLicense()` passes the full platform
response through. Now that the platform ships these fields in
`POST /api/license/validate`, the dates will render automatically.

**Relevant files (no changes needed):**

- `app/admin/terms/_components/DocVersionStatus.tsx`
- `app/admin/terms/_components/LegalDocPage.tsx`
- `lib/license.ts` — `validateLicense()`
- `lib/license-types.ts` — `LegalState.acceptedVersions`, `LegalState.acceptedAt`

### 2. Ticket Reply / Thread View

`TicketDetailSheet` has a full thread view + reply form. `lib/support.ts`
calls `GET /api/support/tickets/{id}` and `GET /api/support/tickets/{id}/replies`
in parallel for thread load, and `POST /api/support/tickets/{id}/replies` for
sending. `SupportPageClient` opens the sheet on priority ticket click.

**Relevant files (no changes needed):**

- `app/admin/support/_components/TicketDetailSheet.tsx`
- `app/admin/support/SupportTicketsSection.tsx`
- `app/admin/support/actions.ts` — `fetchTicketDetail`, `submitTicketReply`
- `lib/support.ts` — `getTicketDetail`, `replyToTicket`
- `lib/support-types.ts` — `TicketReply`, `TicketDetailResponse`, `ReplyResponse`

---

## Task Breakdown

### Task 1: Smoke test — Terms page acceptance dates

**Verify (no code changes):**
With a real license key active, visit each Terms doc page and confirm
`acceptedAt` dates render under the accepted version rows.

**Pass:** Each accepted doc shows "Accepted · [date]" under its version.

### Task 2: Smoke test — Ticket reply thread

**Verify (no code changes):**
With a real license key, open a priority ticket in the Support page.
Confirm thread loads, submit a reply, confirm it appends with toast.

**Pass:** Thread renders, reply appears, "Reply sent" toast fires.

### Task 3: Unit tests — `fetchTicketDetail` + `submitTicketReply`

**New file:** `app/admin/support/__tests__/ticket-reply.test.ts`

Follow the pattern in `app/admin/support/__tests__/community-issue.test.ts`.
Mock: `@/lib/support`, `@/lib/admin`, `next/cache`.

Cases to cover:

- `fetchTicketDetail` happy path → `{ success: true, data }`
- `fetchTicketDetail` SupportError → `{ success: false, error }`
- `submitTicketReply` happy path → `{ success: true, data }`
- `submitTicketReply` empty body → validation error
- `submitTicketReply` SupportError with error code passthrough (e.g. `ticket_not_open`)

### Task 4: Version bump + CHANGELOG

- `package.json` → `0.98.2`
- `CHANGELOG.md` → document both features as live

---

## Commit Schedule

```text
test: add unit tests for fetchTicketDetail and submitTicketReply
chore: bump version to 0.98.2
```
