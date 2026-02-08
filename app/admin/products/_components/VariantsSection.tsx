"use client";

import { useState } from "react";
import { PurchaseType, BillingInterval } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FieldSet,
  FieldLegend,
  FieldGroup,
  FieldDescription,
  Field,
} from "@/components/ui/field";
import { FormHeading } from "@/components/ui/forms/FormHeading";
import { StackedFieldPair } from "./shared/StackedFieldPair";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createVariant,
  updateVariant,
  deleteVariant,
  reorderVariants,
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

export interface VariantData {
  id: string;
  name: string;
  weight: number;
  stockQuantity: number;
  order: number;
  purchaseOptions: PurchaseOptionData[];
}

interface VariantsSectionProps {
  productId: string | null;
  variants: VariantData[];
  onVariantsChange: (variants: VariantData[]) => void;
}

export function VariantsSection({
  productId,
  variants,
  onVariantsChange,
}: VariantsSectionProps) {
  const { toast } = useToast();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const selectedVariant = variants[selectedIndex] ?? null;

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

  const formatPrice = (cents: number) =>
    cents ? `$${(cents / 100).toFixed(2)}` : "$0.00";

  return (
    <FieldSet>
      <div className="flex items-center justify-between">
        <div>
          <FieldLegend>Variants &amp; Pricing</FieldLegend>
          <FieldDescription>
            Manage product variants with pricing and stock
          </FieldDescription>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleAddVariant}
          disabled={!productId || isSaving}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Variant
        </Button>
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
        <FieldGroup>
          {/* Dropdown + Actions Row */}
          <div className="flex items-center gap-2">
            <Select
              value={String(selectedIndex)}
              onValueChange={(val) => setSelectedIndex(Number(val))}
            >
              <SelectTrigger className="flex-1">
                <SelectValue>
                  {selectedVariant
                    ? `${selectedVariant.name}  ·  ${formatPrice(selectedVariant.purchaseOptions[0]?.priceInCents ?? 0)}  ·  ${selectedVariant.stockQuantity} in stock`
                    : "Select variant"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {variants.map((v, i) => (
                  <SelectItem key={v.id} value={String(i)}>
                    {v.name} · {formatPrice(v.purchaseOptions[0]?.priceInCents ?? 0)} · {v.stockQuantity} in stock
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Per-item actions */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete variant?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &quot;{selectedVariant?.name}&quot; and all its purchase options.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => selectedVariant && handleDeleteVariant(selectedVariant.id)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {variants.length > 1 && (
              <ButtonGroup>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={selectedIndex === 0}
                  onClick={() => handleReorder("up")}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={selectedIndex === variants.length - 1}
                  onClick={() => handleReorder("down")}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </ButtonGroup>
            )}
          </div>

          {/* Selected variant detail fields */}
          {selectedVariant && (
            <div className="space-y-6 border rounded-lg p-4">
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
                  <div className="space-y-3">
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
          )}
        </FieldGroup>
      )}
    </FieldSet>
  );
}

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
    <div className="flex items-center gap-3 p-3 border rounded">
      <span className="text-xs font-medium uppercase text-muted-foreground w-16 shrink-0">
        {isSubscription ? "SUB" : "ONE-TIME"}
      </span>

      <div className="flex-1 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">$</span>
          <Input
            type="number"
            step="0.01"
            className="w-24 h-8"
            defaultValue={(option.priceInCents / 100).toFixed(2)}
            onBlur={(e) => {
              const cents = Math.round(parseFloat(e.target.value) * 100);
              if (cents > 0) onUpdate(option.id, variantId, { priceInCents: cents });
            }}
          />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Sale $</span>
          <Input
            type="number"
            step="0.01"
            className="w-24 h-8"
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
        </div>

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

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete purchase option?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this {isSubscription ? "subscription" : "one-time"} purchase option.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(option.id, variantId)}
              disabled={isSaving}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
