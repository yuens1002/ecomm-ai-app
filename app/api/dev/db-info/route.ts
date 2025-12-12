import { NextResponse } from "next/server";

/**
 * GET /api/dev/db-info
 * Returns database connection info (development only)
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  try {
    const databaseUrl = process.env.DATABASE_URL || "";
    const adapter = process.env.DATABASE_ADAPTER;

    let dbType = "unknown";

    // Detect database type from URL or adapter
    if (adapter) {
      dbType = adapter; // postgres, neon, standard
    } else if (databaseUrl.includes("neon.tech")) {
      dbType = "neon";
    } else if (
      databaseUrl.includes("localhost") ||
      databaseUrl.includes("127.0.0.1")
    ) {
      dbType = "local";
    } else {
      dbType = "postgres";
    }

    return NextResponse.json({ dbType });
  } catch (error) {
    console.error("Error getting DB info:", error);
    return NextResponse.json({ dbType: "error" });
  }
}
