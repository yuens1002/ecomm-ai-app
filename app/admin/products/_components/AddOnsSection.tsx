"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
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

interface PurchaseOption {
  id: string;
  priceInCents: number;
  type: string;
}

interface ProductVariant {
  id: string;
  name: string;
  purchaseOptions?: PurchaseOption[];
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
      setAddOns((prev) => prev.filter((a) => a.id !== addOnId));
    } else {
      toast({ title: "Failed to remove add-on", variant: "destructive" });
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

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
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>$</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                type="number"
                step="0.01"
                placeholder="0.00"
                value={discountedPrice}
                onChange={(e) => setDiscountedPrice(e.target.value)}
              />
            </InputGroup>
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

        {/* Existing add-ons — individual cards */}
        {addOns.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-lg text-sm text-muted-foreground">
            No add-ons configured yet.
          </div>
        ) : (
          <div className="space-y-2">
            {addOns.map((addOn) => (
              <AddOnCard
                key={addOn.id}
                addOn={addOn}
                productId={productId!}
                onRemove={handleRemove}
                onUpdate={(updated) =>
                  setAddOns((prev) =>
                    prev.map((a) => (a.id === updated.id ? updated : a))
                  )
                }
                formatPrice={formatPrice}
              />
            ))}
          </div>
        )}
      </FieldGroup>
    </FieldSet>
  );
}

function AddOnCard({
  addOn,
  productId,
  onRemove,
  onUpdate,
  formatPrice,
}: {
  addOn: AddOnLink;
  productId: string;
  onRemove: (id: string) => void;
  onUpdate: (addOn: AddOnLink) => void;
  formatPrice: (cents: number) => string;
}) {
  const { toast } = useToast();
  const [editVariants, setEditVariants] = useState<ProductVariant[]>([]);
  const [editVariant, setEditVariant] = useState(addOn.addOnVariant?.id ?? "__none__");
  const [editDiscount, setEditDiscount] = useState(
    addOn.discountedPriceInCents
      ? (addOn.discountedPriceInCents / 100).toFixed(2)
      : ""
  );
  const editTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevProductIdRef = useRef(addOn.addOnProduct.id);
  const prevAddOnIdRef = useRef(addOn.id);

  const fetchVariants = async (prodId: string) => {
    const res = await fetch(`/api/admin/products/${prodId}/variants`);
    if (res.ok) {
      const data = await res.json();
      setEditVariants(data.variants || []);
    }
  };

  // Fetch variants on mount and when product changes
  if (prevProductIdRef.current !== addOn.addOnProduct.id) {
    prevProductIdRef.current = addOn.addOnProduct.id;
    fetchVariants(addOn.addOnProduct.id);
  }
  useEffect(() => {
    fetchVariants(addOn.addOnProduct.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync edit fields when addOn prop changes (e.g. after PATCH response)
  if (prevAddOnIdRef.current !== addOn.id) {
    prevAddOnIdRef.current = addOn.id;
    setEditVariant(addOn.addOnVariant?.id ?? "__none__");
    setEditDiscount(
      addOn.discountedPriceInCents
        ? (addOn.discountedPriceInCents / 100).toFixed(2)
        : ""
    );
  }

  const handleUpdate = useCallback(
    async (fields: { addOnVariantId?: string | null; discountedPriceInCents?: number | null }) => {
      const res = await fetch(
        `/api/admin/products/${productId}/addons/${addOn.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        }
      );
      if (res.ok) {
        const data = await res.json();
        onUpdate(data.addOn);
      } else {
        const error = await res.json();
        toast({ title: error.error || "Failed to update add-on", variant: "destructive" });
      }
    },
    [addOn.id, productId, onUpdate, toast]
  );

  const handleVariantChange = (value: string) => {
    setEditVariant(value);
    handleUpdate({ addOnVariantId: value !== "__none__" ? value : null });
  };

  const handleDiscountChange = (value: string) => {
    setEditDiscount(value);
    if (editTimeoutRef.current) clearTimeout(editTimeoutRef.current);
    editTimeoutRef.current = setTimeout(() => {
      const cents = value ? Math.round(parseFloat(value) * 100) : null;
      if (value && (isNaN(parseFloat(value)) || (cents !== null && cents <= 0))) return;
      handleUpdate({ discountedPriceInCents: cents });
    }, 600);
  };

  // Get the one-time price from the selected variant for reference
  const variantPrice = addOn.addOnVariant?.purchaseOptions?.find(
    (o) => o.type === "ONE_TIME"
  )?.priceInCents;

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <span className="font-medium">{addOn.addOnProduct.name}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {addOn.addOnProduct.type}
          </span>
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
                This will unlink &quot;{addOn.addOnProduct.name}&quot; as an add-on.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onRemove(addOn.id)}>
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Field className="flex-1">
          <FormHeading label="Variant" />
          <Select value={editVariant} onValueChange={handleVariantChange}>
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
        {variantPrice != null && (
          <Field className="w-full sm:w-28">
            <FormHeading label="Price" />
            <div className="flex items-center h-9 px-3 text-sm text-muted-foreground bg-muted/50 border rounded-md">
              {formatPrice(variantPrice)}
            </div>
          </Field>
        )}
        <Field className="w-full sm:w-40">
          <FormHeading label="Discount" />
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>$</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              type="number"
              step="0.01"
              placeholder="0.00"
              value={editDiscount}
              onChange={(e) => handleDiscountChange(e.target.value)}
            />
          </InputGroup>
        </Field>
      </div>
    </div>
  );
}
