"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ProductType, RoastLevel } from "@prisma/client";
import { useBreadcrumb } from "@/app/admin/_components/dashboard/BreadcrumbContext";
import { useToast } from "@/hooks/use-toast";
import { ProductPageLayout } from "./ProductPageLayout";
import { ProductInfoSection, ProductInfoValues } from "./ProductInfoSection";
import { VariantsSection, VariantData, VariantsSectionRef } from "./VariantsSection";
import { CoffeeSpecsSection, CoffeeSpecsValues } from "./CoffeeSpecsSection";
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
  const addOnsSectionRef = useRef<AddOnsSectionRef>(null);
  const [productId, setProductId] = useState<string | null>(
    initialProductId ?? null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const isNewProduct = !initialProductId;

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

  // Dirty state for route protection (new product only)
  const isDirty = isNewProduct && (
    productInfo.name.trim() !== "" ||
    productInfo.heading.trim() !== "" ||
    productInfo.description.trim() !== "" ||
    coffeeSpecs.origin.trim() !== "" ||
    variants.some(v => v.name !== "Variant 1" || v.weight !== 0 || v.stockQuantity !== 0 || v.purchaseOptions.length > 0 || v.images.length > 0)
  );

  // --- Edit mode: auto-save ---

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
    deps: isNewProduct ? [] : [productInfo, coffeeSpecs, categoryIds],
    formState,
    historyKey: productId ? `coffee-${productId}` : "coffee-new",
    onRestore,
  });

  // --- New product mode: batch create ---

  const handleCreate = useCallback(async () => {
    setHasAttemptedSubmit(true);
    const hasInvalidVariants = variants.some(v => !v.name.trim());
    if (!isValid || !coffeeSpecs.origin.trim() || hasInvalidVariants) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      // 1. Create product
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
        origin: coffeeSpecs.origin.split(",").map((s) => s.trim()).filter(Boolean),
        variety: coffeeSpecs.variety || null,
        altitude: coffeeSpecs.altitude || null,
        tastingNotes: coffeeSpecs.tastingNotes.split(",").map((s) => s.trim()).filter(Boolean),
        processing: coffeeSpecs.processing || null,
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
      router.replace(`/admin/products/${newProductId}`);
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  }, [isValid, productInfo, coffeeSpecs, categoryIds, variants, router, toast]);

  // Keyboard shortcuts: U = undo, Shift+U = redo (edit mode only)
  useEffect(() => {
    if (isNewProduct) return;

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
  }, [undo, redo, isNewProduct]);

  return (
    <>
    <ProductPageLayout
      title={productId ? "Edit Coffee Product" : "New Coffee Product"}
      description="Manage product details, variants, and pricing"
      {...(isNewProduct
        ? {
            onManualSave: handleCreate,
            isSaving: isCreating,
          }
        : {
            saveStatus: isValid ? status : "error",
            saveErrorMessage: !isValid ? "Enter required field(s)" : undefined,
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
        <CoffeeSpecsSection values={coffeeSpecs} onChange={setCoffeeSpecs} showValidation={!isNewProduct || hasAttemptedSubmit} />
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
