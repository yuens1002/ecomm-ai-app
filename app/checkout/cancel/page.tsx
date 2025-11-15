"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutCancelPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <XCircle className="w-20 h-20 text-orange-500 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-text-base mb-4">
          Checkout Cancelled
        </h1>
        <p className="text-lg text-text-muted mb-8">
          Your checkout was cancelled. No charges were made. Your cart items are
          still saved.
        </p>

        <div className="bg-accent rounded-lg p-6 mb-8">
          <p className="text-sm text-text-base">
            Don't worry! Your cart items are still there. You can continue
            shopping or try checking out again when you're ready.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/">Continue Shopping</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">View Cart</Link>
          </Button>
        </div>

        <p className="text-sm text-text-muted mt-8">
          Need help?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
