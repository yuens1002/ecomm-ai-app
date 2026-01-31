"use client";

import OrderManagementClient from "./OrderManagementClient";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";

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
