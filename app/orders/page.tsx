import { auth } from "@/auth";
import { redirect } from "next/navigation";
import OrdersPageClient from "./OrdersPageClient";

/**
 * Orders Page (Server Component)
 *
 * Protected route - requires authentication
 * Lists all orders for logged-in user with filtering
 */
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/orders");
  }

  const { status } = await searchParams;

  return <OrdersPageClient userId={session.user.id} statusFilter={status} />;
}
