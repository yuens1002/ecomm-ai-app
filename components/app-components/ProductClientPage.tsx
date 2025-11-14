"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FullProductPayload, RelatedProduct, Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label"; // <-- ADDED THIS IMPORT
import ProductCard from "@components/app-components/ProductCard"; // Re-use our card

// Prop interface for this component
interface ProductClientPageProps {
  product: NonNullable<FullProductPayload>;
  relatedProducts: RelatedProduct[];
  category: Pick<Category, "name" | "slug">; // We only need name and slug
}

// Helper to format cents to dollars
function formatPrice(priceInCents: number) {
  return (priceInCents / 100).toFixed(2);
}

export default function ProductClientPage({
  product,
  relatedProducts,
  category,
}: ProductClientPageProps) {
  // --- State Management ---
  // Find the first variant and purchase option to set as default
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [selectedPurchaseOption, setSelectedPurchaseOption] = useState(
    selectedVariant.purchaseOptions[0]
  );
  const [selectedSchedule, setSelectedSchedule] = useState(
    selectedPurchaseOption.deliverySchedule || "EVERY_WEEK"
  );
  const [quantity, setQuantity] = useState(1);

  // --- Derived State ---
  // Calculate the price to display based on state
  const displayImage =
    product.images[0]?.url ||
    "https://placehold.co/600x400/CCCCCC/FFFFFF.png?text=Image+Not+Found";
  const altText =
    product.images[0]?.altText || `A bag of ${product.name} coffee`;

  // --- Event Handlers ---
  const handleVariantChange = (variantId: string) => {
    const newVariant = product.variants.find((v) => v.id === variantId)!;
    setSelectedVariant(newVariant);
    // Default to the first purchase option of the new variant
    setSelectedPurchaseOption(newVariant.purchaseOptions[0]);
  };

  const handlePurchaseTypeChange = (optionId: string) => {
    const newOption = selectedVariant.purchaseOptions.find(
      (p) => p.id === optionId
    )!;
    setSelectedPurchaseOption(newOption);
  };

  const handleAddToCart = () => {
    // In a real app, this would add to a global cart (Zustand/Context)
    console.log({
      productId: product.id,
      variantId: selectedVariant.id,
      purchaseOptionId: selectedPurchaseOption.id,
      quantity: quantity,
      schedule:
        selectedPurchaseOption.type === "SUBSCRIPTION"
          ? selectedSchedule
          : null,
    });
    setQuantity(() => quantity + 1); // Just a mock update for demo purposes
  };

  const handleAddToCartMock = (productId: string) => {
    console.log(`(Related) Add to cart: ${productId}`);
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      {/* 1. Breadcrumb (Home > Category > Product) */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />

          {/* Category link: Uses the category slug and name */}
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/categories/${category.slug}`}>{category.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />

          {/* Current Page: Product Name */}
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 2. Main Product Section (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
        {/* --- LEFT COLUMN: Image --- */}
        <div className="w-full">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg">
            <Image
              src={displayImage}
              alt={altText}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 90vw, 45vw"
              loading="eager"
            />
          </div>
          {/* In a real app, a thumbnail gallery would go here */}
        </div>

        {/* --- RIGHT COLUMN: Product Info & Options --- */}
        <div className="w-full flex flex-col space-y-6">
          <h1 className="text-4xl font-bold text-text-base">{product.name}</h1>

          {/* --- UPDATED: Added Origin and Roast Level --- */}
          <div className="flex flex-col space-y-1">
            <span className="text-lg text-text-base font-semibold">
              {product.origin.join(", ")}
            </span>
            <span className="text-lg text-text-muted italic">
              {product.tastingNotes.join(", ")}
            </span>
          </div>

          <p className="text-text-base leading-relaxed">
            {product.description}
          </p>
          {product.isOrganic && (
            <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Organic
            </span>
          )}

          <Separator />

          {/* Variant Selection (Size) */}
          <div>
            <Label className="text-base font-semibold text-text-base mb-3 block">
              Size
            </Label>
            <RadioGroup
              value={selectedVariant.id}
              onValueChange={handleVariantChange}
              className="flex gap-4"
            >
              {product.variants.map((variant) => (
                <div key={variant.id}>
                  <RadioGroupItem
                    value={variant.id}
                    id={variant.id}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={variant.id}
                    className={`flex items-center justify-center rounded-md border-2 p-3 text-sm font-medium
                      cursor-pointer transition-colors
                      ${
                        selectedVariant.id === variant.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-transparent border-border hover:bg-accent"
                      }`}
                  >
                    {variant.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Purchase Type Selection (One-time vs. Sub) */}
          <div>
            <Label className="text-base font-semibold text-text-base mb-3 block">
              Purchase Option
            </Label>
            <RadioGroup
              value={selectedPurchaseOption.id}
              onValueChange={handlePurchaseTypeChange}
              className="space-y-3"
            >
              {selectedVariant.purchaseOptions.map((option) => (
                <Label
                  key={option.id}
                  htmlFor={option.id}
                  className={`flex items-center rounded-lg border-2 p-4 cursor-pointer transition-colors
                    ${
                      selectedPurchaseOption.id === option.id
                        ? "bg-accent border-primary"
                        : "border-border hover:bg-accent"
                    }`}
                >
                  <RadioGroupItem value={option.id} id={option.id} />
                  <div className="ml-4 flex flex-col">
                    <span className="font-semibold text-text-base">
                      {option.type === "ONE_TIME"
                        ? "One-Time Purchase"
                        : "Subscribe & Save"}
                    </span>
                    <span className="text-sm text-text-muted">
                      {option.discountMessage || ""}
                    </span>
                  </div>
                  <span className="ml-auto font-bold text-text-base text-lg">
                    ${formatPrice(option.priceInCents)}
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Delivery Schedule (Conditional) */}
          {selectedPurchaseOption.type === "SUBSCRIPTION" && (
            <div>
              <Label
                htmlFor="schedule"
                className="text-base font-semibold text-text-base mb-3 block"
              >
                Delivery Schedule
              </Label>
              <Select
                value={selectedSchedule}
                onValueChange={setSelectedSchedule}
              >
                <SelectTrigger id="schedule" className="w-full">
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EVERY_WEEK">Every Week</SelectItem>
                  <SelectItem value="EVERY_2_WEEKS">Every 2 Weeks</SelectItem>
                  <SelectItem value="EVERY_3_WEEKS">Every 3 Weeks</SelectItem>
                  <SelectItem value="EVERY_4_WEEKS">Every 4 Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Add to Cart Button */}
          <Button
            size="lg"
            className="w-full text-lg py-6"
            onClick={handleAddToCart}
            // Simple check for stock
            disabled={selectedVariant.stockQuantity <= 0}
          >
            {selectedVariant.stockQuantity > 0 ? "Add to Cart" : "Out of Stock"}
          </Button>
        </div>
      </div>

      {/* 3. Related Products Section */}
      <div className="my-16">
        <Separator className="my-12" />
        <h2 className="text-3xl font-bold text-center text-text-base mb-12">
          You Might Also Like
        </h2>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {relatedProducts.map((relatedProduct) => (
              <CarouselItem
                key={relatedProduct.id}
                className="md:basis-1/2 lg:basis-1/small"
              >
                <div className="p-1">
                  {/* We re-use our existing ProductCard component! */}
                  <ProductCard
                    product={relatedProduct} // Cast as 'any' to satisfy prop type, since we're passing a partial product
                    onAddToCart={handleAddToCartMock}
                    disableCardEffects={true}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  );
}
