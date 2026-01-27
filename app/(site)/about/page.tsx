import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingCart,
  CreditCard,
  Lock,
  Package,
  RefreshCw,
  Search,
  MessageSquare,
  Mic,
  Sparkles,
  BarChart3,
  Activity,
  Github,
  Mail,
  LayoutDashboard,
  Settings,
  Boxes,
  Truck,
  SquareMenu,
  FileText,
} from "lucide-react";
import { getSiteMetadata } from "@/lib/site-metadata";

export default async function AboutPage() {
  const { storeName } = await getSiteMetadata();
  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-5xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          About {storeName}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A modern, full-stack e-commerce experience built for specialty coffee
          retail, demonstrating mastery of modern web development and AI
          integration.
        </p>
      </div>

      <div className="grid gap-12">
        {/* Core Features Section */}
        <section>
          <h2 className="text-3xl text-center font-bold mb-8 pb-2">
            Core Features
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  E-Commerce Essentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <ShoppingCart className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Shopping Cart</h3>
                    <p className="text-sm text-muted-foreground">
                      Zustand-powered cart with persistence, supporting one-time
                      purchases and subscriptions.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CreditCard className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Stripe Checkout</h3>
                    <p className="text-sm text-muted-foreground">
                      Full payment integration with webhook processing for order
                      fulfillment.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Lock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Auth.js with OAuth (GitHub/Google) and database sessions.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Package className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Order Tracking</h3>
                    <p className="text-sm text-muted-foreground">
                      Complete order history with status tracking and customer
                      details.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <RefreshCw className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Subscription Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Recurring orders with Stripe Billing Portal integration.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Search className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Product Search</h3>
                    <p className="text-sm text-muted-foreground">
                      Full-text search with activity tracking across name,
                      description, origin, and tasting notes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI-Powered Personalization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <MessageSquare className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Chat AI Assistant <span className="text-xs text-muted-foreground font-normal">(In Progress)</span></h3>
                    <p className="text-sm text-muted-foreground">
                      Text-based conversational interface with full order
                      history context and brewing expertise.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Mic className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Voice AI Barista <span className="text-xs text-muted-foreground font-normal">(In Progress)</span></h3>
                    <p className="text-sm text-muted-foreground">
                      Multilingual voice assistant for hands-free coffee
                      recommendations and ordering.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Sparkles className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Smart Recommendations</h3>
                    <p className="text-sm text-muted-foreground">
                      Behavioral product recommendations based on user activity,
                      powered by Gemini with a smart scoring algorithm.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-primary" />
                  Admin Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="flex gap-3">
                  <BarChart3 className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Analytics & Insights</h3>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive analytics with trending products, top
                      searches, and conversion metrics.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Activity className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Behavioral Tracking</h3>
                    <p className="text-sm text-muted-foreground">
                      Tracking of page views, product views, searches, and cart
                      actions for both anonymous and authenticated users.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Settings className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Site Customization</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage site settings, content, and configurations directly
                      from the admin panel.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Boxes className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Inventory Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Track stock levels, manage product variants, and update
                      availability in real-time.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Truck className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">
                      Order Tracking & Fulfillment
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Process orders, update shipping status, and manage
                      customer fulfillment workflows.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <SquareMenu className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Menu Builder</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage product hierarchy with drag-and-drop, multi-select,
                      bulk operations, and keyboard shortcuts.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Pages CMS</h3>
                    <p className="text-sm text-muted-foreground">
                      AI-powered content management with a 10-question wizard
                      that generates pages in your brand&apos;s voice.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Project Info Section */}
        <section className="bg-muted/50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-6">Project Information</h2>
          <div className="flex flex-col md:flex-row justify-center gap-6">
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link
                href="https://github.com/yuens1002/ecomm-ai-app"
                target="_blank"
              >
                <Github className="w-5 h-5" />
                View on GitHub
              </Link>
            </Button>
            <Button asChild size="lg" className="gap-2">
              <Link href="/contact">
                <Mail className="w-5 h-5" />
                Contact for Demo
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-muted-foreground text-sm">
            Want to see the AI recommendations in action? Contact me for demo
            account credentials to experience personalized product
            recommendations, behavioral analytics, and the full feature set.
          </p>
        </section>
      </div>
    </div>
  );
}
