import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import SubscriptionManagementClient from "./SubscriptionManagementClient";
import { getSubscriptions } from "./actions";

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
