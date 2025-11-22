"use client";

import OrderManagementClient from "./OrderManagementClient";

export default function AdminOrdersPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Order Management</h1>
        <p className="text-muted-foreground">
          Manage and fulfill customer orders
        </p>
      </div>
      <OrderManagementClient />
    </div>
  );
}
