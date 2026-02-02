import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import SubscriptionManagementClient from "./SubscriptionManagementClient";

async function getSubscriptions() {
  await requireAdmin();

  const subscriptions = await prisma.subscription.findMany({
    select: {
      id: true,
      stripeSubscriptionId: true,
      status: true,
      priceInCents: true,
      deliverySchedule: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      pausedUntil: true,
      productNames: true,
      recipientName: true,
      shippingStreet: true,
      shippingCity: true,
      shippingState: true,
      shippingPostalCode: true,
      shippingCountry: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return subscriptions;
}

export default async function AdminSubscriptionsPage() {
  const subscriptions = await getSubscriptions();

  return (
    <>
      <PageTitle
        title="Subscriptions"
        subtitle="Manage customer subscription orders"
      />
      <SubscriptionManagementClient initialSubscriptions={subscriptions} />
    </>
  );
}
