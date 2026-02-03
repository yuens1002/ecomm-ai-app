"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Package,
  ShoppingCart,
  Shield,
  User,
  Settings,
  Mail,
} from "lucide-react";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
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
  newsletterTotal: number;
  newsletterActive: number;
  newsletterInactive: number;
}

interface AdminDashboardClientProps {
  user: UserData;
  stats: DashboardStats;
}

const navLinkStyles =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-muted hover:text-foreground";

const activeLinkStyles =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium bg-background text-foreground shadow";

export default function AdminDashboardClient({
  user,
  stats,
}: AdminDashboardClientProps) {
  return (
    <>
      <PageTitle
        title="Admin Dashboard"
        subtitle={`Welcome back, ${user.name || user.email}`}
      />

      {/* Navigation links to other admin pages */}
      <nav className="inline-flex h-auto w-full items-center justify-start gap-1 rounded-lg bg-muted p-1 text-muted-foreground overflow-x-auto scrollbar-hide lg:w-auto mb-6">
        <span className={activeLinkStyles}>
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Overview</span>
        </span>
        <Link href="/admin/users" className={navLinkStyles}>
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Users</span>
        </Link>
        <Link href="/admin/orders" className={navLinkStyles}>
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden sm:inline">Orders</span>
        </Link>
        <Link href="/admin/products" className={navLinkStyles}>
          <Package className="h-4 w-4" />
          <span className="hidden sm:inline">Products</span>
        </Link>
        <Link href="/admin/newsletter" className={navLinkStyles}>
          <Mail className="h-4 w-4" />
          <span className="hidden sm:inline">Newsletter</span>
        </Link>
        <Link href="/admin/profile" className={navLinkStyles}>
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Profile</span>
        </Link>
      </nav>

      {/* Dashboard Overview Content */}
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
              <CardTitle className="text-sm font-medium">
                Newsletter Subscribers
              </CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.newsletterTotal}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.newsletterActive} active • {stats.newsletterInactive}{" "}
                churned
              </p>
            </CardContent>
          </Card>
        </div>

        <AnalyticsView embedded={true} />
      </div>
    </>
  );
}
