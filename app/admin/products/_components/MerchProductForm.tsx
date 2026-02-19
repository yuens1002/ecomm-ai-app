"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ProductType } from "@prisma/client";
import { useBreadcrumb } from "@/app/admin/_components/dashboard/BreadcrumbContext";
import { ProductPageLayout } from "./ProductPageLayout";
import { ProductInfoSection, ProductInfoValues } from "./ProductInfoSection";
import { VariantsSection, VariantData, VariantsSectionRef } from "./VariantsSection";
import { MerchDetailsSection, MerchDetailRow } from "./MerchDetailsSection";
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
  const variantsSectionRef = useRef<VariantsSectionRef>(null);
  const [productId, setProductId] = useState<string | null>(
    initialProductId ?? null
  );
  const [hasDetailError, setHasDetailError] = useState(false);

  // Dynamic breadcrumb: Home > Products > Merch > [product name]
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

  const isValid = productInfo.name.trim().length > 0;

  // Validate merch details — no half-filled rows
  const hasIncompleteDetails = merchDetails.some((d) => {
    const hasLabel = d.label.trim() !== "";
    const hasValue = d.value.trim() !== "";
    return (hasLabel && !hasValue) || (!hasLabel && hasValue);
  });

  const saveFn = useCallback(async () => {
    if (hasIncompleteDetails) {
      setHasDetailError(true);
      throw new Error("All details must have both a label and description");
    }
    setHasDetailError(false);

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
      if (!productId && result.data) {
        const newId = (result.data as { id: string }).id;
        setProductId(newId);
        router.replace(`/admin/merch/${newId}`);
      }
    } else {
      throw new Error(result.error);
    }
  }, [productInfo, merchDetails, categoryIds, productId, hasIncompleteDetails, router]);

  const formState = { productInfo, merchDetails, categoryIds };

  const onRestore = useCallback(
    (state: typeof formState) => {
      setProductInfo(state.productInfo);
      setMerchDetails(state.merchDetails);
      setCategoryIds(state.categoryIds);
    },
    []
  );

  const { status, undo, redo, canUndo, canRedo } = useAutoSave({
    saveFn,
    isValid: isValid && !hasIncompleteDetails,
    debounceMs: 800,
    deps: [productInfo, merchDetails, categoryIds],
    formState,
    historyKey: productId ? `merch-${productId}` : "merch-new",
    onRestore,
  });

  // Keyboard shortcuts: U = undo, Shift+U = redo (capture phase to beat Radix typeahead)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "u" || e.ctrlKey || e.metaKey || e.altKey) return;

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
      title={productId ? "Edit Merch Product" : "New Merch Product"}
      description="Manage merchandise details, variants, and pricing"
      saveStatus={!isValid ? "error" : status}
      saveErrorMessage={!isValid ? "Enter required field(s)" : hasIncompleteDetails ? "Details need both label and value" : undefined}
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
