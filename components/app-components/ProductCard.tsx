import Image from "next/image";
import { ProductCardProps } from "@/lib/types"; // lib path stays the same

// Import shadcn/ui components
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card"; // shadcn/ui path remains the same
import { Button } from "@/components/ui/button"; // shadcn/ui path remains the same

// --- Product Card Component ---
export default function ProductCard({
  product,
  onAddToCart,
  showPurchaseOptions = true,
}: ProductCardProps) {
  // --- Find price and image ---
  const displayVariant = product.variants[0];
  const oneTimePrice = displayVariant?.purchaseOptions.find(
    (p) => p.type === "ONE_TIME"
  );
  const displayPrice = oneTimePrice
    ? (oneTimePrice.priceInCents / 100).toFixed(2)
    : "N/A";

  const displayImage =
    product.images[0]?.url ||
    "https://placehold.co/600x400/CCCCCC/FFFFFF.png?text=Image+Not+Found";
  const altText =
    product.images[0]?.altText || `A bag of ${product.name} coffee`;

  return (
    // UPDATED: Added 'p-0' to the <Card> component.
    // This overrides the 'py-6' and 'gap-6' from your shadcn/ui
    // card.tsx file, making the image flush with the top.
    <Card className="w-full overflow-hidden rounded-lg transition-transform duration-300 hover:scale-105 bg-card-bg shadow-lg flex flex-col justify-between p-0">
      {/* 1. Image container. The parent <Card> clips its top corners. */}
      <CardHeader className="relative w-full aspect-16/10">
        <Image
          src={displayImage}
          alt={altText}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={product.isFeatured}
        />
      </CardHeader>

      {/* 2. CardContent holds all text content. */}
      {/* Added the 'grow' class to push the footer down. */}
      <CardContent className="pb-3 grow">
        <CardTitle className="text-xl font-semibold text-text-base mb-1">
          {product.name}
        </CardTitle>
        <CardDescription className="text-sm text-text-muted italic mb-4">
          {product.tastingNotes.join(", ")}
        </CardDescription>

        {showPurchaseOptions && (
          <p className="text-lg font-bold text-primary">${displayPrice}</p>
        )}
      </CardContent>

      {/* 3. CardFooter (only shows if purchase options are enabled) */}
      {showPurchaseOptions && (
        <CardFooter className="p-6 pt-0">
          <Button onClick={() => onAddToCart(product.id)} className="w-full">
            Add to Cart
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
