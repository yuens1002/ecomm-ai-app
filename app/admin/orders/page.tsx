"use client";

import OrderManagementClient from "./OrderManagementClient";

export default function AdminOrdersPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage and fulfill customer orders
        </p>
      </div>
      <OrderManagementClient />
    </>
  );
}
