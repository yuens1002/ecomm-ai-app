"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { PageContainer } from "@/components/shared/PageContainer";

function CheckoutResumeContent() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const setCartOpen = useCartStore((state) => state.setCartOpen);

  useEffect(() => {
    // If cart has items, open the cart drawer and redirect to home
    // so user can complete checkout
    if (items.length > 0) {
      setCartOpen(true);
      router.replace("/");
    } else {
      // No items in cart, just go home
      router.replace("/");
    }
  }, [items.length, setCartOpen, router]);

  return (
    <PageContainer className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
      <p className="text-lg text-text-muted">Resuming your checkout...</p>
    </PageContainer>
  );
}

export default function CheckoutResumePage() {
  return (
    <Suspense
      fallback={
        <PageContainer className="py-16 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
          <p className="text-lg text-text-muted">Loading...</p>
        </PageContainer>
      }
    >
      <CheckoutResumeContent />
    </Suspense>
  );
}
