"use client";

import { useRef, useCallback } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { PageContainer } from "@/components/shared/PageContainer";

interface CheckoutResumeClientProps {
  userId: string;
}

export function CheckoutResumeClient({ userId }: CheckoutResumeClientProps) {
  const items = useCartStore((state) => state.items);
  const hasSubmitted = useRef(false);

  // Auto-submit the form when it mounts
  const formRefCallback = useCallback(
    (node: HTMLFormElement | null) => {
      if (node && !hasSubmitted.current && items.length > 0) {
        hasSubmitted.current = true;
        node.requestSubmit();
      }
    },
    [items.length]
  );

  // No items in cart
  if (items.length === 0) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-lg text-text-muted mb-4">Your cart is empty.</p>
        <Link href="/" className="text-primary hover:underline">
          Continue shopping
        </Link>
      </PageContainer>
    );
  }

  // Ready to checkout - render form that auto-submits
  return (
    <PageContainer className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
      <p className="text-lg text-text-muted">Taking you to checkout...</p>

      <form
        ref={formRefCallback}
        action="/api/checkout/redirect"
        method="POST"
      >
        <input type="hidden" name="items" value={JSON.stringify(items)} />
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="deliveryMethod" value="DELIVERY" />
      </form>
    </PageContainer>
  );
}
