import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// Verify VAPI secret
const verifySecret = (req: NextRequest) => {
  const secret = req.headers.get("x-vapi-secret");
  return secret === process.env.VAPI_WEBHOOK_SECRET;
};

export async function POST(req: NextRequest) {
  console.log("VAPI Webhook: Received request");
  console.log(
    "VAPI Webhook: Headers:",
    Object.fromEntries(req.headers.entries())
  );

  if (!verifySecret(req)) {
    console.error("VAPI Webhook: Unauthorized - Invalid Secret");
    console.error("Expected:", process.env.VAPI_WEBHOOK_SECRET);
    console.error("Received:", req.headers.get("x-vapi-secret"));
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { message } = body;

    // Log summary instead of full body to reduce noise
    console.log("VAPI Webhook: Message Type:", message.type);
    if (message.type === "tool-calls") {
      console.log(
        "VAPI Webhook: Tool Calls:",
        message.toolCalls.map((tc: any) => tc.function.name).join(", ")
      );
    } else if (message.type === "transcript") {
      console.log("VAPI Webhook: Transcript:", message.transcript);
    }

    // Extract userEmail from the query parameters
    const userEmail = req.nextUrl.searchParams.get("userEmail");

    if (message.type === "tool-calls") {
      const { toolCalls } = message;
      const results = [];

      for (const toolCall of toolCalls) {
        const { id, function: func } = toolCall;
        const { name, arguments: args } = func;

        // Parse arguments if they are a string
        const parsedArgs = typeof args === "string" ? JSON.parse(args) : args;

        let result;

        switch (name) {
          case "getUserContext":
            result = await handleGetUserContext(userEmail);
            break;
          case "getOrderHistory":
            result = await handleGetOrderHistory(parsedArgs, userEmail);
            break;
          case "searchProducts":
            result = await handleSearchProducts(parsedArgs);
            break;
          case "addToCart":
            // For now, we just validate the product exists and return success
            // The client will need to handle the actual cart update or we need a server-side cart
            result = await handleAddToCart(parsedArgs);
            break;
          default:
            result = { error: `Function ${name} not found` };
        }

        results.push({
          toolCallId: id,
          result: JSON.stringify(result),
        });
      }

      return NextResponse.json({
        results,
      });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("VAPI Webhook Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// --- Handlers ---

async function handleGetUserContext(userEmail: string | null) {
  if (!userEmail) {
    return {
      isAuthenticated: false,
      message:
        "User is not logged in. Please ask them to log in for personalized assistance.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      addresses: {
        where: { isDefault: true },
        take: 1,
      },
      _count: {
        select: { orders: true },
      },
    },
  });

  if (!user) {
    return { isAuthenticated: false };
  }

  return {
    isAuthenticated: true,
    userId: user.id,
    name: user.name,
    email: user.email,
    orderCount: user._count.orders,
    defaultAddress: user.addresses[0] || null,
  };
}

async function handleGetOrderHistory(
  args: { limit?: number },
  userEmail: string | null
) {
  if (!userEmail) {
    return { error: "User not authenticated" };
  }

  const limit = args.limit || 5;

  const orders = await prisma.order.findMany({
    where: { user: { email: userEmail } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      items: {
        include: {
          purchaseOption: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Summarize for the AI
  const summary = orders.map((order) => ({
    id: order.id,
    date: order.createdAt.toISOString().split("T")[0],
    total: (order.totalInCents / 100).toFixed(2),
    status: order.status,
    items: order.items.map((item) => ({
      productName: item.purchaseOption.variant.product.name,
      variant: item.purchaseOption.variant.name,
      quantity: item.quantity,
    })),
  }));

  // Extract preferences
  // Simple logic: most frequent roast level or origin
  // For now, just return the raw order history
  return { orders: summary };
}

async function handleSearchProducts(args: { query: string; filters?: any }) {
  const { query, filters } = args;

  const whereClause: any = {
    AND: [],
  };

  // Text search
  if (query) {
    whereClause.AND.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { tastingNotes: { hasSome: [query] } },
        // Also search in categories names
        {
          categories: {
            some: {
              category: { name: { contains: query, mode: "insensitive" } },
            },
          },
        },
      ],
    });
  }

  // Roast Level Filter
  if (filters?.roastLevel) {
    whereClause.AND.push({
      roastLevel: {
        equals: filters.roastLevel,
        mode: "insensitive",
      },
    });
  }

  // Origin Filter
  if (filters?.origin) {
    whereClause.AND.push({
      origin: {
        hasSome: [filters.origin], // This requires exact match on one of the origins
      },
    });
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    take: 5,
    include: {
      variants: {
        include: {
          purchaseOptions: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      origin: p.origin,
      tastingNotes: p.tastingNotes,
      roastLevel: p.roastLevel || "Unknown",
      variants: p.variants.map((v) => ({
        id: v.id,
        name: v.name,
        price: (v.purchaseOptions[0]?.priceInCents || 0) / 100,
      })),
    })),
  };
}

async function handleAddToCart(args: {
  productId: string;
  variantId: string;
  quantity: number;
}) {
  // Validate product exists
  const variant = await prisma.productVariant.findUnique({
    where: { id: args.variantId },
    include: { product: true },
  });

  if (!variant) {
    return { error: "Product variant not found" };
  }

  // Return success message for AI to speak
  // The client needs to listen for this event to update the UI
  return {
    success: true,
    message: `Added ${variant.product.name} (${variant.name}) to cart`,
    productName: variant.product.name,
    variantName: variant.name,
    quantity: args.quantity || 1,
  };
}
