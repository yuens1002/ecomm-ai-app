"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Pencil, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProductFormClient from "./ProductFormClient";
import { ProductType } from "@prisma/client";

interface PurchaseOption {
  type: "ONE_TIME" | "SUBSCRIPTION";
  priceInCents: number;
  billingInterval?: string | null;
  billingIntervalCount?: number | null;
}

interface Variant {
  name: string;
  stock: number;
  options: PurchaseOption[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  isDisabled?: boolean;
  stock: number;
  price: number;
  categories: string;
  variants: Variant[];
}

interface ProductManagementClientProps {
  title?: string;
  description?: string;
  productType?: ProductType;
}

export default function ProductManagementClient({
  title = "Product Management",
  description = "Manage products and inventory",
  productType = ProductType.COFFEE,
}: ProductManagementClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "form">("list");
  const [selectedProductId, setSelectedProductId] = useState<
    string | undefined
  >(undefined);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      const search = new URLSearchParams();
      if (productType) search.set("type", productType);
      const response = await fetch(`/api/admin/products?${search.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [productType, toast]);

  useEffect(() => {
    if (view === "list") {
      fetchProducts();
    }
  }, [view, fetchProducts]);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  if (loading && view === "list") {
    return <div>Loading products...</div>;
  }

  if (view === "form") {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => {
            setView("list");
            setSelectedProductId(undefined);
          }}
          className="pl-0 hover:bg-transparent hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to catalog
        </Button>
        <ProductFormClient
          productId={selectedProductId}
          productType={productType}
          onClose={() => {
            setView("list");
            setSelectedProductId(undefined);
          }}
          onSaved={(id) => {
            setSelectedProductId(id);
            // Stay in form view to allow adding variants
          }}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-end">
        <Button
          onClick={() => {
            setSelectedProductId(undefined);
            setView("form");
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Variants</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{product.name}</span>
                      {product.isDisabled ? (
                        <span className="text-xs rounded bg-destructive/10 text-destructive px-2 py-0.5">
                          Disabled
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{product.categories || "-"}</TableCell>
                  <TableCell>
                    {product.variants && product.variants.length > 0 ? (
                      <div className="flex flex-col gap-3 py-1">
                        {product.variants.map((v, i) => (
                          <div key={i} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-sm">
                                {v.name}
                              </span>
                              <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                Stock: {v.stock}
                              </span>
                            </div>
                            <div className="grid gap-1 pl-2 border-l-2 border-muted">
                              {v.options.map((opt, j) => (
                                <div
                                  key={j}
                                  className="text-xs flex justify-between items-center gap-4"
                                >
                                  <span className="text-muted-foreground">
                                    {opt.type === "ONE_TIME"
                                      ? "One-time"
                                      : `Sub (${opt.billingIntervalCount} ${opt.billingInterval?.toLowerCase()})`}
                                  </span>
                                  <span className="font-mono font-medium">
                                    {formatPrice(opt.priceInCents)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedProductId(product.id);
                        setView("form");
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
