# E2E Testing Strategy: Store ↔ Platform Integration

## Context

Phases 1–3c are complete. The store repo has full platform integration (Plan page, Support page, proxy routes, mock mode). We need automated tests covering 9 acceptance criteria that span subscribe, activate, community issues, and priority support flows. All tests live in the **store repo** since that's where the UI and proxy routes are.

---

## AC Classification

| AC | Description | Test Type | Why |
|----|-------------|-----------|-----|
| AC-E2E-1 | Subscribe → Stripe checkout | Browser E2E | Real navigation to checkout.stripe.com |
| AC-E2E-2 | Auto-activate (webhook) | Integration (Jest) | API route, no browser needed |
| AC-E2E-3 | Manual activate (paste key) | Browser E2E | Form interaction + UI update |
| AC-E2E-4 | Submit community issue | Browser E2E | Form + toast + GitHub link |
| AC-E2E-5 | Submit priority ticket | Browser E2E | Form + list update + quota |
| AC-E2E-6 | Checkout platform down | Integration (Jest) | API proxy returns 500 |
| AC-E2E-7 | Auto-activate bad key | Integration (Jest) | API route returns 400 |
| AC-E2E-8 | No contactEmail configured | Integration (Jest) | API validation |
| AC-E2E-9 | Plans API unreachable | Integration (Jest) | Error state, no crash |

**5 integration tests** (Jest, already set up) + **4 browser E2E tests** (Playwright, new)

---

## Phase 1: Integration Tests (Jest) — 5 ACs

All in `__tests__/` directory, using existing Jest + mock patterns.

### File: `__tests__/api/platform/activate.test.ts`

- **AC-E2E-2**: POST `/api/admin/platform/activate` with valid key → key saved, `validateLicense()` called, returns plan data
- **AC-E2E-7**: POST with malformed payload → 400 response with error message

### File: `__tests__/api/platform/checkout.test.ts`

- **AC-E2E-6**: POST `/api/admin/platform/checkout` when platform returns 500 → proxy returns error toast-friendly JSON

### File: `__tests__/api/platform/tickets.test.ts`

- **AC-E2E-8**: POST community issue without `contactEmail` configured → error message returned

### File: `__tests__/api/platform/status.test.ts`

- **AC-E2E-9**: GET `/api/admin/platform/status` when platform unreachable → returns error shape, no crash

### Approach

- Mock `fetch` globally to simulate platform responses (success, 500, network error)
- Use existing `MOCK_LICENSE_TIER` paths where applicable
- Test request construction, error handling, response shapes

---

## Phase 2: Playwright Setup (new)

### Install & Configure

```bash
npm install -D @playwright/test
npx playwright install chromium
```

### File: `playwright.config.ts`

- Base URL: `http://localhost:3000`
- Single project: Chromium only (matches store's target)
- Web server: `npm run dev` on port 3000
- Timeout: 30s per test

### Mock Platform Server: `e2e/mock-platform.ts`

Lightweight Express/http server on port 9999 returning canned JSON:

- `GET /api/features` → feature list with `priority-support`
- `POST /api/support/tickets` → `{ id, title, status, used, limit }`
- `POST /api/support/issues` → `{ issueNumber, issueUrl }`
- `GET /api/support/tickets` → ticket list + usage
- `POST /api/checkout/sessions` → `{ url: "https://checkout.stripe.com/test" }`
- `POST /api/instances/*/validate-key` → license validation response
- Configurable: can return errors per-route for failure scenarios

### Env for E2E

```env
NEXT_PUBLIC_PLATFORM_URL=http://localhost:9999
LICENSE_KEY=ar_lic_test_key_for_e2e
```

---

## Phase 3: Browser E2E Tests (Playwright) — 4 ACs

### File: `e2e/subscribe.spec.ts`

- **AC-E2E-1**: Navigate to Plan page → click Subscribe CTA → verify redirect to `checkout.stripe.com`
- Mock platform returns checkout URL; test verifies navigation attempt

### File: `e2e/activate.spec.ts`

- **AC-E2E-3**: Navigate to Plan page → paste license key → click Activate → verify masked key appears, plan badge updates

### File: `e2e/community-issue.spec.ts`

- **AC-E2E-4**: Navigate to Support page → fill title + body → Submit → verify success toast with GitHub link

### File: `e2e/priority-ticket.spec.ts`

- **AC-E2E-5**: Navigate to Support page (with priority-support feature) → fill title → Submit → verify ticket appears in list, quota indicator decrements

### Approach

- Mock platform server provides all API responses
- No real Stripe, no real GitHub — purely testing store UI behavior
- Each spec is independent (mock server state resets between tests)

---

## Phase 4: CI Integration

### File: `.github/workflows/ci.yml` (modify)

Add E2E job after existing test job:

```yaml
e2e:
  runs-on: ubuntu-latest
  needs: test
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - run: npm ci
    - run: npx playwright install chromium --with-deps
    - run: npm run test:e2e
    - uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/
```

### Scripts: `package.json`

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

---

## Implementation Order

1. **Phase 1**: Integration tests (Jest) — AC-E2E-2, 6, 7, 8, 9
2. **Phase 2**: Playwright config + mock platform server
3. **Phase 3**: Browser E2E specs — AC-E2E-1, 3, 4, 5
4. **Phase 4**: CI pipeline update

---

## Key Files to Modify/Create (store repo)

| File | Action |
|------|--------|
| `__tests__/api/platform/activate.test.ts` | Create |
| `__tests__/api/platform/checkout.test.ts` | Create |
| `__tests__/api/platform/tickets.test.ts` | Create |
| `__tests__/api/platform/status.test.ts` | Create |
| `playwright.config.ts` | Create |
| `e2e/mock-platform.ts` | Create |
| `e2e/subscribe.spec.ts` | Create |
| `e2e/activate.spec.ts` | Create |
| `e2e/community-issue.spec.ts` | Create |
| `e2e/priority-ticket.spec.ts` | Create |
| `package.json` | Modify (add scripts + devDeps) |
| `.github/workflows/ci.yml` | Modify (add e2e job) |

## Existing Code to Reuse

- `lib/license.ts` — `validateLicense()`, `activateLicense()` (store's platform client)
- `lib/plans.ts` — `getPlans()`, `getCheckoutUrl()`
- `lib/support.ts` — `getTickets()`, `createTicket()`, `createCommunityIssue()`
- `MOCK_LICENSE_TIER` env var — already wired for mock mode in platform client
- Existing Jest setup in `jest.config.ts` + `__tests__/` directory

## Verification

1. `npm test` — all 5 new integration tests pass
2. `npm run test:e2e` — all 4 browser E2E specs pass with mock platform server
3. CI pipeline runs both test jobs successfully
4. All 9 ACs have automated coverage
