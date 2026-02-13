/** @jest-environment node */

import { PATCH } from "../route";
import { NextRequest } from "next/server";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/orders/address-utils", () => ({
  saveUserAddress: jest.fn(),
}));

jest.mock("@/lib/payments/stripe/adapter", () => ({
  updateStripeSubscriptionShipping: jest.fn(),
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveUserAddress } from "@/lib/orders/address-utils";
import { updateStripeSubscriptionShipping } from "@/lib/payments/stripe/adapter";

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockFindUnique = prisma.subscription.findUnique as jest.Mock;
const mockUpdate = prisma.subscription.update as jest.Mock;
const mockSaveAddress = saveUserAddress as jest.Mock;
const mockStripeUpdate =
  updateStripeSubscriptionShipping as jest.Mock;

const validAddress = {
  recipientName: "Jane Doe",
  street: "456 Oak Ave",
  city: "Portland",
  state: "OR",
  postalCode: "97201",
  country: "US",
};

const makeRequest = (id: string, body: unknown) =>
  new NextRequest(
    `http://localhost:3000/api/user/subscriptions/${id}/address`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    }
  );

const makeParams = (id: string) => Promise.resolve({ id });

describe("PATCH /api/user/subscriptions/[id]/address", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null as never);

    const res = await PATCH(makeRequest("sub-1", validAddress), {
      params: makeParams("sub-1"),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 404 when subscription not found", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-1" },
    } as never);
    mockFindUnique.mockResolvedValueOnce(null);

    const res = await PATCH(makeRequest("sub-missing", validAddress), {
      params: makeParams("sub-missing"),
    });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Subscription not found");
  });

  it("returns 403 when user does not own subscription", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-1" },
    } as never);
    mockFindUnique.mockResolvedValueOnce({
      id: "sub-1",
      userId: "other-user",
      status: "ACTIVE",
      stripeSubscriptionId: "stripe_sub_1",
    });

    const res = await PATCH(makeRequest("sub-1", validAddress), {
      params: makeParams("sub-1"),
    });

    expect(res.status).toBe(403);
  });

  it("returns 400 when subscription status is CANCELED", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-1" },
    } as never);
    mockFindUnique.mockResolvedValueOnce({
      id: "sub-1",
      userId: "user-1",
      status: "CANCELED",
      stripeSubscriptionId: "stripe_sub_1",
    });

    const res = await PATCH(makeRequest("sub-1", validAddress), {
      params: makeParams("sub-1"),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/active or paused/i);
  });

  it("returns 400 for invalid address data (missing fields)", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-1" },
    } as never);
    mockFindUnique.mockResolvedValueOnce({
      id: "sub-1",
      userId: "user-1",
      status: "ACTIVE",
      stripeSubscriptionId: "stripe_sub_1",
    });

    const res = await PATCH(
      makeRequest("sub-1", { recipientName: "Jane" }),
      { params: makeParams("sub-1") }
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid address data");
  });

  it("returns 400 for empty string fields", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-1" },
    } as never);
    mockFindUnique.mockResolvedValueOnce({
      id: "sub-1",
      userId: "user-1",
      status: "ACTIVE",
      stripeSubscriptionId: "stripe_sub_1",
    });

    const res = await PATCH(
      makeRequest("sub-1", { ...validAddress, street: "" }),
      { params: makeParams("sub-1") }
    );

    expect(res.status).toBe(400);
  });

  it("updates subscription, Stripe, and address book on success (ACTIVE)", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-1" },
    } as never);
    mockFindUnique.mockResolvedValueOnce({
      id: "sub-1",
      userId: "user-1",
      status: "ACTIVE",
      stripeSubscriptionId: "stripe_sub_1",
    });
    mockUpdate.mockResolvedValueOnce({});
    mockStripeUpdate.mockResolvedValueOnce(undefined);
    mockSaveAddress.mockResolvedValueOnce(undefined);

    const res = await PATCH(makeRequest("sub-1", validAddress), {
      params: makeParams("sub-1"),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "sub-1" },
      data: {
        recipientName: "Jane Doe",
        shippingStreet: "456 Oak Ave",
        shippingCity: "Portland",
        shippingState: "OR",
        shippingPostalCode: "97201",
        shippingCountry: "US",
      },
    });

    expect(mockStripeUpdate).toHaveBeenCalledWith("stripe_sub_1", {
      name: "Jane Doe",
      line1: "456 Oak Ave",
      city: "Portland",
      state: "OR",
      postalCode: "97201",
      country: "US",
    });

    expect(mockSaveAddress).toHaveBeenCalledWith("user-1", {
      name: "Jane Doe",
      line1: "456 Oak Ave",
      city: "Portland",
      state: "OR",
      postalCode: "97201",
      country: "US",
    });
  });

  it("allows PAUSED subscriptions", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-1" },
    } as never);
    mockFindUnique.mockResolvedValueOnce({
      id: "sub-2",
      userId: "user-1",
      status: "PAUSED",
      stripeSubscriptionId: "stripe_sub_2",
    });
    mockUpdate.mockResolvedValueOnce({});
    mockStripeUpdate.mockResolvedValueOnce(undefined);
    mockSaveAddress.mockResolvedValueOnce(undefined);

    const res = await PATCH(makeRequest("sub-2", validAddress), {
      params: makeParams("sub-2"),
    });

    expect(res.status).toBe(200);
  });
});
