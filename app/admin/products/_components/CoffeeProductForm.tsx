"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ProductType, RoastLevel } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { ProductPageLayout } from "./ProductPageLayout";
import { ProductInfoSection, ProductInfoValues } from "./ProductInfoSection";
import { VariantsSection, VariantData, VariantsSectionRef } from "./VariantsSection";
import { CoffeeSpecsSection, CoffeeSpecsValues } from "./CoffeeSpecsSection";
import { CategoriesSection } from "./CategoriesSection";
import { AddOnsSection } from "./AddOnsSection";
import { createProduct, updateProduct } from "../actions/products";

interface CategoryLabel {
  id: string;
  name: string;
  icon: string | null;
  order: number;
}

interface Category {
  id: string;
  name: string;
  labels: CategoryLabel[];
}

interface InitialProductData {
  id: string;
  name: string;
  slug: string;
  heading: string | null;
  description: string | null;
  isOrganic: boolean;
  isFeatured: boolean;
  isDisabled: boolean;
  roastLevel: RoastLevel | null;
  origin: string[];
  variety: string | null;
  altitude: string | null;
  tastingNotes: string[];
  processing: string | null;
  categoryIds: string[];
  variants: VariantData[];
}

interface CoffeeProductFormProps {
  productId?: string;
  initialData?: InitialProductData;
  categories: Category[];
}

export function CoffeeProductForm({
  productId: initialProductId,
  initialData,
  categories,
}: CoffeeProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const variantsSectionRef = useRef<VariantsSectionRef>(null);
  const [productId, setProductId] = useState<string | null>(
    initialProductId ?? null
  );
  const [isSaving, setIsSaving] = useState(false);

  // Product info state
  const [productInfo, setProductInfo] = useState<ProductInfoValues>({
    name: initialData?.name ?? "",
    slug: initialData?.slug ?? "",
    heading: initialData?.heading ?? "",
    description: initialData?.description ?? "",
    isOrganic: initialData?.isOrganic ?? false,
    isFeatured: initialData?.isFeatured ?? false,
    isDisabled: initialData?.isDisabled ?? false,
  });

  // Coffee specs state
  const [coffeeSpecs, setCoffeeSpecs] = useState<CoffeeSpecsValues>({
    roastLevel: initialData?.roastLevel ?? RoastLevel.MEDIUM,
    origin: initialData?.origin.join(", ") ?? "",
    variety: initialData?.variety ?? "",
    altitude: initialData?.altitude ?? "",
    tastingNotes: initialData?.tastingNotes.join(", ") ?? "",
    processing: initialData?.processing ?? "",
  });

  // Categories state
  const [categoryIds, setCategoryIds] = useState<string[]>(
    initialData?.categoryIds ?? []
  );

  // Variants state
  const [variants, setVariants] = useState<VariantData[]>(
    initialData?.variants ?? []
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await variantsSectionRef.current?.uploadAllVariantImages();

      const payload = {
        productType: ProductType.COFFEE,
        name: productInfo.name,
        slug: productInfo.slug,
        heading: productInfo.heading || null,
        description: productInfo.description || null,
        isOrganic: productInfo.isOrganic,
        isFeatured: productInfo.isFeatured,
        isDisabled: productInfo.isDisabled,
        roastLevel: coffeeSpecs.roastLevel,
        origin: coffeeSpecs.origin
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        variety: coffeeSpecs.variety || null,
        altitude: coffeeSpecs.altitude || null,
        tastingNotes: coffeeSpecs.tastingNotes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        processing: coffeeSpecs.processing || null,
        categoryIds,
      };

      const result = productId
        ? await updateProduct(productId, payload)
        : await createProduct(payload);

      if (result.ok) {
        toast({ title: productId ? "Product updated" : "Product created" });
        if (!productId && result.data) {
          const newId = (result.data as { id: string }).id;
          setProductId(newId);
          router.replace(`/admin/products/${newId}`);
        }
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProductPageLayout
      title={productId ? "Edit Coffee Product" : "New Coffee Product"}
      description="Manage product details, variants, and pricing"
      isSaving={isSaving}
      onSave={handleSave}
      productInfo={
        <ProductInfoSection
          values={productInfo}
          onChange={setProductInfo}
        />
      }
      variants={
        <VariantsSection
          ref={variantsSectionRef}
          productId={productId}
          variants={variants}
          onVariantsChange={setVariants}
        />
      }
      specs={
        <CoffeeSpecsSection values={coffeeSpecs} onChange={setCoffeeSpecs} />
      }
      categories={
        <CategoriesSection
          categories={categories}
          selectedIds={categoryIds}
          onChange={setCategoryIds}
        />
      }
      addOns={<AddOnsSection productId={productId} />}
    />
  );
}
