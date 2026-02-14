"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Combobox, type ComboboxGroup } from "@/components/ui/combobox";
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
} from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Check, EllipsisVertical, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// --- Types ---

type DiscountType = "FIXED" | "PERCENTAGE";

interface PurchaseOption {
  id: string;
  priceInCents: number;
  salePriceInCents: number | null;
  type: string;
}

interface Variant {
  id: string;
  name: string;
  weight: number;
  stockQuantity: number;
  purchaseOptions: PurchaseOption[];
}

interface Selection {
  id: string;
  addOnVariantId: string | null;
  discountType: DiscountType | null;
  discountValue: number | null;
}

interface AddOnEntry {
  addOnProduct: { id: string; name: string; type: string };
  variants: Variant[];
  selections: Selection[];
}

interface AvailableProduct {
  id: string;
  name: string;
  type: string;
  categoriesDetailed: Array<{ id: string; name: string }>;
}

// --- Helpers ---

const DISCOUNT_CALC: Record<DiscountType, (price: number, value: number) => number> = {
  FIXED: (price, value) => Math.max(0, price - value),
  PERCENTAGE: (price, value) => Math.round(price * (1 - value / 100)),
};

function computeEffectivePrice(
  price: number,
  discountType: DiscountType | null,
  discountValue: number | null
): number {
  if (!discountType || discountValue == null) return price;
  return DISCOUNT_CALC[discountType](price, discountValue);
}

function getVariantPrice(variant: Variant): number | null {
  const opt = variant.purchaseOptions.find((o) => o.type === "ONE_TIME");
  if (!opt) return null;
  return opt.salePriceInCents ?? opt.priceInCents;
}

const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function buildComboboxGroups(
  products: AvailableProduct[],
  addedProductIds: Set<string>,
  currentProductId: string
): ComboboxGroup[] {
  const groups: ComboboxGroup[] = [];

  // "Added" group at top (disabled, non-selectable)
  const addedProducts = products.filter((p) => addedProductIds.has(p.id));
  if (addedProducts.length > 0) {
    groups.push({
      heading: "Added",
      options: addedProducts
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((p) => ({
          value: p.id,
          label: p.name,
          badge: p.type,
          disabled: true,
        })),
    });
  }

  // Group remaining products by category
  const available = products.filter(
    (p) => !addedProductIds.has(p.id) && p.id !== currentProductId
  );
  const categoryMap = new Map<string, AvailableProduct[]>();
  const uncategorized: AvailableProduct[] = [];

  for (const product of available) {
    if (product.categoriesDetailed.length === 0) {
      uncategorized.push(product);
    } else {
      const categoryName = product.categoriesDetailed[0].name;
      const list = categoryMap.get(categoryName) ?? [];
      list.push(product);
      categoryMap.set(categoryName, list);
    }
  }

  // Sort categories alphabetically, products alphabetized within
  const sortedCategories = [...categoryMap.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  );

  for (const [categoryName, prods] of sortedCategories) {
    groups.push({
      heading: categoryName,
      options: prods
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((p) => ({ value: p.id, label: p.name, badge: p.type })),
    });
  }

  // Uncategorized in a headerless group at end
  if (uncategorized.length > 0) {
    groups.push({
      options: uncategorized
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((p) => ({ value: p.id, label: p.name, badge: p.type })),
    });
  }

  return groups;
}

// --- Selection state helpers ---

type CheckboxState = "all" | "individual" | "none";

function getCheckboxState(selections: Selection[], variants: Variant[]): CheckboxState {
  if (selections.some((s) => s.addOnVariantId === null)) return "all";
  if (selections.length > 0) return "individual";
  // Single-variant products always start checked
  if (variants.length === 1) return "individual";
  return "none";
}

// --- Main Component ---

interface AddOnsSectionProps {
  productId: string | null;
}

