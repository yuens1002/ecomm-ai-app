"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart-store";
import { PageContainer } from "@/components/app-components/PageContainer";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [verifying, setVerifying] = useState(true);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    // Clear the cart after successful checkout
    if (sessionId) {
      clearCart();
      // Simulate verification delay
      const timer = setTimeout(() => setVerifying(false), 1500);
      return () => clearTimeout(timer);
    }
    // Only set verifying to false in timeout to avoid sync setState
    const timer = setTimeout(() => setVerifying(false), 0);
    return () => clearTimeout(timer);
  }, [sessionId, clearCart]);

  if (verifying) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
        <p className="text-lg text-text-muted">Verifying your order...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-16">
      <div className="max-w-2xl mx-auto text-center">
        <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-text-base mb-4">
          Order Successful!
        </h1>
        <p className="text-lg text-text-muted mb-8">
          Thank you for your purchase. Your order has been confirmed and you
          will receive a confirmation email shortly.
        </p>

        {sessionId && (
          <div className="bg-accent rounded-lg p-6 mb-8">
            <p className="text-sm text-text-muted mb-2">Order ID</p>
            <p className="font-mono text-sm text-text-base break-all">
              {sessionId}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/">Continue Shopping</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/orders">View Orders</Link>
          </Button>
        </div>

        <p className="text-sm text-text-muted mt-8">
          Need help?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </PageContainer>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <PageContainer className="py-16 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
          <p className="text-lg text-text-muted">Loading...</p>
        </PageContainer>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
