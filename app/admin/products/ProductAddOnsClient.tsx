"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  type: string;
}

interface ProductVariant {
  id: string;
  name: string;
  weight: number;
  stockQuantity: number;
  purchaseOptions: Array<{
    id: string;
    priceInCents: number;
    type: string;
  }>;
}

interface AddOnLink {
  id: string;
  addOnProduct: Product;
  addOnVariant: ProductVariant | null;
  discountedPriceInCents: number | null;
}

interface ProductAddOnsClientProps {
  productId: string;
}

export default function ProductAddOnsClient({
  productId,
}: ProductAddOnsClientProps) {
  const { toast } = useToast();
  const [addOns, setAddOns] = useState<AddOnLink[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<string>("__none__");
  const [discountedPrice, setDiscountedPrice] = useState<string>("");
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchAddOns = async () => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/addons`);
      if (res.ok) {
        const data = await res.json();
        setAddOns(data.addOns || []);
      }
    } catch (error) {
      console.error("Failed to fetch add-ons:", error);
    }
  };

  const fetchAvailableProducts = async () => {
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const data = await res.json();
        // Filter out the current product
        const filtered = data.products.filter(
          (p: Product) => p.id !== productId
        );
        setAvailableProducts(filtered);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const fetchVariants = async (prodId: string) => {
    try {
      const res = await fetch(`/api/admin/products/${prodId}/variants`);
      if (res.ok) {
        const data = await res.json();
        setVariants(data.variants || []);
      }
    } catch (error) {
      console.error("Failed to fetch variants:", error);
      setVariants([]);
    }
  };

  // Fetch existing add-ons
  useEffect(() => {
    fetchAddOns();
    fetchAvailableProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Fetch variants when product is selected
  useEffect(() => {
    if (selectedProduct) {
      fetchVariants(selectedProduct);
    } else {
      setVariants([]);
      setSelectedVariant("__none__");
    }
  }, [selectedProduct]);

  const handleAdd = async () => {
    if (!selectedProduct) {
      return;
    }

    setAdding(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/addons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addOnProductId: selectedProduct,
          addOnVariantId:
            selectedVariant && selectedVariant !== "__none__"
              ? selectedVariant
              : null,
          discountedPriceInCents: discountedPrice
            ? Math.round(parseFloat(discountedPrice) * 100)
            : null,
        }),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "Add-on linked successfully",
        });
        fetchAddOns();
        setSelectedProduct("");
        setSelectedVariant("__none__");
        setDiscountedPrice("");
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.error || "Failed to add add-on",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add add-on",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (addOnId: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/products/${productId}/addons/${addOnId}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        toast({
          title: "Success",
          description: "Add-on removed successfully",
        });
        fetchAddOns();
      } else {
        toast({
          title: "Error",
          description: "Failed to remove add-on",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove add-on",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Product Add-Ons
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Add-On */}
        <div className="border rounded-lg p-4 bg-muted/20">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Product
              </label>
              <Combobox
                value={selectedProduct}
                onValueChange={setSelectedProduct}
                options={availableProducts.map((product) => ({
                  value: product.id,
                  label: product.name,
                  badge: product.type,
                }))}
                placeholder="Select product"
                searchPlaceholder="Search products..."
                emptyMessage="No products found"
              />
            </div>

            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Variant
              </label>
              <Select
                value={selectedVariant}
                onValueChange={setSelectedVariant}
                disabled={!selectedProduct}
              >
                <SelectTrigger>
                  <SelectValue>
                    {selectedVariant === "__none__"
                      ? "Any variant"
                      : variants.find((v) => v.id === selectedVariant)?.name ||
                        "Any variant"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Any variant</SelectItem>
                  {variants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-40">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Discount
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="$0.00"
                value={discountedPrice}
                onChange={(e) => setDiscountedPrice(e.target.value)}
              />
            </div>

            <Button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {/* Existing Add-Ons */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Current Add-Ons ({addOns.length})
          </h4>
          {addOns.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
              No add-ons configured yet. Add products that can be purchased
              together with this item.
            </div>
          ) : (
            <div className="space-y-2">
              {addOns.map((addOn) => (
                <div
                  key={addOn.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {addOn.addOnProduct.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {addOn.addOnProduct.type}
                      </Badge>
                    </div>
                    {addOn.addOnVariant && (
                      <div className="text-sm text-muted-foreground">
                        Variant: {addOn.addOnVariant.name}
                      </div>
                    )}
                    {addOn.discountedPriceInCents && (
                      <div className="text-sm text-green-600 font-medium">
                        Discounted: {formatPrice(addOn.discountedPriceInCents)}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(addOn.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
