"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ProductType } from "@prisma/client";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  addOns: string[];
}

interface ProductManagementClientProps {
  title?: string;
  description?: string;
  productType?: ProductType;
}

export default function ProductManagementClient({
  title: _title = "Product Management",
  description: _description = "Manage products and inventory",
  productType = ProductType.COFFEE,
}: ProductManagementClientProps) {
  const basePath = productType === ProductType.MERCH ? "/admin/merch" : "/admin/products";
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
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
    fetchProducts();
  }, [fetchProducts]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = products;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(query));
    }

    if (sortDirection) {
      result = [...result].sort((a, b) => {
        const cmp = a.name.localeCompare(b.name);
        return sortDirection === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [products, searchQuery, sortDirection]);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const cycleSortDirection = () => {
    setSortDirection((prev) => {
      if (prev === null) return "asc";
      if (prev === "asc") return "desc";
      return null;
    });
  };

  const SortIcon = sortDirection === "asc" ? ArrowUp : sortDirection === "desc" ? ArrowDown : ArrowUpDown;

  if (loading) {
    return <div>Loading products...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex-1" />
        <Button asChild>
          <Link href={`${basePath}/new`}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Link>
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="border-b-2">
              <TableHead className="h-10 font-medium text-foreground w-[30%]">
                <button
                  type="button"
                  className="flex items-center gap-1.5 hover:text-foreground/80"
                  onClick={cycleSortDirection}
                >
                  Name
                  <SortIcon className="h-4 w-4" />
                </button>
              </TableHead>
              <TableHead className="h-10 font-medium text-foreground w-[20%]">Added Categories</TableHead>
              <TableHead className="h-10 font-medium text-foreground w-[30%]">Variants</TableHead>
              <TableHead className="h-10 font-medium text-foreground w-[20%]">Add-ons</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No products match your search." : "No products found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedProducts.map((product) => (
                <TableRow
                  key={product.id}
                  className="hover:bg-muted/40 cursor-pointer border-b"
                  onDoubleClick={() => router.push(`${basePath}/${product.id}`)}
                >
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
                            <div className="flex items-center justify-between gap-20">
                              <span className="font-semibold text-sm truncate whitespace-nowrap overflow-hidden text-ellipsis">
                                {v.name}
                              </span>
                              <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded truncate whitespace-nowrap overflow-hidden text-ellipsis">
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
                  <TableCell>
                    {product.addOns && product.addOns.length > 0
                      ? product.addOns.join(", ")
                      : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
