import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { listMenuData } from "@/app/admin/product-menu/actions/menu";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const res = await listMenuData();
  if (!res.ok) {
    return NextResponse.json(
      { error: res.error || "Failed to load product menu" },
      { status: 500 }
    );
  }

  return NextResponse.json(res.data);
}
