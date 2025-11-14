import { NextResponse } from "next/server";
import { getFeaturedProducts } from "@/lib/data"; // Use '@/' for absolute imports

/**
 * API route to get all featured products.
 */
export async function GET() {
  try {
    const products = await getFeaturedProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error(error);
    // Return a 500 Internal Server Error response
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
