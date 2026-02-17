/** @jest-environment node */

import { z } from "zod";
import type Stripe from "stripe";

// ---------- Mocks ----------

const mockUserFindUnique = jest.fn();
const mockUserFindFirst = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      findFirst: (...args: unknown[]) => mockUserFindFirst(...args),
    },
  },
}));

jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockNormalizeCheckoutSession = jest.fn();
jest.mock("@/lib/payments/stripe/adapter", () => ({
  normalizeCheckoutSession: (...args: unknown[]) => mockNormalizeCheckoutSession(...args),
  normalizeSubscription: jest.fn(),
  storeShippingInStripeMetadata: jest.fn(),
}));

const mockCreateOrdersFromCheckout = jest.fn();
jest.mock("@/lib/orders", () => ({
  createOrdersFromCheckout: (...args: unknown[]) => mockCreateOrdersFromCheckout(...args),
  linkSubscriptionToOrder: jest.fn(),
}));

jest.mock("@/lib/orders/address-utils", () => ({
  saveUserAddress: jest.fn(),
  updateUserContactInfo: jest.fn(),
}));

jest.mock("@/lib/email", () => ({
  getStoreName: jest.fn().mockResolvedValue("Test Store"),
}));

jest.mock("@/lib/email/send-order-confirmation", () => ({
  sendOrderConfirmation: jest.fn(),
}));

jest.mock("@/lib/email/send-merchant-notification", () => ({
  sendMerchantNotification: jest.fn(),
}));

jest.mock("@/lib/services/subscription", () => ({
  ensureSubscription: jest.fn(),
}));

// ---------- Zod schemas ----------

/** Schema for the userId passed to createOrdersFromCheckout */
const CreateOrderCallSchema = z.object({
  userId: z.string().nullable(),
  customerEmail: z.string().nullable(),
});

// ---------- Fixtures ----------

const DEMO_USER = { id: "user_demo_123", name: "Demo User", phone: null };
const ADMIN_USER = { id: "user_admin_456", name: "Admin User", phone: null };

function buildNormalizedCheckout(overrides: Record<string, unknown> = {}) {
  return {
    processor: "stripe",
    sessionId: "cs_test_123",
    subscriptionId: null,
    customer: {
      processorCustomerId: "cus_123",
      email: "admin@artisanroast.com",
      phone: null,
      name: "Admin User",
    },
    items: [{ purchaseOptionId: "po_1", quantity: 1 }],
    deliveryMethod: "DELIVERY",
    shippingAddress: null,
    shippingName: "John Dough",
    paymentInfo: {
      processor: "stripe",
      transactionId: "pi_123",
      chargeId: "ch_123",
      invoiceId: null,
      cardLast4: "4242",
      paymentMethod: "card",
    },
    totalInCents: 3500,
    discountAmountInCents: 0,
    ...overrides,
  };
}

function buildContext(metadata: Record<string, string> = {}): {
  event: Stripe.Event;
  stripe: Stripe;
} {
  return {
    event: {
      id: "evt_123",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          mode: "payment",
          metadata,
          customer_details: { email: "admin@artisanroast.com" },
          collected_information: null,
        },
      },
    } as unknown as Stripe.Event,
    stripe: {
      checkout: {
        sessions: {
          retrieve: jest.fn().mockResolvedValue({
            id: "cs_test_123",
            mode: "payment",
            metadata,
            customer_details: {
              email: "admin@artisanroast.com",
              address: null,
            },
            collected_information: null,
          }),
        },
      },
    } as unknown as Stripe,
  };
}

// ---------- Tests ----------

describe("handleCheckoutSessionCompleted — user lookup", () => {
  let handleCheckoutSessionCompleted: typeof import("../checkout-session-completed").handleCheckoutSessionCompleted;

  beforeAll(async () => {
    const mod = await import("../checkout-session-completed");
    handleCheckoutSessionCompleted = mod.handleCheckoutSessionCompleted;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateOrdersFromCheckout.mockResolvedValue({
      success: true,
      orders: [],
    });
  });

  it("uses metadata.userId when present and valid", async () => {
    mockUserFindUnique.mockResolvedValue(DEMO_USER);
    mockNormalizeCheckoutSession.mockResolvedValue(
      buildNormalizedCheckout({ customer: { processorCustomerId: "cus_123", email: "admin@artisanroast.com", phone: null, name: "Admin" } })
    );

    const context = buildContext({
      userId: "user_demo_123",
      cartItems: JSON.stringify([{ po: "po_1", qty: 1 }]),
      deliveryMethod: "DELIVERY",
    });

    await handleCheckoutSessionCompleted(context);

    // Should look up by userId first
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { id: "user_demo_123" },
      select: { id: true, name: true, phone: true },
    });

    // Should NOT fall back to email lookup
    expect(mockUserFindFirst).not.toHaveBeenCalled();

    // Order should be created with the metadata userId
    const callArg = mockCreateOrdersFromCheckout.mock.calls[0][0];
    const validated = CreateOrderCallSchema.safeParse(callArg);
    expect(validated.success).toBe(true);
    expect(callArg.userId).toBe("user_demo_123");
  });

  it("falls back to email lookup when metadata.userId is missing", async () => {
    mockUserFindFirst.mockResolvedValue(ADMIN_USER);
    mockNormalizeCheckoutSession.mockResolvedValue(
      buildNormalizedCheckout()
    );

    const context = buildContext({
      cartItems: JSON.stringify([{ po: "po_1", qty: 1 }]),
      deliveryMethod: "DELIVERY",
      // no userId in metadata
    });

    await handleCheckoutSessionCompleted(context);

    // Should NOT call findUnique (no userId to look up)
    expect(mockUserFindUnique).not.toHaveBeenCalled();

    // Should fall back to email lookup
    expect(mockUserFindFirst).toHaveBeenCalledWith({
      where: {
        email: { equals: "admin@artisanroast.com", mode: "insensitive" },
      },
      select: { id: true, name: true, phone: true },
    });

    expect(mockCreateOrdersFromCheckout.mock.calls[0][0].userId).toBe("user_admin_456");
  });

  it("falls back to email when metadata.userId not found in DB", async () => {
    // userId from metadata doesn't match any user
    mockUserFindUnique.mockResolvedValue(null);
    mockUserFindFirst.mockResolvedValue(ADMIN_USER);
    mockNormalizeCheckoutSession.mockResolvedValue(
      buildNormalizedCheckout()
    );

    const { logger } = jest.requireMock("@/lib/logger");

    const context = buildContext({
      userId: "user_deleted_999",
      cartItems: JSON.stringify([{ po: "po_1", qty: 1 }]),
      deliveryMethod: "DELIVERY",
    });

    await handleCheckoutSessionCompleted(context);

    // Tried metadata userId first
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { id: "user_deleted_999" },
      select: { id: true, name: true, phone: true },
    });

    // Logged a warning
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("userId from metadata not found")
    );

    // Fell back to email
    expect(mockUserFindFirst).toHaveBeenCalled();
    expect(mockCreateOrdersFromCheckout.mock.calls[0][0].userId).toBe("user_admin_456");
  });

  it("creates order with null userId when no user found at all", async () => {
    mockUserFindFirst.mockResolvedValue(null);
    mockNormalizeCheckoutSession.mockResolvedValue(
      buildNormalizedCheckout()
    );

    const context = buildContext({
      cartItems: JSON.stringify([{ po: "po_1", qty: 1 }]),
      deliveryMethod: "DELIVERY",
    });

    await handleCheckoutSessionCompleted(context);

    expect(mockCreateOrdersFromCheckout.mock.calls[0][0].userId).toBeNull();
  });
});
