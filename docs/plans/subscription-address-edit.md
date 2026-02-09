# Plan: Subscription Shipping Address Edit

## Context

Customers can currently edit the shipping address on **orders** (PR #72), but there's no way to update the shipping address on a **subscription** without contacting support. The Stripe Customer Portal only supports billing address changes, not shipping. This feature lets customers self-service their subscription shipping address from the account page, propagating changes to the Subscription record, Stripe metadata (for future renewals), and the user's address book.

**Key scope decision**: This edit affects **future orders** created by the subscription at next renewal — it does NOT cascade to existing pending orders.

---

## Scope

- **2 new files**: shared hook + API endpoint
- **1 new component**: shared EditAddressDialog
- **2 modified files**: SubscriptionsTab (add edit UI) + OrdersPageClient (refactor to use shared hook)
- **1 skill update**: ac-verify (add interactive testing support)
- **0 schema changes**: Subscription model already has all address fields

---

## Step 1: Create Shared `useEditAddress` Hook

**New file**: `hooks/useEditAddress.ts`

Extract the address-edit service logic from `OrdersPageClient.tsx` (lines 200-211, 291-407) into a reusable hook that both OrdersPageClient and SubscriptionsTab can consume.

### Interface

```typescript
interface AddressForm {
  recipientName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface AddressEntity {
  id: string;
  recipientName: string | null;
  shippingStreet: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
}

interface UseEditAddressOptions {
  getEndpointUrl: (entityId: string) => string;
  successMessage: string;
  onSuccess: (entityId: string, form: AddressForm) => void;
}
```

### Hook returns

```typescript
{
  dialogOpen, setDialogOpen,
  editingEntity,
  savedAddresses,
  addressForm, setAddressForm,
  formLoading,
  openDialog: (entity: AddressEntity) => void,
  handleSelect: (value: string) => void,
  handleSubmit: (e: React.FormEvent) => void,
}
```

### Encapsulated logic

- Address form state management (init from entity, reset on dialog close)
- Saved address fetching (`GET /api/user/addresses`, non-blocking)
- Address selector logic: "current" resets to entity address, saved loads fields (preserves recipientName), "custom" clears with country="US"
- Form submission: PATCH to configurable endpoint, call `onSuccess` callback, success/error toast

## Step 2: Create Shared `EditAddressDialog` Component

**New file**: `components/EditAddressDialog.tsx`

Extract the dialog JSX that is identical between orders and subscriptions into a shared component.

### Props

```typescript
interface EditAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  savedAddresses: SavedAddress[];
  addressForm: AddressForm;
  formLoading: boolean;
  onAddressSelect: (value: string) => void;
  onFieldChange: (field: keyof AddressForm, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}
```

### Renders

- Dialog wrapper with configurable title/description
- Saved address Select (current, saved addresses with default indicator, custom)
- 6 form fields: recipientName, street, city+state row, postalCode+country row
- Footer: Cancel + Save buttons (Save shows Loader2 when loading)

## Step 3: Refactor OrdersPageClient to Use Shared Hook

**Modified file**: `app/(site)/orders/OrdersPageClient.tsx`

- Remove inline state: `editAddressDialogOpen`, `editingOrder`, `savedAddresses`, `addressFormLoading`, `addressForm` (lines 200-211)
- Remove inline handlers: `openEditAddressDialog`, `handleAddressSelect`, `handleAddressSubmit` (lines 291-407)
- Remove inline Dialog JSX (lines 680-827)
- Replace with shared hook + component
- **Regression**: OrdersPageClient behavior must remain identical after refactor.

## Step 4: Create Subscription Address API Endpoint

**New file**: `app/api/user/subscriptions/[id]/address/route.ts`

Mirrors `app/api/user/orders/[orderId]/address/route.ts` without the pending order cascade.

**PATCH handler flow**:

1. Auth check (401)
2. Fetch subscription by `id`, select `id, userId, status, stripeSubscriptionId`
3. Not-found check (404)
4. Ownership check — `sub.userId !== session.user.id` (403)
5. Status gate — only ACTIVE or PAUSED allowed (400)
6. Zod validation — 6 required fields: recipientName, street, city, state, postalCode, country (400)
7. `prisma.subscription.update` — update the 6 address fields
8. `updateStripeSubscriptionShipping()` — update Stripe metadata for future renewals (already catches errors internally)
9. `saveUserAddress()` — persist to user's address book (dedup built-in)
10. Return `{ success: true }`

## Step 5: Add Edit UI to SubscriptionsTab

**Modified file**: `app/(site)/account/tabs/SubscriptionsTab.tsx`

### Visibility gate

```typescript
const canEditAddress = (sub: Subscription) =>
  sub.status === "ACTIVE" || sub.status === "PAUSED";
```

Hide for CANCELED/PAST_DUE.

### UI changes

- Add "Edit" button (ghost, small, MapPin icon) next to "Shipping to" label — visible when `canEditAddress(sub)` and `sub.shippingStreet` exists
- Add `<EditAddressDialog>` with subscription-specific title/description

## Step 6: Update ac-verify Skill — Interactive Testing Support

**Modified file**: `.claude/skills/ac-verify/SKILL.md`

Add interactive/exercise verification method categories and Puppeteer interaction patterns.

---

## Acceptance Criteria

### UI

- **AC-UI-1**: "Edit" button appears next to "Shipping to" for ACTIVE/PAUSED subscriptions. Not visible for CANCELED/PAST_DUE.
- **AC-UI-2**: Dialog opens with saved-address selector and 6 form fields pre-filled from current subscription address.
- **AC-UI-3**: Saved address selector works: "current" resets, saved address loads (preserves recipientName), "custom" clears form.
- **AC-UI-4**: On success: local state updates immediately, success toast appears, dialog closes.
- **AC-UI-5**: On error: destructive toast with error message, dialog stays open.
- **AC-UI-6**: On mobile view: verify the trigger to open edit address in the subscriptions tab is accessible and functional.

### Functional

- **AC-FN-1**: Endpoint validates all 6 fields (Zod, min length 1). Returns 400 on failure.
- **AC-FN-2**: Endpoint enforces auth (401), ownership (403), status gate (400 if not ACTIVE/PAUSED).
- **AC-FN-3**: Subscription record's 6 address fields updated in DB.
- **AC-FN-4**: Stripe subscription metadata updated. Stripe failure does not fail the request.
- **AC-FN-5**: New address saved to user's address book (dedup handled internally).
- **AC-FN-6**: OrdersPageClient refactored to use shared hook — behavior identical to before.

### Regression

- **AC-REG-1**: Skip/resume/cancel actions still work alongside the new edit button.
- **AC-REG-2**: Order address edit on Orders page unaffected (same UX after refactor).
- **AC-REG-3**: Build passes (`npm run precheck`).

---

## Commit Schedule

1. `refactor: extract shared useEditAddress hook and EditAddressDialog component` — new hook + component, refactor OrdersPageClient
2. `feat: add subscription address edit API endpoint` — new route file
3. `feat: add subscription address edit UI to SubscriptionsTab` — UI changes using shared hook
4. `chore: update ac-verify skill with interactive testing support` — skill template update
