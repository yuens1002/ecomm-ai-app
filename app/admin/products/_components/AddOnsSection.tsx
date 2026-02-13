"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
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
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  type: string;
}

interface ProductVariant {
  id: string;
  name: string;
}

interface AddOnLink {
  id: string;
  addOnProduct: Product;
  addOnVariant: ProductVariant | null;
  discountedPriceInCents: number | null;
}

interface AddOnsSectionProps {
  productId: string | null;
}

export function AddOnsSection({ productId }: AddOnsSectionProps) {
  const { toast } = useToast();
  const [addOns, setAddOns] = useState<AddOnLink[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("__none__");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;
    fetchAddOns();
    fetchAvailableProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(() => {
    if (selectedProduct) {
      fetchVariants(selectedProduct);
    } else {
      setVariants([]);
      setSelectedVariant("__none__");
    }
  }, [selectedProduct]);

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
      setAvailableProducts(
        data.products.filter((p: Product) => p.id !== productId)
      );
    }
  };

  const fetchVariants = async (prodId: string) => {
    const res = await fetch(`/api/admin/products/${prodId}/variants`);
    if (res.ok) {
      const data = await res.json();
      setVariants(data.variants || []);
    }
  };

  const handleAdd = async () => {
    if (!selectedProduct || !productId) return;
    setLoading(true);
    const res = await fetch(`/api/admin/products/${productId}/addons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addOnProductId: selectedProduct,
        addOnVariantId: selectedVariant !== "__none__" ? selectedVariant : null,
        discountedPriceInCents: discountedPrice
          ? Math.round(parseFloat(discountedPrice) * 100)
          : null,
      }),
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: "Add-on linked" });
      fetchAddOns();
      setSelectedProduct("");
      setSelectedVariant("__none__");
      setDiscountedPrice("");
    } else {
      const error = await res.json();
      toast({ title: error.error || "Failed to add add-on", variant: "destructive" });
    }
  };

  const handleRemove = async (addOnId: string) => {
    setLoading(true);
    const res = await fetch(
      `/api/admin/products/${productId}/addons/${addOnId}`,
      { method: "DELETE" }
    );
    setLoading(false);
    if (res.ok) {
      toast({ title: "Add-on removed" });
      const newAddOns = addOns.filter((a) => a.id !== addOnId);
      setAddOns(newAddOns);
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    } else {
      toast({ title: "Failed to remove add-on", variant: "destructive" });
    }
  };

  // Edit state for the selected add-on's detail panel
  const [editVariants, setEditVariants] = useState<ProductVariant[]>([]);
  const [editVariant, setEditVariant] = useState("__none__");
  const [editDiscount, setEditDiscount] = useState("");
  const editTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const selectedAddOn = addOns[selectedIndex] ?? null;

  // Sync edit fields when selected add-on changes
  useEffect(() => {
    if (!selectedAddOn) return;
    setEditVariant(selectedAddOn.addOnVariant?.id ?? "__none__");
    setEditDiscount(
      selectedAddOn.discountedPriceInCents
        ? (selectedAddOn.discountedPriceInCents / 100).toFixed(2)
        : ""
    );
    // Fetch variants for the selected add-on's product
    fetchVariantsForEdit(selectedAddOn.addOnProduct.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, addOns]);

  const fetchVariantsForEdit = async (prodId: string) => {
    const res = await fetch(`/api/admin/products/${prodId}/variants`);
    if (res.ok) {
      const data = await res.json();
      setEditVariants(data.variants || []);
    }
  };

  const handleUpdate = useCallback(
    async (fields: { addOnVariantId?: string | null; discountedPriceInCents?: number | null }) => {
      if (!selectedAddOn || !productId) return;
      const res = await fetch(
        `/api/admin/products/${productId}/addons/${selectedAddOn.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setAddOns((prev) =>
          prev.map((a) => (a.id === data.addOn.id ? data.addOn : a))
        );
      } else {
        const error = await res.json();
        toast({ title: error.error || "Failed to update add-on", variant: "destructive" });
      }
    },
    [selectedAddOn, productId, toast]
  );

  const handleEditVariantChange = (value: string) => {
    setEditVariant(value);
    handleUpdate({ addOnVariantId: value !== "__none__" ? value : null });
  };

  const handleEditDiscountChange = (value: string) => {
    setEditDiscount(value);
    // Debounce the save for price input
    if (editTimeoutRef.current) clearTimeout(editTimeoutRef.current);
    editTimeoutRef.current = setTimeout(() => {
      const cents = value ? Math.round(parseFloat(value) * 100) : null;
      if (value && (isNaN(parseFloat(value)) || (cents !== null && cents <= 0))) return;
      handleUpdate({ discountedPriceInCents: cents });
    }, 600);
  };

  if (!productId) {
    return (
      <FieldSet>
        <FieldLegend>Add-ons</FieldLegend>
        <FieldDescription>Save the product first to manage add-ons.</FieldDescription>
      </FieldSet>
    );
  }

  return (
    <FieldSet>
      <div className="flex items-center justify-between">
        <div>
          <FieldLegend>Add-ons</FieldLegend>
          <FieldDescription>
            Link related products that can be purchased together
          </FieldDescription>
        </div>
      </div>

      <FieldGroup>
        {/* Add new add-on form */}
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <Field className="flex-1">
            <FormHeading label="Product" />
            <Combobox
              value={selectedProduct}
              onValueChange={setSelectedProduct}
              options={availableProducts.map((p) => ({
                value: p.id,
                label: p.name,
                badge: p.type,
              }))}
              placeholder="Select product"
              searchPlaceholder="Search products..."
              emptyMessage="No products found"
            />
          </Field>

          <Field className="flex-1">
            <FormHeading label="Variant" />
            <Select
              value={selectedVariant}
              onValueChange={setSelectedVariant}
              disabled={!selectedProduct}
            >
              <SelectTrigger>
                <SelectValue>
                  {selectedVariant === "__none__"
                    ? "Any variant"
                    : variants.find((v) => v.id === selectedVariant)?.name || "Any variant"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Any variant</SelectItem>
                {variants.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field className="w-full sm:w-40">
            <FormHeading label="Discount" />
            <Input
              type="number"
              step="0.01"
              placeholder="$0.00"
              value={discountedPrice}
              onChange={(e) => setDiscountedPrice(e.target.value)}
            />
          </Field>

          <Button
            type="button"
            onClick={handleAdd}
            disabled={loading || !selectedProduct}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {/* Existing add-ons — dropdown + detail pattern */}
        {addOns.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-lg text-sm text-muted-foreground">
            No add-ons configured yet.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Select
                value={String(selectedIndex)}
                onValueChange={(val) => setSelectedIndex(Number(val))}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue>
                    {selectedAddOn
                      ? `${selectedAddOn.addOnProduct.name}${selectedAddOn.addOnVariant ? ` · ${selectedAddOn.addOnVariant.name}` : ""}${selectedAddOn.discountedPriceInCents ? ` · ${formatPrice(selectedAddOn.discountedPriceInCents)}` : ""}`
                      : "Select add-on"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {addOns.map((a, i) => (
                    <SelectItem key={a.id} value={String(i)}>
                      {a.addOnProduct.name}
                      {a.addOnVariant ? ` · ${a.addOnVariant.name}` : ""}
                      {a.discountedPriceInCents ? ` · ${formatPrice(a.discountedPriceInCents)}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
                      This will unlink &quot;{selectedAddOn?.addOnProduct.name}&quot; as an add-on.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => selectedAddOn && handleRemove(selectedAddOn.id)}
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {selectedAddOn && (
              <div className="p-4 border rounded-lg space-y-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Product: </span>
                  <span className="font-medium">{selectedAddOn.addOnProduct.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({selectedAddOn.addOnProduct.type})
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Field className="flex-1">
                    <FormHeading label="Variant" />
                    <Select
                      value={editVariant}
                      onValueChange={handleEditVariantChange}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {editVariant === "__none__"
                            ? "Any variant"
                            : editVariants.find((v) => v.id === editVariant)?.name || "Any variant"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Any variant</SelectItem>
                        {editVariants.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field className="w-full sm:w-40">
                    <FormHeading label="Discount" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="$0.00"
                      value={editDiscount}
                      onChange={(e) => handleEditDiscountChange(e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            )}
          </>
        )}
      </FieldGroup>
    </FieldSet>
  );
}
