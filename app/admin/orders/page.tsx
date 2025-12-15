"use client";

import OrderManagementClient from "./OrderManagementClient";
import { PageTitle } from "@/components/admin/PageTitle";

export default function AdminOrdersPage() {
  return (
    <>
      <PageTitle
        title="Order Management"
        subtitle="Manage and fulfill customer orders"
      />
      <OrderManagementClient />
    </>
  );
}
