"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from "react";
import { PurchaseType, BillingInterval } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { FormHeading } from "@/components/ui/forms/FormHeading";
import { ImageListField } from "@/app/admin/_components/cms/fields/ImageListField";
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
  images: VariantImageData[];
  purchaseOptions: PurchaseOptionData[];
}

interface PendingFile {
  file: File;
  previewUrl: string;
}

interface VariantsSectionProps {
  productId: string | null;
  variants: VariantData[];
  onVariantsChange: (variants: VariantData[]) => void;
}

export interface VariantsSectionRef {
  uploadAllVariantImages: () => Promise<void>;
}

export const VariantsSection = forwardRef<VariantsSectionRef, VariantsSectionProps>(
  function VariantsSection({
    productId,
    variants,
    onVariantsChange,
  }, ref) {
    const { toast } = useToast();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const tabsListRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    // Per-variant pending image files: variantId → (imageIndex → PendingFile)
    const [pendingFilesPerVariant, setPendingFilesPerVariant] = useState<
      Map<string, Map<number, PendingFile>>
    >(new Map());

    const selectedVariant = variants[selectedIndex] ?? null;
    const pendingDeleteVariant = pendingDeleteId ? variants.find((v) => v.id === pendingDeleteId) : null;

  const updateScrollState = () => {
    const el = tabsListRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    const el = tabsListRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState);
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [variants.length]);

  // Auto-scroll active tab into view
  useEffect(() => {
    const list = tabsListRef.current;
    if (!list) return;
    const activeTab = list.querySelector<HTMLElement>("[data-state=active]");
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [selectedIndex]);

    const scrollTabs = (direction: "left" | "right") => {
      const el = tabsListRef.current;
      if (!el) return;
      el.scrollBy({ left: direction === "left" ? -120 : 120, behavior: "smooth" });
    };

    // --- Variant image handlers ---

    const getPendingFilesForVariant = useCallback(
      (variantId: string): Map<number, PendingFile> => {
        return pendingFilesPerVariant.get(variantId) ?? new Map();
      },
      [pendingFilesPerVariant]
    );

    const handleVariantImageFileSelect = useCallback(
      (variantId: string, index: number, file: File, previewUrl: string) => {
        setPendingFilesPerVariant((prev) => {
          const next = new Map(prev);
          const variantFiles = new Map(next.get(variantId) ?? new Map());
          // Clean up old preview URL
          const old = variantFiles.get(index);
          if (old && old.previewUrl !== previewUrl) {
            URL.revokeObjectURL(old.previewUrl);
          }
          variantFiles.set(index, { file, previewUrl });
          next.set(variantId, variantFiles);
          return next;
        });
      },
      []
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

    // Upload all pending variant images and save to DB
    const uploadAllVariantImages = useCallback(async () => {
      for (const variant of variants) {
        const pending = pendingFilesPerVariant.get(variant.id);
        const hasPending = pending && pending.size > 0;

        if (!hasPending && variant.images.length === 0) continue;

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
              return { url: data.path, altText: img.altText };
            }
            return { url: img.url, altText: img.altText };
          })
        );

        // Filter out empty URLs (unfilled image slots)
        const validImages = finalImages.filter((img) => img.url);

        await saveVariantImages({
          variantId: variant.id,
          images: validImages,
        });
      }

      // Clear all pending files
      setPendingFilesPerVariant(new Map());
    }, [variants, pendingFilesPerVariant]);

    useImperativeHandle(ref, () => ({
      uploadAllVariantImages,
    }), [uploadAllVariantImages]);

    const handleAddVariant = async () => {
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
    value: string | number
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
    setIsSaving(true);
    const result = await updateVariant(variant.id, {
      name: variant.name,
      weight: variant.weight,
      stockQuantity: variant.stockQuantity,
    });
    setIsSaving(false);
    if (!result.ok) {
      toast({ title: result.error, variant: "destructive" });
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
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
    if (!productId) return;
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

    await reorderVariants({
      productId,
      variantIds: reordered.map((v) => v.id),
    });
  };

  // Purchase option handlers
  const handleAddOption = async (variantId: string, type: PurchaseType) => {
    setIsSaving(true);
    const result = await createOption({
      variantId,
      type,
      priceInCents: 0,
      salePriceInCents: null,
      billingInterval: type === PurchaseType.SUBSCRIPTION ? BillingInterval.MONTH : null,
      billingIntervalCount: type === PurchaseType.SUBSCRIPTION ? 1 : null,
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

      {!productId ? (
        <div className="text-center py-8 border border-dashed rounded-lg text-sm text-muted-foreground">
          Save the product first to add variants.
        </div>
      ) : variants.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg text-sm text-muted-foreground">
          No variants yet. Add a variant to set up pricing.
        </div>
      ) : (
        <Tabs
          value={String(selectedIndex)}
          onValueChange={(val) => setSelectedIndex(Number(val))}
        >
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 aria-disabled:opacity-50"
              aria-disabled={!canScrollLeft}
              onClick={() => canScrollLeft && scrollTabs("left")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <TabsList
              ref={tabsListRef}
              className="flex flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {variants.map((v, i) => (
                <TabsTrigger key={v.id} value={String(i)} className="shrink-0 gap-1.5 pr-1.5">
                  {v.name}
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
                </TabsTrigger>
              ))}
            </TabsList>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleAddVariant}
              disabled={!productId || isSaving}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 aria-disabled:opacity-50"
              aria-disabled={!canScrollRight}
              onClick={() => canScrollRight && scrollTabs("right")}
            >
              <ChevronRight className="h-4 w-4" />
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
                <span className="text-sm text-muted-foreground">of</span>
                <span className="text-sm text-muted-foreground tabular-nums">{variants.length}</span>
              </div>
              <Field>
                <FormHeading htmlFor={`variant-name-${selectedVariant.id}`} label="Variant Name" required />
                <Input
                  id={`variant-name-${selectedVariant.id}`}
                  value={selectedVariant.name}
                  onChange={(e) =>
                    handleUpdateVariant(selectedVariant.id, "name", e.target.value)
                  }
                  onBlur={() => handleSaveVariant(selectedVariant)}
                />
              </Field>

              <StackedFieldPair>
                <Field className="flex-1">
                  <FormHeading htmlFor={`variant-weight-${selectedVariant.id}`} label="Weight" />
                  <Input
                    id={`variant-weight-${selectedVariant.id}`}
                    type="number"
                    value={selectedVariant.weight}
                    onChange={(e) =>
                      handleUpdateVariant(
                        selectedVariant.id,
                        "weight",
                        parseInt(e.target.value) || 0
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
                    value={selectedVariant.stockQuantity}
                    onChange={(e) =>
                      handleUpdateVariant(
                        selectedVariant.id,
                        "stockQuantity",
                        parseInt(e.target.value) || 0
                      )
                    }
                    onBlur={() => handleSaveVariant(selectedVariant)}
                  />
                </Field>
              </StackedFieldPair>

              {/* Variant Images */}
              <ImageListField
                label="Variant Images"
                images={selectedVariant.images.map((img) => ({
                  url: img.url,
                  alt: img.altText,
                }))}
                onChange={(newImages) =>
                  handleVariantImagesChange(selectedVariant.id, newImages)
                }
                pendingFiles={getPendingFilesForVariant(selectedVariant.id)}
                onFileSelect={(index, file, previewUrl) =>
                  handleVariantImageFileSelect(
                    selectedVariant.id,
                    index,
                    file,
                    previewUrl
                  )
                }
                onPendingRemove={(index) =>
                  handleVariantImagePendingRemove(selectedVariant.id, index)
                }
                maxImages={5}
                previewHeight="h-24"
              />

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
                      disabled={isSaving}
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
  const isSubscription = option.type === PurchaseType.SUBSCRIPTION;

  return (
    <div className="flex items-center gap-3 py-3">
      <span className="text-xs font-medium uppercase text-muted-foreground w-16 shrink-0">
        {isSubscription ? "SUB" : "ONE-TIME"}
      </span>

      <div className="flex-1 flex flex-wrap items-center gap-3">
        <InputGroup className="w-40 h-8">
          <InputGroupAddon align="inline-start">
            <InputGroupText>$</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            type="number"
            step="0.01"
            defaultValue={(option.priceInCents / 100).toFixed(2)}
            onBlur={(e) => {
              const cents = Math.round(parseFloat(e.target.value) * 100);
              if (cents >= 0) onUpdate(option.id, variantId, { priceInCents: cents });
            }}
          />
        </InputGroup>

        <InputGroup className="w-40 h-8">
          <InputGroupAddon align="inline-start">
            <InputGroupText>Sale $</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            type="number"
            step="0.01"
            placeholder="—"
            defaultValue={
              option.salePriceInCents
                ? (option.salePriceInCents / 100).toFixed(2)
                : ""
            }
            onBlur={(e) => {
              const val = e.target.value;
              const cents = val ? Math.round(parseFloat(val) * 100) : null;
              onUpdate(option.id, variantId, { salePriceInCents: cents });
            }}
          />
        </InputGroup>

        {isSubscription && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">every</span>
            <Input
              type="number"
              className="w-14 h-8"
              defaultValue={option.billingIntervalCount ?? 1}
              onBlur={(e) => {
                const count = parseInt(e.target.value) || 1;
                onUpdate(option.id, variantId, { billingIntervalCount: count });
              }}
            />
            <Select
              defaultValue={option.billingInterval ?? BillingInterval.MONTH}
              onValueChange={(val) =>
                onUpdate(option.id, variantId, {
                  billingInterval: val as BillingInterval,
                })
              }
            >
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAY">day(s)</SelectItem>
                <SelectItem value="WEEK">week(s)</SelectItem>
                <SelectItem value="MONTH">month(s)</SelectItem>
                <SelectItem value="YEAR">year(s)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => onDelete(option.id, variantId)}
        disabled={isSaving}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
