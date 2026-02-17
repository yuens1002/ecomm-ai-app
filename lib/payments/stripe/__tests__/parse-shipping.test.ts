/** @jest-environment node */

import { z } from "zod";
import type Stripe from "stripe";
import { parseShippingFromSession } from "../parse";

jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// ---------- Zod fixtures ----------

/** Matches ShippingAddressData from ../types */
const ShippingAddressSchema = z.object({
  name: z.string().nullable(),
  line1: z.string().nullable(),
  line2: z.string().nullable().optional(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  postal_code: z.string().nullable(),
  country: z.string().nullable(),
});

const ParseShippingResultSchema = z.object({
  address: ShippingAddressSchema.nullable(),
  name: z.string().nullable(),
});

/** Builds a minimal Stripe session with collected_information */
function buildSession(
  overrides: {
    collected_information?: Pick<
      NonNullable<Stripe.Checkout.Session["collected_information"]>,
      "shipping_details"
    > | null;
    customer_details?: Partial<Stripe.Checkout.Session.CustomerDetails>;
  } = {}
): Stripe.Checkout.Session {
  return {
    id: "cs_test_123",
    object: "checkout.session",
    collected_information: overrides.collected_information ?? null,
    customer_details: {
      email: "test@example.com",
      phone: null,
      name: overrides.customer_details?.name ?? "Billing Name",
      address: overrides.customer_details?.address ?? null,
      tax_exempt: "none",
      tax_ids: [],
      ...overrides.customer_details,
    },
    metadata: {},
  } as unknown as Stripe.Checkout.Session;
}

// ---------- Tests ----------

describe("parseShippingFromSession", () => {
  it("extracts shipping from collected_information.shipping_details", () => {
    const session = buildSession({
      collected_information: {
        shipping_details: {
          name: "John Dough",
          address: {
            line1: "Market Street",
            line2: null,
            city: "Brookeville",
            state: "MD",
            postal_code: "20833",
            country: "US",
          },
        },
      },
    });

    const result = parseShippingFromSession(session);

    // Validate return shape with Zod
    const parsed = ParseShippingResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);

    expect(result.address).toEqual({
      name: "John Dough",
      line1: "Market Street",
      line2: null,
      city: "Brookeville",
      state: "MD",
      postal_code: "20833",
      country: "US",
    });
    expect(result.name).toBe("John Dough");
  });

  it("does NOT fall back to customer_details.address (billing/Link address)", () => {
    const session = buildSession({
      collected_information: null,
      customer_details: {
        name: "Link User",
        address: {
          line1: "303 2nd Street",
          line2: "South Tower",
          city: "San Francisco",
          state: "CA",
          postal_code: "94107",
          country: "US",
        },
      },
    });

    const result = parseShippingFromSession(session);

    // Should NOT use customer_details.address — that's the billing address
    expect(result.address).toBeNull();
    expect(result.name).toBe("Link User");
  });

  it("returns null address for pickup orders (no shipping collected)", () => {
    const session = buildSession({
      collected_information: null,
      customer_details: { name: "Pickup Customer" },
    });

    const result = parseShippingFromSession(session);

    const parsed = ParseShippingResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);

    expect(result.address).toBeNull();
    expect(result.name).toBe("Pickup Customer");
  });

  it("handles missing customer_details.name gracefully", () => {
    const session = buildSession({
      collected_information: null,
      customer_details: { name: null } as Partial<Stripe.Checkout.Session.CustomerDetails>,
    });

    const result = parseShippingFromSession(session);

    expect(result.address).toBeNull();
    expect(result.name).toBeNull();
  });

  it("handles partial address fields (empty strings become null)", () => {
    const session = buildSession({
      collected_information: {
        shipping_details: {
          name: "Partial Address",
          address: {
            line1: "123 Main St",
            line2: "",
            city: "Portland",
            state: "",
            postal_code: "97201",
            country: "US",
          },
        },
      },
    });

    const result = parseShippingFromSession(session);

    expect(result.address).toEqual({
      name: "Partial Address",
      line1: "123 Main St",
      line2: null, // empty string → null
      city: "Portland",
      state: null, // empty string → null
      postal_code: "97201",
      country: "US",
    });
  });
});
