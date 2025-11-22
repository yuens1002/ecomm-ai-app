"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Package,
  ShoppingCart,
  Shield,
  User,
  Settings,
  Tags,
} from "lucide-react";
import ProductManagementClient from "./products/ProductManagementClient";
import CategoryManagementClient from "./categories/CategoryManagementClient";
import UserManagementClient from "./users/UserManagementClient";
import OrderManagementClient from "./orders/OrderManagementClient";
import AnalyticsView from "./analytics/AnalyticsView";

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isAdmin: boolean;
}

interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  adminCount: number;
}

interface AdminDashboardClientProps {
  user: UserData;
  stats: DashboardStats;
}

export default function AdminDashboardClient({
  user,
  stats,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user.name || user.email}
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Orders</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Products</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            <span className="hidden sm:inline">Categories</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.adminCount} admin{stats.adminCount !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Orders
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">In catalog</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Role</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Admin</div>
                <p className="text-xs text-muted-foreground">Full access</p>
              </CardContent>
            </Card>
          </div>

          <AnalyticsView embedded={true} />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <UserManagementClient currentUserId={user.id} />
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>View and manage customer orders</CardDescription>
            </CardHeader>
            <CardContent>
              <OrderManagementClient />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <ProductManagementClient />
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Category Management</CardTitle>
              <CardDescription>
                Manage product categories, origins, and collections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryManagementClient />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Admin Profile</CardTitle>
              <CardDescription>Your admin account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <p className="text-muted-foreground">
                  {user.name || "Not set"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Administrator</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
