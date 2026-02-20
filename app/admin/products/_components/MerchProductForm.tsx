"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ProductType } from "@prisma/client";
import { useBreadcrumb } from "@/app/admin/_components/dashboard/BreadcrumbContext";
import { useToast } from "@/hooks/use-toast";
import { ProductPageLayout } from "./ProductPageLayout";
import { ProductInfoSection, ProductInfoValues } from "./ProductInfoSection";
import { VariantsSection, VariantData, VariantsSectionRef } from "./VariantsSection";
import { MerchDetailsSection, MerchDetailRow } from "./MerchDetailsSection";
import { CategoriesSection } from "./CategoriesSection";
import { AddOnsSection, AddOnsSectionRef } from "./AddOnsSection";
import { createProduct, updateProduct } from "../actions/products";
import { createVariant, saveVariantImages } from "../actions/variants";
import { createOption } from "../actions/options";
import { useAutoSave } from "../_hooks/useAutoSave";
import { UnsavedChangesGuard } from "./UnsavedChangesGuard";

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
  const addOnsSectionRef = useRef<AddOnsSectionRef>(null);
  const [productId, setProductId] = useState<string | null>(
    initialProductId ?? null
  );
  const [hasDetailError, setHasDetailError] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const isNewProduct = !initialProductId;

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

  // Variants state — new products start with one default variant
  const [variants, setVariants] = useState<VariantData[]>(
    initialData?.variants ?? (isNewProduct ? [{
      id: crypto.randomUUID(),
      name: "Variant 1",
      weight: 0,
      stockQuantity: 0,
      order: 0,
      isDisabled: false,
      images: [],
      purchaseOptions: [],
    }] : [])
  );

  const isValid = productInfo.name.trim().length > 0;

  // Validate merch details — no half-filled rows
  const hasIncompleteDetails = merchDetails.some((d) => {
    const hasLabel = d.label.trim() !== "";
    const hasValue = d.value.trim() !== "";
    return (hasLabel && !hasValue) || (!hasLabel && hasValue);
  });

  // Dirty state for route protection (new product only)
  const isDirty = isNewProduct && (
    productInfo.name.trim() !== "" ||
    productInfo.heading.trim() !== "" ||
    productInfo.description.trim() !== "" ||
    merchDetails.some((d) => d.label.trim() !== "" || d.value.trim() !== "") ||
    variants.some(v => v.name !== "Variant 1" || v.weight !== 0 || v.stockQuantity !== 0 || v.purchaseOptions.length > 0 || v.images.length > 0)
  );

  // --- Edit mode: auto-save ---

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
    deps: isNewProduct ? [] : [productInfo, merchDetails, categoryIds],
    formState,
    historyKey: productId ? `merch-${productId}` : "merch-new",
    onRestore,
  });

  // --- New product mode: batch create ---

  const handleCreate = useCallback(async () => {
    setHasAttemptedSubmit(true);
    const hasInvalidVariants = variants.some(v => !v.name.trim());
    if (!isValid || hasInvalidVariants) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    if (hasIncompleteDetails) {
      setHasDetailError(true);
      toast({ title: "Details need both label and value", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      // Filter out empty detail rows
      const filteredDetails = merchDetails.filter(
        (d) => d.label.trim() !== "" && d.value.trim() !== ""
      );

      // 1. Create product
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

      const productResult = await createProduct(payload);
      if (!productResult.ok) throw new Error(productResult.error);
      const newProductId = (productResult.data as { id: string }).id;

      // 2. Create variants (temp ID → real ID)
      const tempToRealId = new Map<string, string>();
      for (const variant of variants) {
        const variantResult = await createVariant({
          productId: newProductId,
          name: variant.name,
          weight: variant.weight,
          stockQuantity: variant.stockQuantity,
        });
        if (!variantResult.ok) throw new Error(variantResult.error);
        const realVariant = variantResult.data as VariantData;
        tempToRealId.set(variant.id, realVariant.id);
      }

      // 3. Create purchase options
      for (const variant of variants) {
        const realVariantId = tempToRealId.get(variant.id)!;
        for (const option of variant.purchaseOptions) {
          const optionResult = await createOption({
            variantId: realVariantId,
            type: option.type,
            priceInCents: option.priceInCents,
            salePriceInCents: option.salePriceInCents,
            billingInterval: option.billingInterval,
            billingIntervalCount: option.billingIntervalCount,
          });
          if (!optionResult.ok) throw new Error(optionResult.error);
        }
      }

      // 4. Upload pending images
      const pendingFiles = variantsSectionRef.current?.getPendingFiles() ?? new Map();
      for (const variant of variants) {
        const realVariantId = tempToRealId.get(variant.id)!;
        const pending = pendingFiles.get(variant.id);
        if (!pending || pending.size === 0) continue;

        const altText = productInfo.name && variant.name
          ? `${productInfo.name} - ${variant.name}`
          : variant.name;

        const finalImages = await Promise.all(
          variant.images.map(async (img, index) => {
            const pendingFile = pending.get(index);
            if (pendingFile) {
              const formData = new FormData();
              formData.append("file", pendingFile.file);
              const response = await fetch("/api/upload", { method: "POST", body: formData });
              if (!response.ok) throw new Error("Upload failed");
              const data = await response.json();
              URL.revokeObjectURL(pendingFile.previewUrl);
              return { url: data.path, altText };
            }
            return { url: img.url, altText };
          })
        );

        const validImages = finalImages.filter((img) => img.url);
        if (validImages.length > 0) {
          await saveVariantImages({ variantId: realVariantId, images: validImages });
        }
      }

      // 5. Create add-on links
      const addOns = addOnsSectionRef.current?.getAddOns() ?? [];
      for (const addOn of addOns) {
        await fetch(`/api/admin/products/${newProductId}/addons`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addOnProductId: addOn.addOnProduct.id }),
        });

        const hasDiscounts = addOn.selections.some((s) => s.discountType && s.discountValue);
        if (hasDiscounts) {
          await fetch(`/api/admin/products/${newProductId}/addons/sync`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              addOnProductId: addOn.addOnProduct.id,
              selections: addOn.selections.map((s) => ({
                addOnVariantId: s.addOnVariantId,
                discountType: s.discountType,
                discountValue: s.discountValue,
              })),
            }),
          });
        }
      }

      // 6. Redirect to edit page
      router.replace(`/admin/merch/${newProductId}`);
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  }, [isValid, productInfo, merchDetails, categoryIds, variants, hasIncompleteDetails, router, toast]);

  // Keyboard shortcuts: U = undo, Shift+U = redo (edit mode only)
  useEffect(() => {
    if (isNewProduct) return;

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
  }, [undo, redo, isNewProduct]);

  return (
    <>
    <ProductPageLayout
      title={productId ? "Edit Merch Product" : "New Merch Product"}
      description="Manage merchandise details, variants, and pricing"
      {...(isNewProduct
        ? {
            onManualSave: handleCreate,
            isSaving: isCreating,
          }
        : {
            saveStatus: !isValid ? "error" : status,
            saveErrorMessage: !isValid ? "Enter required field(s)" : hasIncompleteDetails ? "Details need both label and value" : undefined,
            canUndo,
            canRedo,
            onUndo: undo,
            onRedo: redo,
          }
      )}
      productInfo={
        <ProductInfoSection
          values={productInfo}
          onChange={setProductInfo}
          showValidation={!isNewProduct || hasAttemptedSubmit}
        />
      }
      variants={
        <VariantsSection
          ref={variantsSectionRef}
          productId={productId}
          productName={productInfo.name}
          variants={variants}
          onVariantsChange={setVariants}
          isNewProduct={isNewProduct}
          showValidation={!isNewProduct || hasAttemptedSubmit}
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
      addOns={
        <AddOnsSection
          ref={addOnsSectionRef}
          productId={productId}
          isNewProduct={isNewProduct}
        />
      }
    />
    {isNewProduct && <UnsavedChangesGuard isDirty={isDirty} />}
    </>
  );
}
