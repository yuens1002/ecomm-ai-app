"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// --- REMOVED: useEffect and Product type ---
import { AiHelperModalProps } from "@/lib/types"; // Import shared types
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react"; // Import icons

// --- AI Helper Modal Component ---
export default function AiHelperModal({ isOpen, onClose }: AiHelperModalProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  
  const [step, setStep] = useState<number>(1);
  const [taste, setTaste] = useState<string>("");
  const [brewMethod, setBrewMethod] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [recommendation, setRecommendation] = useState<string>("");
  const [productSlug, setProductSlug] = useState<string | null>(null);
  const [productData, setProductData] = useState<any>(null);
  const [isPersonalized, setIsPersonalized] = useState<boolean>(false);
  const [userStats, setUserStats] = useState<{
    totalOrders?: number;
    preferredRoastLevel?: string;
  } | null>(null);
  const [error, setError] = useState<string>("");

  // Reset all state when the modal is closed
  const handleClose = () => {
    onClose();
    // Add a small delay for the close animation to finish
    setTimeout(() => {
      setStep(1);
      setTaste("");
      setBrewMethod("");
      setRecommendation("");
      setProductSlug(null);
      setProductData(null);
      setIsLoading(false);
      setIsPersonalized(false);
      setUserStats(null);
      setError("");
    }, 300);
  };

  const handleBuyNow = async () => {
    if (!productData) return;

    try {
      setIsLoading(true);
      setError("");

      // Find the cheapest variant (by one-time purchase price)
      let selectedVariant = productData.variants[0];
      let lowestPrice = Infinity;

      for (const variant of productData.variants) {
        const oneTimeOption = variant.purchaseOptions.find(
          (po: any) => po.type === "ONE_TIME"
        );
        if (oneTimeOption && oneTimeOption.priceInCents < lowestPrice) {
          lowestPrice = oneTimeOption.priceInCents;
          selectedVariant = variant;
        }
      }

      // Get the one-time purchase option (required for Buy Now)
      const purchaseOption = selectedVariant.purchaseOptions.find(
        (po: any) => po.type === "ONE_TIME"
      ) || selectedVariant.purchaseOptions[0];

      // Create cart item for Stripe checkout
      const cartItem = {
        productId: productData.id,
        productName: productData.name,
        productSlug: productData.slug,
        variantId: selectedVariant.id,
        variantName: selectedVariant.name,
        purchaseOptionId: purchaseOption.id,
        purchaseType: purchaseOption.type,
        priceInCents: purchaseOption.priceInCents,
        imageUrl: productData.images[0]?.url,
        quantity: 1,
        billingInterval: purchaseOption.billingInterval || undefined,
        billingIntervalCount: purchaseOption.billingIntervalCount || undefined,
      };

      // Call Stripe checkout API
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [cartItem],
          deliveryMethod: "DELIVERY", // Default to delivery
        }),
      });

      if (!response.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Buy Now error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendation = async () => {
    setIsLoading(true);
    setRecommendation("");
    try {
      // We no longer pass the product list.
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taste,
          brewMethod,
        }),
      });
      if (!response.ok) {
        // Try to parse the error message from the API
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get recommendation.");
      }

      const result = await response.json();

      if (!result.text) {
        throw new Error("No recommendation text received.");
      }

      setRecommendation(result.text);
      setProductSlug(result.productSlug || null);
      setProductData(result.productData || null);
      setIsPersonalized(result.isPersonalized || false);
      setUserStats(result.userContext || null);
      setStep(3); // Move to the result step
    } catch (error) {
      console.error(error);
      // In a real app, show a toast or error message
      alert(
        `Sorry, something went wrong: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // shadcn/ui Dialog handles the open/close state and animations
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-text-base">
            {step === 3 ? "Your Recommendation" : "Find Your Perfect Coffee"}
          </DialogTitle>
          {step !== 3 && (
            <DialogDescription>
              Answer a few quick questions to find the perfect roast for your
              brewing style.
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Step 1: Taste */}
        {step === 1 && (
          <div className="space-y-6 py-4">
            <RadioGroup
              onValueChange={setTaste}
              value={taste}
              className="space-y-3"
            >
              <Label className="text-sm font-medium text-text-base">
                What flavors do you typically enjoy?
              </Label>
              {[
                "Fruity & Bright",
                "Chocolate & Rich",
                "Nutty & Smooth",
                "Floral & Delicate",
              ].map((t) => (
                <div key={t} className="flex items-center space-x-2">
                  <RadioGroupItem value={t} id={t} />
                  <Label htmlFor={t} className="font-normal text-text-base">
                    {t}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <DialogFooter>
              <Button
                onClick={() => setStep(2)}
                disabled={!taste}
                className="w-full"
              >
                Next
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2: Brew Method */}
        {step === 2 && (
          <div className="space-y-6 py-4">
            <RadioGroup
              onValueChange={setBrewMethod}
              value={brewMethod}
              className="space-y-3"
            >
              <Label className="text-sm font-medium text-text-base">
                How do you brew your coffee?
              </Label>
              {["Pour Over", "French Press", "Espresso", "Drip Machine"].map(
                (b) => (
                  <div key={b} className="flex items-center space-x-2">
                    <RadioGroupItem value={b} id={b} />
                    <Label htmlFor={b} className="font-normal text-text-base">
                      {b}
                    </Label>
                  </div>
                )
              )}
            </RadioGroup>
            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Back
              </Button>
              <Button
                onClick={getRecommendation}
                disabled={!brewMethod || isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  // UPDATED: Removed 'mr-2' so the spinner is centered
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Get Recommendation"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Personalization Badge - Only show if user has actual purchase history */}
            {isPersonalized &&
              userStats &&
              userStats.totalOrders &&
              userStats.totalOrders > 0 && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      Personalized based on your history
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {userStats.totalOrders} past{" "}
                      {userStats.totalOrders === 1 ? "order" : "orders"}
                      {userStats.preferredRoastLevel &&
                        ` • Prefers ${userStats.preferredRoastLevel.toLowerCase()} roasts`}
                    </p>
                  </div>
                </div>
              )}
            {/* Product name as button link if available */}
            {productSlug && productData && (
              <div className="mb-4">
                <Button asChild variant="link" className="h-auto p-0 text-lg font-semibold">
                  <Link href={`/products/${productSlug}`}>
                    {productData.name}
                  </Link>
                </Button>
              </div>
            )}
            
            {/* We use whitespace-pre-wrap to respect newlines from the AI */}
            <p className="text-text-base whitespace-pre-wrap">
              {recommendation}
            </p>
            
            {error && (
              <p className="text-red-600 text-sm font-medium mt-2">
                {error}
              </p>
            )}
            
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              {productSlug && productData ? (
                <>
                  <Button 
                    onClick={() => {
                      // Find the cheapest variant (by one-time purchase price)
                      let selectedVariant = productData.variants[0];
                      let lowestPrice = Infinity;

                      for (const variant of productData.variants) {
                        const oneTimeOption = variant.purchaseOptions.find(
                          (po: any) => po.type === "ONE_TIME"
                        );
                        if (oneTimeOption && oneTimeOption.priceInCents < lowestPrice) {
                          lowestPrice = oneTimeOption.priceInCents;
                          selectedVariant = variant;
                        }
                      }

                      // Get the one-time purchase option (required)
                      const purchaseOption = selectedVariant.purchaseOptions.find(
                        (po: any) => po.type === "ONE_TIME"
                      ) || selectedVariant.purchaseOptions[0];

                      addItem({
                        productId: productData.id,
                        productName: productData.name,
                        productSlug: productData.slug,
                        variantId: selectedVariant.id,
                        variantName: selectedVariant.name,
                        purchaseOptionId: purchaseOption.id,
                        purchaseType: purchaseOption.type,
                        priceInCents: purchaseOption.priceInCents,
                        imageUrl: productData.images[0]?.url,
                        quantity: 1,
                        billingInterval: purchaseOption.billingInterval || undefined,
                        billingIntervalCount: purchaseOption.billingIntervalCount || undefined,
                      });
                      
                      handleClose();
                    }}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    Add to Cart
                  </Button>
                  <Button 
                    onClick={handleBuyNow}
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Buy Now"
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    setStep(1);
                    setRecommendation("");
                    setProductSlug(null);
                    setProductData(null);
                  }}
                  className="w-full"
                >
                  Start Over
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
