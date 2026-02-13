"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ProductType } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { ProductPageLayout } from "./ProductPageLayout";
import { ProductInfoSection, ProductInfoValues } from "./ProductInfoSection";
import { VariantsSection, VariantData, VariantsSectionRef } from "./VariantsSection";
import { MerchDetailsSection, MerchDetailRow } from "./MerchDetailsSection";
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
  details: MerchDetailRow[] | null;
  categoryIds: string[];
  variants: VariantData[];
}

interface MerchProductFormProps {
  productId?: string;
  initialData?: InitialProductData;
  categories: Category[];
}

export function MerchProductForm({
  productId: initialProductId,
  initialData,
  categories,
}: MerchProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const variantsSectionRef = useRef<VariantsSectionRef>(null);
  const [productId, setProductId] = useState<string | null>(
    initialProductId ?? null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasDetailError, setHasDetailError] = useState(false);

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

  // Merch details state
  const [merchDetails, setMerchDetails] = useState<MerchDetailRow[]>(
    (initialData?.details as MerchDetailRow[] | null) ?? [
      { label: "", value: "" },
    ]
  );

  // Categories state
  const [categoryIds, setCategoryIds] = useState<string[]>(
    initialData?.categoryIds ?? []
  );

  // Variants state
  const [variants, setVariants] = useState<VariantData[]>(
    initialData?.variants ?? []
  );

  const handleSave = async () => {
    // Validate merch details — no half-filled rows
    const hasIncomplete = merchDetails.some((d) => {
      const hasLabel = d.label.trim() !== "";
      const hasValue = d.value.trim() !== "";
      return (hasLabel && !hasValue) || (!hasLabel && hasValue);
    });

    if (hasIncomplete) {
      setHasDetailError(true);
      toast({
        title: "All details must have both a label and description",
        variant: "destructive",
      });
      return;
    }
    setHasDetailError(false);

    setIsSaving(true);
    try {
      await variantsSectionRef.current?.uploadAllVariantImages();

      // Filter out empty rows
      const filteredDetails = merchDetails.filter(
        (d) => d.label.trim() !== "" && d.value.trim() !== ""
      );

      const payload = {
        productType: ProductType.MERCH,
        name: productInfo.name,
        slug: productInfo.slug,
        heading: productInfo.heading || null,
        description: productInfo.description || null,
        isOrganic: productInfo.isOrganic,
        isFeatured: productInfo.isFeatured,
        isDisabled: productInfo.isDisabled,
        details: filteredDetails.length > 0 ? filteredDetails : null,
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
          router.replace(`/admin/merch/${newId}`);
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
      title={productId ? "Edit Merch Product" : "New Merch Product"}
      description="Manage merchandise details, variants, and pricing"
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
        <MerchDetailsSection
          details={merchDetails}
          onChange={setMerchDetails}
          hasError={hasDetailError}
        />
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
