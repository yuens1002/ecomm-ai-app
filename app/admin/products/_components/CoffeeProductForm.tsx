"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ProductType, RoastLevel } from "@prisma/client";
import { useBreadcrumb } from "@/app/admin/_components/dashboard/BreadcrumbContext";
import { ProductPageLayout } from "./ProductPageLayout";
import { ProductInfoSection, ProductInfoValues } from "./ProductInfoSection";
import { VariantsSection, VariantData, VariantsSectionRef } from "./VariantsSection";
import { CoffeeSpecsSection, CoffeeSpecsValues } from "./CoffeeSpecsSection";
import { CategoriesSection } from "./CategoriesSection";
import { AddOnsSection } from "./AddOnsSection";
import { createProduct, updateProduct } from "../actions/products";
import { useAutoSave } from "../_hooks/useAutoSave";

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
  const variantsSectionRef = useRef<VariantsSectionRef>(null);
  const [productId, setProductId] = useState<string | null>(
    initialProductId ?? null
  );

  // Dynamic breadcrumb: Home > Products > Coffees > [product name]
  const breadcrumbs = useMemo(
    () => (initialData?.name ? [{ label: initialData.name }] : []),
    [initialData]
  );
  useBreadcrumb(breadcrumbs);

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

  const isValid = productInfo.name.trim().length > 0;

  const saveFn = useCallback(async () => {
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
      if (!productId && result.data) {
        const newId = (result.data as { id: string }).id;
        setProductId(newId);
        router.replace(`/admin/products/${newId}`);
      }
    } else {
      throw new Error(result.error);
    }
  }, [productInfo, coffeeSpecs, categoryIds, productId, router]);

  const formState = { productInfo, coffeeSpecs, categoryIds };

  const onRestore = useCallback(
    (state: typeof formState) => {
      setProductInfo(state.productInfo);
      setCoffeeSpecs(state.coffeeSpecs);
      setCategoryIds(state.categoryIds);
    },
    []
  );

  const { status, undo, redo, canUndo, canRedo } = useAutoSave({
    saveFn,
    isValid,
    debounceMs: 800,
    deps: [productInfo, coffeeSpecs, categoryIds],
    formState,
    historyKey: productId ? `coffee-${productId}` : "coffee-new",
    onRestore,
  });

  // Keyboard shortcuts: U = undo, Shift+U = redo (capture phase to beat Radix typeahead)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.key || e.key.toLowerCase() !== "u" || e.ctrlKey || e.metaKey || e.altKey) return;

      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (document.querySelector('[data-state="open"][role="dialog"]')) return;

      e.preventDefault();
      e.stopPropagation();

      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => document.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [undo, redo]);

  return (
    <ProductPageLayout
      title={productId ? "Edit Coffee Product" : "New Coffee Product"}
      description="Manage product details, variants, and pricing"
      saveStatus={isValid ? status : "error"}
      saveErrorMessage={!isValid ? "Enter required field(s)" : undefined}
      canUndo={canUndo}
      canRedo={canRedo}
      onUndo={undo}
      onRedo={redo}
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
          productName={productInfo.name}
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
