/** @jest-environment node */

import { getReviewsSummary, getEntityCounts, getCustomerSplit } from "../queries/entity-queries";
import { FIXTURE_RANGE, EXPECTED } from "./fixtures";

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------

type PrismaMock = {
  review: {
    aggregate: jest.Mock;
    count: jest.Mock;
    groupBy: jest.Mock;
  };
  product: {
    count: jest.Mock;
    findUnique: jest.Mock;
  };
  user: {
    count: jest.Mock;
  };
  newsletterSubscriber: {
    count: jest.Mock;
  };
  order: {
    groupBy: jest.Mock;
  };
};

jest.mock("@/lib/prisma", () => {
  const prismaMock: PrismaMock = {
    review: {
      aggregate: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    product: {
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    newsletterSubscriber: {
      count: jest.fn(),
    },
    order: {
      groupBy: jest.fn(),
    },
  };
  return { prisma: prismaMock };
});

const { prisma } = jest.requireMock("@/lib/prisma") as { prisma: PrismaMock };

beforeEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getReviewsSummary", () => {
  it("returns avg rating, pending count, total, and top reviewed product", async () => {
    prisma.review.aggregate.mockResolvedValue({
      _avg: { rating: EXPECTED.avgRating },
    });
    prisma.review.count
      .mockResolvedValueOnce(EXPECTED.pendingReviewCount) // pending
      .mockResolvedValueOnce(3); // total
    prisma.review.groupBy.mockResolvedValue([
      { productId: "prod-1", _count: 2 },
    ]);
    prisma.product.findUnique.mockResolvedValue({
      name: "Ethiopian Yirgacheffe",
      slug: "ethiopian-yirgacheffe",
    });

    const result = await getReviewsSummary(FIXTURE_RANGE);
    expect(result.avgRating).toBeCloseTo(EXPECTED.avgRating);
    expect(result.pendingCount).toBe(EXPECTED.pendingReviewCount);
    expect(result.total).toBe(3);
    expect(result.topReviewed?.name).toBe("Ethiopian Yirgacheffe");
    expect(result.topReviewed?.count).toBe(2);
  });

  it("handles no reviews in period", async () => {
    prisma.review.aggregate.mockResolvedValue({
      _avg: { rating: null },
    });
    prisma.review.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    prisma.review.groupBy.mockResolvedValue([]);

    const result = await getReviewsSummary(FIXTURE_RANGE);
    expect(result.avgRating).toBe(0);
    expect(result.total).toBe(0);
    expect(result.topReviewed).toBeNull();
  });
});

describe("getEntityCounts", () => {
  it("returns product, user, new user, and newsletter counts", async () => {
    prisma.product.count.mockResolvedValue(42);
    prisma.user.count
      .mockResolvedValueOnce(385) // total
      .mockResolvedValueOnce(28); // new in period
    prisma.newsletterSubscriber.count.mockResolvedValue(120);

    const result = await getEntityCounts(FIXTURE_RANGE);
    expect(result.products).toBe(42);
    expect(result.users).toBe(385);
    expect(result.newUsers).toBe(28);
    expect(result.newsletterActive).toBe(120);
  });
});

describe("getCustomerSplit", () => {
  it("classifies new (1 order) vs repeat (2+ orders)", async () => {
    // user-1: 2 orders (repeat), user-2: 2 orders (repeat), user-3: 1 order (new)
    prisma.order.groupBy.mockResolvedValue([
      { userId: "user-1", _count: 2 },
      { userId: "user-2", _count: 2 },
      { userId: "user-3", _count: 1 },
    ]);

    const result = await getCustomerSplit({});
    expect(result.newCustomers).toBe(1);
    expect(result.repeatCustomers).toBe(2);
  });

  it("returns all zeros when no orders", async () => {
    prisma.order.groupBy.mockResolvedValue([]);

    const result = await getCustomerSplit({});
    expect(result.newCustomers).toBe(0);
    expect(result.repeatCustomers).toBe(0);
  });
});