export function AddOnsSection({ productId }: AddOnsSectionProps) {
  const { toast } = useToast();
  const [addOns, setAddOns] = useState<AddOnEntry[]>([]);
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;
    fetchAddOns();
    fetchAvailableProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const fetchAddOns = async () => {
    const res = await fetch(`/api/admin/products/${productId}/addons`);
    if (res.ok) {
      const data = await res.json();
      setAddOns(data.addOns || []);
    }
  };

  const fetchAvailableProducts = async () => {
    const res = await fetch("/api/admin/products");
    if (res.ok) {
      const data = await res.json();
      setAvailableProducts(data.products || []);
    }
  };

  const handleAdd = async () => {
    if (!selectedProduct || !productId) return;
    setLoading(true);
    const res = await fetch(`/api/admin/products/${productId}/addons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addOnProductId: selectedProduct }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setAddOns((prev) => [...prev, data.addOn]);
      toast({ title: "Add-on linked" });
      setSelectedProduct("");
    } else {
      const error = await res.json();
      toast({
        title: error.error || "Failed to add add-on",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (addOnProductId: string) => {
    const res = await fetch(
      `/api/admin/products/${productId}/addons?addOnProductId=${addOnProductId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      toast({ title: "Add-on removed" });
      setAddOns((prev) => prev.filter((a) => a.addOnProduct.id !== addOnProductId));
    } else {
      toast({ title: "Failed to remove add-on", variant: "destructive" });
    }
  };

  const handleSelectionsChange = useCallback(
    (addOnProductId: string, newSelections: Selection[]) => {
      setAddOns((prev) =>
        prev.map((a) =>
          a.addOnProduct.id === addOnProductId
            ? { ...a, selections: newSelections }
            : a
        )
      );
    },
    []
  );

  if (!productId) {
    return (
      <FieldSet>
        <FieldLegend>Add-Ons</FieldLegend>
        <FieldDescription>Save the product first to manage add-ons.</FieldDescription>
      </FieldSet>
    );
  }

  const addedProductIds = new Set(addOns.map((a) => a.addOnProduct.id));
  const comboboxGroups = buildComboboxGroups(
    availableProducts,
    addedProductIds,
    productId
  );

  return (
    <FieldSet>
      <div>
        <FieldLegend>Add-Ons</FieldLegend>
        <FieldDescription>
          Bundle products to upsell on product page and shopping cart
        </FieldDescription>
      </div>

      <FieldGroup>
        {/* Add new add-on: combobox + button only */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Combobox
              value={selectedProduct}
              onValueChange={setSelectedProduct}
              groups={comboboxGroups}
              placeholder="Select product"
              searchPlaceholder="Search products..."
              emptyMessage="No products found"
            />
          </div>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={loading || !selectedProduct}
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {/* Add-on product cards */}
        {addOns.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-lg text-sm text-muted-foreground">
            No add-ons configured yet.
          </div>
        ) : (
          <div className="space-y-3">
            {addOns.map((entry) => (
              <AddOnProductCard
                key={entry.addOnProduct.id}
                entry={entry}
                productId={productId!}
                onRemove={handleRemove}
                onSelectionsChange={handleSelectionsChange}
              />
            ))}
          </div>
        )}
      </FieldGroup>
    </FieldSet>
  );
}

// --- Per-product card ---

function AddOnProductCard({
  entry,
  productId,
  onRemove,
  onSelectionsChange,
}: {
  entry: AddOnEntry;
  productId: string;
  onRemove: (addOnProductId: string) => void;
  onSelectionsChange: (addOnProductId: string, selections: Selection[]) => void;
}) {
  const { toast } = useToast();
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addOnProduct, variants, selections } = entry;
  const isSingleVariant = variants.length === 1;
  const checkboxState = getCheckboxState(selections, variants);

  const syncSelections = useCallback(
    (newSelections: Selection[]) => {
      onSelectionsChange(addOnProduct.id, newSelections);

      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(async () => {
        const payload = newSelections.map((s) => ({
          addOnVariantId: s.addOnVariantId,
          discountType: s.discountType,
          discountValue: s.discountValue,
        }));

        const res = await fetch(
          `/api/admin/products/${productId}/addons/sync`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              addOnProductId: addOnProduct.id,
              selections: payload,
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          onSelectionsChange(addOnProduct.id, data.selections);
        } else {
          toast({ title: "Failed to sync", variant: "destructive" });
        }
      }, 600);
    },
    [addOnProduct.id, productId, onSelectionsChange, toast]
  );

  // "All variants" checkbox toggled
  const handleAllToggle = (checked: boolean) => {
    if (checked) {
      // Find the existing "all" selection's discount if any, or default
      const existing = selections.find((s) => s.addOnVariantId === null);
      syncSelections([
        {
          id: existing?.id ?? "",
          addOnVariantId: null,
          discountType: existing?.discountType ?? "FIXED",
          discountValue: existing?.discountValue ?? null,
        },
      ]);
    } else {
      syncSelections([]);
    }
  };

  // Individual variant checkbox toggled
  const handleVariantToggle = (variantId: string, checked: boolean) => {
    const newSelections = checked
      ? [
          ...selections,
          { id: "", addOnVariantId: variantId, discountType: "FIXED" as const, discountValue: null },
        ]
      : selections.filter((s) => s.addOnVariantId !== variantId);
    syncSelections(newSelections);
  };

  // Discount type/value changed for a selection row
  const handleDiscountChange = (
    addOnVariantId: string | null,
    field: "discountType" | "discountValue",
    value: string
  ) => {
    const newSelections = selections.map((s) => {
      if (s.addOnVariantId !== addOnVariantId) return s;
      if (field === "discountType") {
        return {
          ...s,
          discountType: (value || null) as DiscountType | null,
          discountValue: null,
        };
      }
      // discountValue
      const numVal = value === "" ? null : parseInt(value, 10);
      return { ...s, discountValue: isNaN(numVal as number) ? null : numVal };
    });
    syncSelections(newSelections);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{addOnProduct.name}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {addOnProduct.type}
          </Badge>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove add-on?</AlertDialogTitle>
              <AlertDialogDescription>
                This will unlink &quot;{addOnProduct.name}&quot; and remove all
                variant selections.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onRemove(addOnProduct.id)}>
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Variant table */}
      <div className="px-4 py-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-xs">
              <th className="w-8 pb-2" />
              <th className="text-left pb-2 font-medium">Name</th>
              <th className="text-right pb-2 font-medium w-20">Price</th>
              <th className="text-left pb-2 font-medium pl-4 w-40">Discount</th>
              <th className="text-right pb-2 font-medium w-24">Adj. Price</th>
            </tr>
          </thead>
          <tbody>
            {/* "All variants" row — only shown when >=2 variants */}
            {!isSingleVariant && (
              <AllVariantsRow
                checked={checkboxState === "all"}
                disabled={checkboxState === "individual"}
                onToggle={handleAllToggle}
                selection={selections.find((s) => s.addOnVariantId === null) ?? null}
                onDiscountChange={(field, val) =>
                  handleDiscountChange(null, field, val)
                }
              />
            )}

            {/* Individual variant rows */}
            {variants.map((variant) => {
              // For single-variant, if there's a selection with null variantId, show that discount
              const selection = isSingleVariant
                ? selections[0] ?? null
                : selections.find((s) => s.addOnVariantId === variant.id) ?? null;

              return (
                <VariantRow
                  key={variant.id}
                  variant={variant}
                  checked={
                    isSingleVariant
                      ? selections.length > 0
                      : selections.some((s) => s.addOnVariantId === variant.id)
                  }
                  disabled={!isSingleVariant && checkboxState === "all"}
                  discountDisabled={!isSingleVariant && checkboxState === "all"}
                  selection={selection}
                  onToggle={(checked) => {
                    if (isSingleVariant) {
                      // Single variant: toggle the null-variant row
                      handleAllToggle(checked);
                    } else {
                      handleVariantToggle(variant.id, checked);
                    }
                  }}
                  onDiscountChange={(field, val) => {
                    const targetVariantId = isSingleVariant ? null : variant.id;
                    handleDiscountChange(targetVariantId, field, val);
                  }}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- "All variants" row ---

function AllVariantsRow({
  checked,
  disabled,
  onToggle,
  selection,
  onDiscountChange,
}: {
  checked: boolean;
  disabled: boolean;
  onToggle: (checked: boolean) => void;
  selection: Selection | null;
  onDiscountChange: (field: "discountType" | "discountValue", value: string) => void;
}) {
  return (
    <tr className="border-b border-dashed last:border-0">
      <td className="py-2">
        <Checkbox
          checked={checked}
          disabled={disabled}
          onCheckedChange={(val) => onToggle(val === true)}
        />
      </td>
      <td className="py-2 text-muted-foreground italic">All variants</td>
      <td className="py-2 text-right text-muted-foreground">—</td>
      <td className="py-2 pl-4">
        <DiscountControl
          discountType={selection?.discountType ?? null}
          discountValue={selection?.discountValue ?? null}
          disabled={!checked}
          onChange={onDiscountChange}
        />
      </td>
      <td className="py-2 text-right text-muted-foreground">—</td>
    </tr>
  );
}

// --- Individual variant row ---

function VariantRow({
  variant,
  checked,
  disabled,
  discountDisabled,
  selection,
  onToggle,
  onDiscountChange,
}: {
  variant: Variant;
  checked: boolean;
  disabled: boolean;
  discountDisabled: boolean;
  selection: Selection | null;
  onToggle: (checked: boolean) => void;
  onDiscountChange: (field: "discountType" | "discountValue", value: string) => void;
}) {
  const price = getVariantPrice(variant);
  const effectivePrice =
    price != null && selection
      ? computeEffectivePrice(price, selection.discountType, selection.discountValue)
      : price;

  return (
    <tr className="border-b border-dashed last:border-0">
      <td className="py-2">
        <Checkbox
          checked={checked}
          disabled={disabled}
          onCheckedChange={(val) => onToggle(val === true)}
        />
      </td>
      <td className="py-2">{variant.name}</td>
      <td className="py-2 text-right">
        {price != null ? formatPrice(price) : "—"}
      </td>
      <td className="py-2 pl-4">
        <DiscountControl
          discountType={selection?.discountType ?? null}
          discountValue={selection?.discountValue ?? null}
          disabled={discountDisabled || !checked}
          onChange={onDiscountChange}
        />
      </td>
      <td className="py-2 text-right">
        {effectivePrice != null && checked ? formatPrice(effectivePrice) : "—"}
      </td>
    </tr>
  );
}

// --- Discount control ($/% select + value input) ---

const DISCOUNT_SYMBOL: Record<DiscountType, string> = {
  FIXED: "$",
  PERCENTAGE: "%",
};

function DiscountControl({
  discountType,
  discountValue,
  disabled,
  onChange,
}: {
  discountType: DiscountType | null;
  discountValue: number | null;
  disabled: boolean;
  onChange: (field: "discountType" | "discountValue", value: string) => void;
}) {
  const activeType = discountType ?? "FIXED";
  const displayValue =
    discountValue != null && discountValue > 0
      ? activeType === "FIXED"
        ? (discountValue / 100).toString()
        : discountValue.toString()
      : "";

  return (
    <InputGroup
      className={`h-8 w-28 ${disabled ? "opacity-40 pointer-events-none" : ""}`}
      data-disabled={disabled || undefined}
    >
      <InputGroupAddon>
        <span className="text-xs">{DISCOUNT_SYMBOL[activeType]}</span>
      </InputGroupAddon>
      <InputGroupInput
        type="number"
        step={activeType === "FIXED" ? "0.01" : "1"}
        min={activeType === "FIXED" ? "0.01" : "1"}
        placeholder="0"
        className="text-xs h-8"
        value={displayValue}
        disabled={disabled}
        onChange={(e) => {
          const raw = e.target.value;
          if (activeType === "FIXED") {
            const cents = raw === "" ? "" : Math.round(parseFloat(raw) * 100).toString();
            onChange("discountValue", cents);
          } else {
            onChange("discountValue", raw);
          }
        }}
      />
      <InputGroupAddon align="inline-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className="text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none"
            >
              <EllipsisVertical className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-36">
            <DropdownMenuItem onClick={() => onChange("discountType", "FIXED")}>
              $ Amount
              {activeType === "FIXED" && <Check className="ml-auto size-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChange("discountType", "PERCENTAGE")}>
              % Percentage
              {activeType === "PERCENTAGE" && <Check className="ml-auto size-4" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </InputGroupAddon>
    </InputGroup>
  );
}
