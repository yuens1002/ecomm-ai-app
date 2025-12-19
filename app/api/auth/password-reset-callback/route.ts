import { NextRequest, NextResponse } from "next/server";

/**
 * This endpoint handles the password reset flow by:
 * 1. Receiving the token from the email link
 * 2. Redirecting to /auth/reset-password
 * The token is passed via URL query parameter and will be stored in sessionStorage
 * by the reset-password page
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/auth/forgot-password", request.url));
  }

  // Create HTML that stores token in sessionStorage and redirects
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Processing Password Reset...</title>
        <script>
          // Store token in sessionStorage and redirect
          sessionStorage.setItem('passwordResetToken', '${token}');
          window.location.href = '/auth/reset-password';
        </script>
      </head>
      <body>
        <p>Processing your password reset request...</p>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}
