"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from "react";
import { PurchaseType, BillingInterval } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FieldSet,
  FieldLegend,
  FieldDescription,
  Field,
} from "@/components/ui/field";
import { FlagField } from "@/components/ui/forms/FlagField";
import { FormHeading } from "@/components/ui/forms/FormHeading";
import { MultiImageUpload } from "@/components/ui/forms/MultiImageUpload";
import { OneTimeOptionRow, SubscriptionOptionRow } from "./shared/PurchaseOptionRow";
import { StackedFieldPair } from "./shared/StackedFieldPair";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createVariant,
  updateVariant,
  deleteVariant,
  reorderVariants,
  saveVariantImages,
} from "../actions/variants";
import {
  createOption,
  updateOption,
  deleteOption,
} from "../actions/options";

export interface PurchaseOptionData {
  id: string;
  type: PurchaseType;
  priceInCents: number;
  salePriceInCents: number | null;
  billingInterval: BillingInterval | null;
  billingIntervalCount: number | null;
}

export interface VariantImageData {
  id: string;
  url: string;
  altText: string;
  order: number;
}

export interface VariantData {
  id: string;
  name: string;
  weight: number;
  stockQuantity: number;
  order: number;
  isDisabled: boolean;
  images: VariantImageData[];
  purchaseOptions: PurchaseOptionData[];
}

export interface PendingFile {
  file: File;
  previewUrl: string;
}

interface VariantsSectionProps {
  productId: string | null;
  productName: string;
  variants: VariantData[];
  onVariantsChange: (variants: VariantData[]) => void;
  isNewProduct?: boolean;
  showValidation?: boolean;
}

export interface VariantsSectionRef {
  uploadAllVariantImages: () => Promise<void>;
  getPendingFiles: () => Map<string, Map<number, PendingFile>>;
}

