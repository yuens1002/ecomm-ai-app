import React from "react";
import { render, screen } from "@testing-library/react";
import OrderDetailClient from "../OrderDetailClient";
import type { OrderWithItems, OrderItemWithDetails } from "@/lib/types";

// Mock useSiteSettings
jest.mock("@/hooks/useSiteSettings", () => ({
  useSiteSettings: () => ({
    settings: { storeName: "Test Store" },
  }),
}));

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

function buildOrderItem(
  overrides: Partial<OrderItemWithDetails> = {}
): OrderItemWithDetails {
  return {
    id: "item_1",
    quantity: 1,
    priceInCents: 0,
    orderId: "order_1",
    purchaseOptionId: "po_1",
    purchaseOption: {
      id: "po_1",
      type: "ONE_TIME",
      priceInCents: 1500,
      billingInterval: null,
      intervalCount: null,
      variant: {
        id: "var_1",
        name: "12oz",
        product: {
          id: "prod_1",
          name: "Ethiopia Yirgacheffe",
          slug: "ethiopia-yirgacheffe",
        },
      },
    },
    ...overrides,
  } as OrderItemWithDetails;
}

function buildOrder(
  overrides: Partial<OrderWithItems> = {}
): OrderWithItems {
  return {
    id: "cltest12345678",
    totalInCents: 2500,
    discountAmountInCents: 0,
    promoCode: null,
    status: "PENDING",
    deliveryMethod: "PICKUP",
    stripeSessionId: "cs_test",
    stripePaymentIntentId: "pi_test",
    stripeCustomerId: "cus_test",
    stripeSubscriptionId: null,
    customerEmail: "test@example.com",
    customerPhone: "+1234567890",
    paymentCardLast4: "4242",
    recipientName: null,
    shippingStreet: null,
    shippingCity: null,
    shippingState: null,
    shippingPostalCode: null,
    shippingCountry: null,
    trackingNumber: null,
    carrier: null,
    shippedAt: null,
    userId: "user_1",
    createdAt: new Date("2026-02-16T12:00:00Z"),
    updatedAt: new Date("2026-02-16T12:00:00Z"),
    items: [buildOrderItem()],
    ...overrides,
  };
}

describe("OrderDetailClient — discount display", () => {
  it("does not show discount row when discountAmountInCents is 0", () => {
    const order = buildOrder({
      totalInCents: 2500,
      discountAmountInCents: 0,
      promoCode: null,
      items: [buildOrderItem({ purchaseOption: { ...buildOrderItem().purchaseOption, priceInCents: 1500 } })],
    });

    render(<OrderDetailClient order={order} />);

    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.queryByText(/Discount/)).not.toBeInTheDocument();
    expect(screen.getByText("$25.00 USD")).toBeInTheDocument();
  });

  it("shows discount row with amount when discountAmountInCents > 0", () => {
    const order = buildOrder({
      totalInCents: 2000, // $25 subtotal + $0 shipping - $5 discount
      discountAmountInCents: 500,
      promoCode: null,
      items: [buildOrderItem({ purchaseOption: { ...buildOrderItem().purchaseOption, priceInCents: 2000 } })],
    });

    render(<OrderDetailClient order={order} />);

    expect(screen.getByText("Discount")).toBeInTheDocument();
    expect(screen.getByText("-$5.00")).toBeInTheDocument();
  });

  it("shows promo code next to discount label when promoCode is set", () => {
    const order = buildOrder({
      totalInCents: 2000,
      discountAmountInCents: 500,
      promoCode: "SUMMER15",
      items: [buildOrderItem({ purchaseOption: { ...buildOrderItem().purchaseOption, priceInCents: 2000 } })],
    });

    render(<OrderDetailClient order={order} />);

    expect(screen.getByText("Discount (SUMMER15)")).toBeInTheDocument();
    expect(screen.getByText("-$5.00")).toBeInTheDocument();
  });

  it("calculates shipping correctly when discount is applied", () => {
    // items=$15, shipping=$10, discount=$5 → total=$20
    const order = buildOrder({
      totalInCents: 2000,
      discountAmountInCents: 500,
      promoCode: "SAVE5",
      deliveryMethod: "DELIVERY",
      items: [buildOrderItem({ purchaseOption: { ...buildOrderItem().purchaseOption, priceInCents: 1500 } })],
    });

    render(<OrderDetailClient order={order} />);

    // Verify discount row and total are correct
    expect(screen.getByText("Discount (SAVE5)")).toBeInTheDocument();
    expect(screen.getByText("-$5.00")).toBeInTheDocument();
    expect(screen.getByText("$10.00")).toBeInTheDocument(); // shipping
    expect(screen.getByText("$20.00 USD")).toBeInTheDocument(); // total
  });
});
