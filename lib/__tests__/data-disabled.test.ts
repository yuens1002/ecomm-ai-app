/** @jest-environment node */

import { getUserPurchaseHistory } from "../data";

const orderFindManyMock = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findMany: orderFindManyMock,
    },
  },
}));

describe("getUserPurchaseHistory", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns historical orders even when products are disabled", async () => {
    orderFindManyMock.mockResolvedValue([
      {
        id: "order_1",
        createdAt: new Date(),
        status: "SHIPPED",
        deliveryMethod: "DELIVERY",
        userId: "user_1",
        customerEmail: "user@example.com",
        stripeSessionId: null,
        stripePaymentIntentId: null,
        items: [
          {
            id: "item_1",
            quantity: 1,
            priceInCents: 1500,
            purchaseOption: {
              id: "po_1",
              type: "ONE_TIME",
              priceInCents: 1500,
              billingInterval: null,
              billingIntervalCount: null,
              variant: {
                id: "var_1",
                name: "12oz",
                product: {
                  id: "prod_disabled",
                  name: "Archived Coffee",
                  slug: "archived-coffee",
                  tastingNotes: ["Chocolate"],
                  roastLevel: "MEDIUM",
                  type: "COFFEE",
                  categories: [],
                  isDisabled: true,
                },
              },
            },
          },
        ],
      },
    ]);

    const result = await getUserPurchaseHistory("user_1");
    expect(result).toHaveLength(1);
    expect(result[0].items[0].purchaseOption.variant.product.name).toBe(
      "Archived Coffee"
    );
  });
});
