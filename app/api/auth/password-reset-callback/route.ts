import { NextRequest, NextResponse } from "next/server";

/**
 * This endpoint handles the password reset flow by:
 * 1. Receiving the token from the email link
 * 2. Redirecting to /auth/reset-password with the token as a URL search param
 * The reset-password page reads the token directly from the URL — no sessionStorage.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/auth/forgot-password", request.url));
  }

  // Redirect to the reset-password page with the token as a search param.
  // The reset-password page reads the token directly from useSearchParams().
  // This avoids interpolating the token into an inline script (reflected XSS).
  const destination = new URL("/auth/reset-password", request.url);
  destination.searchParams.set("token", token);
  return NextResponse.redirect(destination);
}
