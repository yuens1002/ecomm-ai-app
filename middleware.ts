import { NextRequest, NextResponse } from "next/server";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function middleware(request: NextRequest) {
  if (
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" &&
    MUTATING.has(request.method)
  ) {
    return NextResponse.json(
      { error: "Changes are disabled in demo mode" },
      { status: 403 }
    );
  }
}

export const config = {
  matcher: ["/api/admin/:path*"],
};