export const VariantsSection = forwardRef<VariantsSectionRef, VariantsSectionProps>(
  function VariantsSection({
    productId,
    productName,
    variants,
    onVariantsChange,
    isNewProduct,
    showValidation = true,
  }, ref) {
    const { toast } = useToast();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const tabsListRef = useRef<HTMLDivElement>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    // Drag-to-scroll state for the tabs list
    const dragState = useRef({ isDragging: false, startX: 0, startScroll: 0, moved: false });

    // Per-variant pending image files: variantId → (imageIndex → PendingFile)
    const [pendingFilesPerVariant, setPendingFilesPerVariant] = useState<
      Map<string, Map<number, PendingFile>>
    >(new Map());

    const selectedVariant = variants[selectedIndex] ?? null;
    const activeVariantCount = variants.filter((v) => !v.isDisabled).length;
    const isLastActiveVariant = selectedVariant !== null && !selectedVariant.isDisabled && activeVariantCount <= 1;
    const pendingDeleteVariant = pendingDeleteId ? variants.find((v) => v.id === pendingDeleteId) : null;

    // Ref for reading fresh variant state inside async handlers
    const variantsRef = useRef(variants);
    useEffect(() => { variantsRef.current = variants; }, [variants]);

  // Auto-scroll active tab into view
  useEffect(() => {
    const list = tabsListRef.current;
    if (!list) return;
    const activeTab = list.querySelector<HTMLElement>("[data-state=active]");
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [selectedIndex]);

  // Drag-to-scroll handlers for the tabs list
  useEffect(() => {
    const el = tabsListRef.current;
    if (!el) return;
    const ds = dragState.current;

    const onMouseDown = (e: MouseEvent) => {
      // Only handle primary button clicks on the list background or tabs
      if (e.button !== 0) return;
      ds.isDragging = true;
      ds.moved = false;
      ds.startX = e.clientX;
      ds.startScroll = el.scrollLeft;
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!ds.isDragging) return;
      const dx = e.clientX - ds.startX;
      if (Math.abs(dx) > 3) ds.moved = true;
      el.scrollLeft = ds.startScroll - dx;
    };

    const onMouseUp = () => {
      if (!ds.isDragging) return;
      ds.isDragging = false;
      el.style.cursor = "";
      el.style.userSelect = "";
    };

    // Suppress click (tab switch) when the user was dragging, not clicking
    const onClick = (e: MouseEvent) => {
      if (ds.moved) {
        e.stopPropagation();
        e.preventDefault();
        ds.moved = false;
      }
    };

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    el.addEventListener("click", onClick, { capture: true });

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("click", onClick, { capture: true });
    };
  }, []);

    // --- Variant image handlers ---

    const getPendingFilesForVariant = useCallback(
      (variantId: string): Map<number, PendingFile> => {
        return pendingFilesPerVariant.get(variantId) ?? new Map();
      },
      [pendingFilesPerVariant]
    );

    const handleVariantImageFileSelect = useCallback(
      async (variantId: string, index: number, file: File, previewUrl: string) => {
        // Show preview immediately
        setPendingFilesPerVariant((prev) => {
          const next = new Map(prev);
          const variantFiles = new Map(next.get(variantId) ?? new Map());
          const old = variantFiles.get(index);
          if (old && old.previewUrl !== previewUrl) {
            URL.revokeObjectURL(old.previewUrl);
          }
          variantFiles.set(index, { file, previewUrl });
          next.set(variantId, variantFiles);
          return next;
        });

        // Upload file
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/upload", { method: "POST", body: formData });
        if (!response.ok) {
          toast({ title: "Image upload failed", variant: "destructive" });
          return;
        }
        const { path } = await response.json();

        // Read fresh state via ref (onAdd may have extended images after this handler started)
        const currentVariants = variantsRef.current;
        const variant = currentVariants.find((v) => v.id === variantId);
        if (!variant) return;

        const altText = productName && variant.name
          ? `${productName} - ${variant.name}`
          : variant.name;

        // Build complete image list with real URL at the target index
        const currentImages = [...variant.images];
        if (index < currentImages.length) {
          currentImages[index] = { ...currentImages[index], url: path, altText };
        } else {
          currentImages.push({ id: "", url: path, altText, order: index });
        }

        // Persist to DB
        await saveVariantImages({
          variantId,
          images: currentImages
            .filter((img) => img.url)
            .map((img) => ({ url: img.url, altText: img.altText })),
        });

        // Update local state with real URL and clear pending
        onVariantsChange(
          currentVariants.map((v) =>
            v.id === variantId
              ? { ...variant, images: currentImages.map((img, i) => ({ ...img, order: i })) }
              : v
          )
        );
        URL.revokeObjectURL(previewUrl);
        setPendingFilesPerVariant((prev) => {
          const next = new Map(prev);
          const variantFiles = new Map(next.get(variantId) ?? new Map());
          variantFiles.delete(index);
          if (variantFiles.size === 0) next.delete(variantId);
          else next.set(variantId, variantFiles);
          return next;
        });
      },
      [productName, onVariantsChange, toast]
    );

    const handleVariantImagePendingRemove = useCallback(
      (variantId: string, index: number) => {
        setPendingFilesPerVariant((prev) => {
          const next = new Map(prev);
          const variantFiles = new Map(next.get(variantId) ?? new Map());
          const old = variantFiles.get(index);
          if (old) URL.revokeObjectURL(old.previewUrl);
          variantFiles.delete(index);
          next.set(variantId, variantFiles);
          return next;
        });
      },
      []
    );

    const handleVariantImagesChange = useCallback(
      (variantId: string, newImages: Array<{ url: string; alt: string }>) => {
        const updated = variants.map((v) =>
          v.id === variantId
            ? {
                ...v,
                images: newImages.map((img, i) => ({
                  id: v.images[i]?.id ?? "",
                  url: img.url,
                  altText: img.alt,
                  order: i,
                })),
              }
            : v
        );
        onVariantsChange(updated);
      },
      [variants, onVariantsChange]
    );

    // Reorder images — optimistic local update, persist to DB only if images are saved
    const handleImageReorder = useCallback(
      async (variantId: string, fromIndex: number, toIndex: number) => {
        const variant = variants.find((v) => v.id === variantId);
        if (!variant) return;

        const reordered = [...variant.images];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);

        // Reorder pending files map to match new image order
        setPendingFilesPerVariant((prev) => {
          const oldMap = prev.get(variantId);
          if (!oldMap || oldMap.size === 0) return prev;

          const newMap = new Map<number, PendingFile>();
          // Build index mapping: old position → new position
          const oldIndices = Array.from({ length: variant.images.length }, (_, i) => i);
          const reorderedIndices = [...oldIndices];
          const [movedIdx] = reorderedIndices.splice(fromIndex, 1);
          reorderedIndices.splice(toIndex, 0, movedIdx);

          reorderedIndices.forEach((oldIdx, newIdx) => {
            const pending = oldMap.get(oldIdx);
            if (pending) newMap.set(newIdx, pending);
          });

          const next = new Map(prev);
          next.set(variantId, newMap);
          return next;
        });

        // Optimistic update
        const updated = variants.map((v) =>
          v.id === variantId
            ? { ...v, images: reordered.map((img, i) => ({ ...img, order: i })) }
            : v
        );
        onVariantsChange(updated);

        if (isNewProduct) return;

        // Only persist if all images have real URLs (not pending uploads)
        const allSaved = reordered.every((img) => img.url && !img.url.startsWith("blob:"));
        if (allSaved && reordered.length > 0) {
          await saveVariantImages({
            variantId,
            images: reordered.map((img) => ({ url: img.url, altText: img.altText })),
          });
        }
      },
      [variants, onVariantsChange, isNewProduct]
    );

    // Upload all pending variant images and save to DB
    const uploadAllVariantImages = useCallback(async () => {
      const updatedVariants = [...variants];

      for (let vi = 0; vi < updatedVariants.length; vi++) {
        const variant = updatedVariants[vi];
        const pending = pendingFilesPerVariant.get(variant.id);
        const hasPending = pending && pending.size > 0;

        if (!hasPending && variant.images.length === 0) continue;

        // Auto-generate alt text from product + variant name
        const altText = productName && variant.name
          ? `${productName} - ${variant.name}`
          : variant.name;

        // Build final images: upload pending files, keep existing URLs
        const finalImages = await Promise.all(
          variant.images.map(async (img, index) => {
            const pendingFile = pending?.get(index);
            if (pendingFile) {
              const formData = new FormData();
              formData.append("file", pendingFile.file);
              const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
              });
              if (!response.ok) throw new Error("Upload failed");
              const data = await response.json();
              URL.revokeObjectURL(pendingFile.previewUrl);
              return { url: data.path, altText };
            }
            return { url: img.url, altText };
          })
        );

        // Filter out empty URLs (unfilled image slots)
        const validImages = finalImages.filter((img) => img.url);

        await saveVariantImages({
          variantId: variant.id,
          images: validImages,
        });

        // Update local state with real URLs so images stay visible
        updatedVariants[vi] = {
          ...variant,
          images: validImages.map((img, i) => ({
            id: variant.images[i]?.id ?? "",
            url: img.url,
            altText: img.altText,
            order: i,
          })),
        };
      }

      // Update variants with real URLs, then clear pending files
      onVariantsChange(updatedVariants);
      setPendingFilesPerVariant(new Map());
    }, [variants, pendingFilesPerVariant, productName, onVariantsChange]);

    useImperativeHandle(ref, () => ({
      uploadAllVariantImages,
      getPendingFiles: () => pendingFilesPerVariant,
    }), [uploadAllVariantImages, pendingFilesPerVariant]);

    const handleAddVariant = async () => {
    if (isNewProduct) {
      const newVariant: VariantData = {
        id: crypto.randomUUID(),
        name: `Variant ${variants.length + 1}`,
        weight: 0,
        stockQuantity: 0,
        order: variants.length,
        isDisabled: false,
        images: [],
        purchaseOptions: [],
      };
      const newVariants = [...variants, newVariant];
      onVariantsChange(newVariants);
      setSelectedIndex(newVariants.length - 1);
      return;
    }
    if (!productId) {
      toast({ title: "Save the product first", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const result = await createVariant({
      productId,
      name: `Variant ${variants.length + 1}`,
      weight: 0,
      stockQuantity: 0,
    });
    setIsSaving(false);
    if (result.ok) {
      const newVariants = [...variants, result.data as VariantData];
      onVariantsChange(newVariants);
      setSelectedIndex(newVariants.length - 1);
    } else {
      toast({ title: result.error, variant: "destructive" });
    }
  };

  const handleUpdateVariant = async (
    variantId: string,
    field: string,
    value: string | number | boolean
  ) => {
    const idx = variants.findIndex((v) => v.id === variantId);
    if (idx === -1) return;

    // Optimistic update
    const updated = [...variants];
    updated[idx] = { ...updated[idx], [field]: value };
    onVariantsChange(updated);

    // Debounced save handled by blur
  };

  const handleSaveVariant = async (variant: VariantData) => {
    if (isNewProduct) return;
    setIsSaving(true);
    const result = await updateVariant(variant.id, {
      name: variant.name,
      weight: variant.weight,
      stockQuantity: variant.stockQuantity,
      isDisabled: variant.isDisabled,
    });
    setIsSaving(false);
    if (!result.ok) {
      toast({ title: result.error, variant: "destructive" });
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (isNewProduct) {
      const newVariants = variants.filter((v) => v.id !== variantId);
      onVariantsChange(newVariants);
      setSelectedIndex(Math.max(0, selectedIndex - 1));
      return;
    }
    setIsSaving(true);
    const result = await deleteVariant(variantId);
    setIsSaving(false);
    if (result.ok) {
      const newVariants = variants.filter((v) => v.id !== variantId);
      onVariantsChange(newVariants);
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    } else {
      toast({ title: result.error, variant: "destructive" });
    }
  };

  const handleReorder = async (direction: "up" | "down") => {
    if (!productId && !isNewProduct) return;
    const newIndex =
      direction === "up" ? selectedIndex - 1 : selectedIndex + 1;
    if (newIndex < 0 || newIndex >= variants.length) return;

    const reordered = [...variants];
    [reordered[selectedIndex], reordered[newIndex]] = [
      reordered[newIndex],
      reordered[selectedIndex],
    ];
    onVariantsChange(reordered);
    setSelectedIndex(newIndex);

    if (isNewProduct || !productId) return;
    await reorderVariants({
      productId,
      variantIds: reordered.map((v) => v.id),
    });
  };

  // Purchase option handlers
  const handleAddOption = async (variantId: string, type: PurchaseType) => {
    let billingInterval: BillingInterval | null = null;
    let billingIntervalCount: number | null = null;

    if (type === PurchaseType.SUBSCRIPTION) {
      const variant = variants.find((v) => v.id === variantId);
      const existingSubs = variant?.purchaseOptions.filter(
        (o) => o.type === PurchaseType.SUBSCRIPTION
      ) ?? [];
      const usedIntervals = new Set(existingSubs.map((o) => o.billingInterval));
      const preferred = [BillingInterval.MONTH, BillingInterval.WEEK, BillingInterval.DAY];
      billingInterval = preferred.find((i) => !usedIntervals.has(i)) ?? null;
      if (!billingInterval) {
        toast({ title: "All billing intervals are already in use", variant: "destructive" });
        return;
      }
      billingIntervalCount = 1;
    }

    if (isNewProduct) {
      const newOption: PurchaseOptionData = {
        id: crypto.randomUUID(),
        type,
        priceInCents: 0,
        salePriceInCents: null,
        billingInterval,
        billingIntervalCount,
      };
      const updated = variants.map((v) =>
        v.id === variantId
          ? { ...v, purchaseOptions: [...v.purchaseOptions, newOption] }
          : v
      );
      onVariantsChange(updated);
      return;
    }

    setIsSaving(true);
    const result = await createOption({
      variantId,
      type,
      priceInCents: 0,
      salePriceInCents: null,
      billingInterval,
      billingIntervalCount,
    });
    setIsSaving(false);
    if (result.ok) {
      const opt = result.data as PurchaseOptionData;
      const updated = variants.map((v) =>
        v.id === variantId
          ? { ...v, purchaseOptions: [...v.purchaseOptions, opt] }
          : v
      );
      onVariantsChange(updated);
    } else {
      toast({ title: result.error, variant: "destructive" });
    }
  };

  const handleUpdateOption = async (
    optionId: string,
    variantId: string,
    data: Partial<PurchaseOptionData>
  ) => {
    if (isNewProduct) {
      const updated = variants.map((v) =>
        v.id === variantId
          ? {
              ...v,
              purchaseOptions: v.purchaseOptions.map((o) =>
                o.id === optionId ? { ...o, ...data } : o
              ),
            }
          : v
      );
      onVariantsChange(updated);
      return;
    }
    setIsSaving(true);
    const result = await updateOption(optionId, data);
    setIsSaving(false);
    if (result.ok) {
      const opt = result.data as PurchaseOptionData;
      const updated = variants.map((v) =>
        v.id === variantId
          ? {
              ...v,
              purchaseOptions: v.purchaseOptions.map((o) =>
                o.id === optionId ? opt : o
              ),
            }
          : v
      );
      onVariantsChange(updated);
    } else {
      toast({ title: result.error, variant: "destructive" });
    }
  };

  const handleDeleteOption = async (optionId: string, variantId: string) => {
    if (isNewProduct) {
      const updated = variants.map((v) =>
        v.id === variantId
          ? {
              ...v,
              purchaseOptions: v.purchaseOptions.filter(
                (o) => o.id !== optionId
              ),
            }
          : v
      );
      onVariantsChange(updated);
      return;
    }
    setIsSaving(true);
    const result = await deleteOption(optionId);
    setIsSaving(false);
    if (result.ok) {
      const updated = variants.map((v) =>
        v.id === variantId
          ? {
              ...v,
              purchaseOptions: v.purchaseOptions.filter(
                (o) => o.id !== optionId
              ),
            }
          : v
      );
      onVariantsChange(updated);
    } else {
      toast({ title: result.error, variant: "destructive" });
    }
  };


  return (
    <FieldSet className="min-w-0">
      <div>
        <FieldLegend>Variants &amp; Pricing</FieldLegend>
        <FieldDescription>
          Manage product variants with pricing and stock
        </FieldDescription>
      </div>

      {!productId && !isNewProduct ? (
        <div className="text-center py-8 border border-dashed rounded-lg text-sm text-muted-foreground">
          Save the product first to add variants.
        </div>
      ) : variants.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg text-sm text-muted-foreground space-y-3">
          <p>No variants yet. Add a variant to set up pricing.</p>
          <Button type="button" variant="outline" size="sm" onClick={handleAddVariant} disabled={isSaving}>
            <Plus className="h-4 w-4 mr-1" /> Add Variant
          </Button>
        </div>
      ) : (
        <Tabs
          value={String(selectedIndex)}
          onValueChange={(val) => setSelectedIndex(Number(val))}
        >
          <div className="flex items-center gap-1">
            <TabsList
              ref={tabsListRef}
              className="flex flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab"
            >
              {variants.map((v, i) => (
                <TabsTrigger key={v.id} value={String(i)} className={`shrink-0 ${variants.length > 1 ? "gap-1.5 pr-1.5" : ""}`}>
                  {v.name}
                  {variants.length > 1 && (
                    <span
                      role="button"
                      tabIndex={0}
                      className={`rounded-sm p-0.5 hover:bg-foreground/10 ${i === 0 ? "opacity-30 pointer-events-none" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (i > 0) setPendingDeleteId(v.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && i > 0) {
                          e.stopPropagation();
                          setPendingDeleteId(v.id);
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleAddVariant}
              disabled={(!productId && !isNewProduct) || isSaving}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Selected variant detail fields */}
          {selectedVariant && (
            <TabsContent value={String(selectedIndex)} className="space-y-6 border rounded-lg p-4">
              {/* Actions row */}
              <div className="flex items-center justify-end gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 aria-disabled:opacity-50 aria-disabled:pointer-events-none"
                  aria-disabled={variants.length <= 1 || selectedIndex === 0}
                  onClick={() => {
                    if (variants.length <= 1 || selectedIndex === 0) return;
                    handleReorder("up");
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {selectedIndex + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 aria-disabled:opacity-50 aria-disabled:pointer-events-none"
                  aria-disabled={variants.length <= 1 || selectedIndex === variants.length - 1}
                  onClick={() => {
                    if (variants.length <= 1 || selectedIndex === variants.length - 1) return;
                    handleReorder("down");
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">in</span>
                <span className="text-sm text-muted-foreground tabular-nums">{variants.length}</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-6 lg:gap-x-12">
                {/* Left: Name, Weight/Stock, Purchase Options */}
                <div className="space-y-6">
                  <Field>
                    <FormHeading htmlFor={`variant-name-${selectedVariant.id}`} label="Variant Name" required validationType={showValidation && !selectedVariant.name.trim() ? "required" : undefined} />
                    <Input
                      id={`variant-name-${selectedVariant.id}`}
                      value={selectedVariant.name}
                      onChange={(e) =>
                        handleUpdateVariant(selectedVariant.id, "name", e.target.value)
                      }
                      onBlur={() => handleSaveVariant(selectedVariant)}
                    />
                  </Field>

                  <FlagField
                    id={`variant-disabled-${selectedVariant.id}`}
                    label="Disabled"
                    description={isLastActiveVariant
                      ? "At least one variant must remain active"
                      : "Hide variant from storefront"}
                    checked={selectedVariant.isDisabled}
                    disabled={isLastActiveVariant}
                    onCheckedChange={(checked) => {
                      handleUpdateVariant(selectedVariant.id, "isDisabled", checked);
                      handleSaveVariant({ ...selectedVariant, isDisabled: checked });
                    }}
                  />

                  <StackedFieldPair>
                    <Field className="flex-1">
                      <FormHeading htmlFor={`variant-weight-${selectedVariant.id}`} label="Weight" />
                      <Input
                        id={`variant-weight-${selectedVariant.id}`}
                        type="number"
                        min={0}
                        value={selectedVariant.weight}
                        onChange={(e) =>
                          handleUpdateVariant(
                            selectedVariant.id,
                            "weight",
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        onBlur={() => handleSaveVariant(selectedVariant)}
                      />
                    </Field>
                    <Field className="flex-1">
                      <FormHeading htmlFor={`variant-stock-${selectedVariant.id}`} label="Stock Quantity" required />
                      <Input
                        id={`variant-stock-${selectedVariant.id}`}
                        type="number"
                        min={0}
                        value={selectedVariant.stockQuantity}
                        onChange={(e) =>
                          handleUpdateVariant(
                            selectedVariant.id,
                            "stockQuantity",
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        onBlur={() => handleSaveVariant(selectedVariant)}
                      />
                    </Field>
                  </StackedFieldPair>

                  {/* Purchase Options */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormHeading label="Purchase Options" />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddOption(selectedVariant.id, PurchaseType.ONE_TIME)}
                          disabled={isSaving || selectedVariant.purchaseOptions.some(o => o.type === PurchaseType.ONE_TIME)}
                        >
                          + One-time
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddOption(selectedVariant.id, PurchaseType.SUBSCRIPTION)}
                          disabled={isSaving}
                        >
                          + Subscription
                        </Button>
                      </div>
                    </div>

                    {selectedVariant.purchaseOptions.length === 0 ? (
                      <div className="text-center py-4 border border-dashed rounded text-sm text-muted-foreground">
                        No purchase options. Add a one-time or subscription option.
                      </div>
                    ) : (
                      <div className="divide-y">
                        {selectedVariant.purchaseOptions.map((opt) => (
                          <PurchaseOptionRow
                            key={opt.id}
                            option={opt}
                            variantId={selectedVariant.id}
                            onUpdate={handleUpdateOption}
                            onDelete={handleDeleteOption}
                            isSaving={isSaving}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Images (full 50%) */}
                <div className="space-y-4">
                  <FormHeading label="Product Images" />
                  <MultiImageUpload
                    images={selectedVariant.images.map((img, i) => {
                      const pending = getPendingFilesForVariant(selectedVariant.id).get(i);
                      const alt = productName && selectedVariant.name
                        ? `${productName} - ${selectedVariant.name}`
                        : img.altText;
                      return {
                        url: img.url,
                        alt,
                        previewUrl: pending?.previewUrl,
                        pendingFile: pending?.file,
                      };
                    })}
                    onImageSelect={(index, file) => {
                      const previewUrl = URL.createObjectURL(file);
                      handleVariantImageFileSelect(selectedVariant.id, index, file, previewUrl);
                    }}
                    onRemove={async (index) => {
                      handleVariantImagePendingRemove(selectedVariant.id, index);
                      const remaining = selectedVariant.images.filter((_, i) => i !== index);
                      const newImages = remaining.map((img) => ({ url: img.url, alt: img.altText }));
                      handleVariantImagesChange(selectedVariant.id, newImages);

                      if (isNewProduct) return;

                      // Persist deletion to DB if images are saved
                      const savedImages = remaining.filter((img) => img.url && !img.url.startsWith("blob:"));
                      if (savedImages.length > 0 || remaining.length === 0) {
                        await saveVariantImages({
                          variantId: selectedVariant.id,
                          images: savedImages.map((img) => ({ url: img.url, altText: img.altText })),
                        });
                      }
                    }}
                    onAdd={() => {
                      const newImages = [
                        ...selectedVariant.images.map((img) => ({ url: img.url, alt: img.altText })),
                        { url: "", alt: "" },
                      ];
                      handleVariantImagesChange(selectedVariant.id, newImages);
                    }}
                    onReorder={(fromIndex, toIndex) => {
                      handleImageReorder(selectedVariant.id, fromIndex, toIndex);
                    }}
                    maxImages={6}
                    columns={3}
                  />
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      )}
      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete variant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{pendingDeleteVariant?.name}&quot; and all its purchase options.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDeleteId) handleDeleteVariant(pendingDeleteId);
                setPendingDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FieldSet>
  );
  }
);

function PurchaseOptionRow({
  option,
  variantId,
  onUpdate,
  onDelete,
  isSaving,
}: {
  option: PurchaseOptionData;
  variantId: string;
  onUpdate: (optionId: string, variantId: string, data: Partial<PurchaseOptionData>) => void;
  onDelete: (optionId: string, variantId: string) => void;
  isSaving: boolean;
}) {
  const priceInputProps = {
    defaultValue: (option.priceInCents / 100).toFixed(2),
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      const cents = Math.round(parseFloat(e.target.value) * 100);
      if (cents >= 0) onUpdate(option.id, variantId, { priceInCents: cents });
    },
  };

  const salePriceInputProps = {
    defaultValue: option.salePriceInCents
      ? (option.salePriceInCents / 100).toFixed(2)
      : "",
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const cents = val ? Math.round(parseFloat(val) * 100) : null;
      onUpdate(option.id, variantId, { salePriceInCents: cents });
    },
  };

  const handleDelete = () => onDelete(option.id, variantId);

  if (option.type === PurchaseType.SUBSCRIPTION) {
    return (
      <SubscriptionOptionRow
        priceInputProps={priceInputProps}
        salePriceInputProps={salePriceInputProps}
        cadenceCountInputProps={{
          defaultValue: option.billingIntervalCount ?? 1,
          onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
            const count = parseInt(e.target.value) || 1;
            onUpdate(option.id, variantId, { billingIntervalCount: count });
          },
        }}
        cadenceIntervalDefaultValue={option.billingInterval ?? BillingInterval.MONTH}
        onCadenceIntervalChange={(val) =>
          onUpdate(option.id, variantId, {
            billingInterval: val as BillingInterval,
          })
        }
        onDelete={handleDelete}
        deleteDisabled={isSaving}
      />
    );
  }

  return (
    <OneTimeOptionRow
      priceInputProps={priceInputProps}
      salePriceInputProps={salePriceInputProps}
      onDelete={handleDelete}
      deleteDisabled={isSaving}
    />
  );
}
