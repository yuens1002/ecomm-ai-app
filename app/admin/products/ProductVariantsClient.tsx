"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, DollarSign, RefreshCw } from "lucide-react";
import { WeightUnitOption, isWeightUnitOption } from "@/lib/weight-unit";

interface PurchaseOption {
  id: string;
  type: "ONE_TIME" | "SUBSCRIPTION";
  priceInCents: number;
  billingInterval: "DAY" | "WEEK" | "MONTH" | "YEAR" | null;
  billingIntervalCount: number | null;
}

interface Variant {
  id: string;
  name: string;
  weight: number | null;
  stockQuantity: number;
  purchaseOptions: PurchaseOption[];
}

export default function ProductVariantsClient({
  productId,
}: {
  productId: string;
}) {
  const gramsPerOunce = 28.3495;

  const roundAndConvertWeight = (
    value: number,
    fromUnit: WeightUnitOption,
    toUnit: WeightUnitOption
  ) => {
    if (Number.isNaN(value)) return value;
    if (fromUnit === toUnit) return Math.round(value);
    const grams =
      fromUnit === WeightUnitOption.IMPERIAL ? value * gramsPerOunce : value;
    const converted =
      toUnit === WeightUnitOption.IMPERIAL ? grams / gramsPerOunce : grams;
    return Math.round(converted);
  };

  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [weightUnit, setWeightUnit] = useState<WeightUnitOption>(
    WeightUnitOption.METRIC
  );
  const [previousWeightUnit, setPreviousWeightUnit] =
    useState<WeightUnitOption | null>(null);
  const { toast } = useToast();

  // Variant Dialog State
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [variantForm, setVariantForm] = useState({
    name: "",
    weight: "",
    stockQuantity: "",
  });

  // Option Dialog State
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );
  const [optionForm, setOptionForm] = useState({
    type: "ONE_TIME",
    priceInCents: "",
    billingInterval: "MONTH",
    billingIntervalCount: "1",
  });

  const fetchVariants = useCallback(async () => {
    try {
      // We can reuse the product fetch endpoint which includes variants
      const res = await fetch(`/api/admin/products/${productId}`);
      if (!res.ok) throw new Error("Failed to fetch variants");
      const data = await res.json();
      setVariants(data.product.variants);
    } catch (error) {
      console.error("Error fetching variants:", error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const fetchWeightUnit = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings/weight-unit");
      if (!res.ok) return;
      const data = await res.json();
      if (isWeightUnitOption(data?.weightUnit)) {
        setPreviousWeightUnit(data.weightUnit);
        setWeightUnit(data.weightUnit);
      }
    } catch (error) {
      console.error("Error fetching weight unit:", error);
    }
  }, []);

  useEffect(() => {
    fetchVariants();
    fetchWeightUnit();
  }, [fetchVariants, fetchWeightUnit]);

  useEffect(() => {
    if (!previousWeightUnit || previousWeightUnit === weightUnit) return;

    setVariants((current) =>
      current.map((variant) => ({
        ...variant,
        weight:
          variant.weight === null
            ? null
            : roundAndConvertWeight(
                variant.weight,
                previousWeightUnit,
                weightUnit
              ),
      }))
    );

    setVariantForm((form) => {
      const numericWeight = Number(form.weight);
      if (Number.isNaN(numericWeight)) return form;
      return {
        ...form,
        weight: roundAndConvertWeight(
          numericWeight,
          previousWeightUnit,
          weightUnit
        ).toString(),
      };
    });

    setPreviousWeightUnit(weightUnit);
  }, [previousWeightUnit, weightUnit, roundAndConvertWeight]);

  // --- Variant Handlers ---

  const openVariantDialog = (variant?: Variant) => {
    if (variant) {
      setEditingVariant(variant);
      setVariantForm({
        name: variant.name,
        weight: variant.weight?.toString() ?? "",
        stockQuantity: variant.stockQuantity.toString(),
      });
    } else {
      setEditingVariant(null);
      setVariantForm({
        name: "",
        weight: "",
        stockQuantity: "0",
      });
    }
    setIsVariantDialogOpen(true);
  };

  const handleVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingVariant
        ? `/api/admin/variants/${editingVariant.id}`
        : `/api/admin/products/${productId}/variants`;
      const method = editingVariant ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variantForm),
      });

      if (!res.ok) throw new Error("Failed to save variant");

      toast({
        title: "Success",
        description: `Variant ${editingVariant ? "updated" : "created"}`,
      });
      setIsVariantDialogOpen(false);
      fetchVariants();
    } catch {
      toast({
        title: "Error",
        description: "Failed to save variant",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm("Delete this variant?")) return;
    try {
      const res = await fetch(`/api/admin/variants/${variantId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete variant");
      toast({ title: "Success", description: "Variant deleted" });
      fetchVariants();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete variant",
        variant: "destructive",
      });
    }
  };

  // --- Option Handlers ---

  const openOptionDialog = (variantId: string) => {
    setSelectedVariantId(variantId);
    setOptionForm({
      type: "ONE_TIME",
      priceInCents: "",
      billingInterval: "MONTH",
      billingIntervalCount: "1",
    });
    setIsOptionDialogOpen(true);
  };

  const handleOptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantId) return;

    try {
      const res = await fetch(
        `/api/admin/variants/${selectedVariantId}/options`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(optionForm),
        }
      );

      if (!res.ok) throw new Error("Failed to add option");

      toast({ title: "Success", description: "Purchase option added" });
      setIsOptionDialogOpen(false);
      fetchVariants();
    } catch {
      toast({
        title: "Error",
        description: "Failed to add option",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm("Delete this option?")) return;
    try {
      const res = await fetch(`/api/admin/options/${optionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete option");
      toast({ title: "Success", description: "Option deleted" });
      fetchVariants();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete option",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  if (loading) return <div>Loading variants...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Variants & Pricing</h3>
        <Button type="button" onClick={() => openVariantDialog()} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add Variant
        </Button>
      </div>

      {variants.length === 0 ? (
        <div className="text-center py-8 border rounded-md text-muted-foreground bg-muted/10">
          No variants found. Add a variant (e.g. &quot;12oz Bag&quot;) to set
          pricing.
        </div>
      ) : (
        <div className="grid gap-6">
          {variants.map((variant) => (
            <div key={variant.id} className="border rounded-md p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-lg">{variant.name}</h4>
                  <div className="text-sm text-muted-foreground flex gap-4">
                    <span>
                      Weight:{" "}
                      {variant.weight
                        ? `${variant.weight}${weightUnit === WeightUnitOption.IMPERIAL ? " oz" : " g"}`
                        : "-"}
                    </span>
                    <span>Stock: {variant.stockQuantity}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => openVariantDialog(variant)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDeleteVariant(variant.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Purchase Options Table */}
              <div className="bg-muted/30 rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium">Purchase Options</h5>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => openOptionDialog(variant.id)}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add Option
                  </Button>
                </div>

                {variant.purchaseOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No pricing options set.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-8 text-xs">Type</TableHead>
                        <TableHead className="h-8 text-xs">Price</TableHead>
                        <TableHead className="h-8 text-xs">Details</TableHead>
                        <TableHead className="h-8 text-xs text-right">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variant.purchaseOptions.map((option) => (
                        <TableRow
                          key={option.id}
                          className="hover:bg-transparent"
                        >
                          <TableCell className="py-2 text-sm">
                            {option.type === "ONE_TIME" ? (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" /> One-time
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <RefreshCw className="h-3 w-3" /> Subscription
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-2 text-sm font-medium">
                            {formatPrice(option.priceInCents)}
                          </TableCell>
                          <TableCell className="py-2 text-xs text-muted-foreground">
                            {option.type === "SUBSCRIPTION"
                              ? `Every ${option.billingIntervalCount} ${option.billingInterval}(s)`
                              : "-"}
                          </TableCell>
                          <TableCell className="py-2 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={() => handleDeleteOption(option.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Variant Dialog */}
      <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVariant ? "Edit Variant" : "Add Variant"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVariantSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={variantForm.name}
                onChange={(e) =>
                  setVariantForm({ ...variantForm, name: e.target.value })
                }
                placeholder="e.g. 12oz Bag"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Weight (
                  {weightUnit === WeightUnitOption.IMPERIAL
                    ? "ounces"
                    : "grams"}
                  )
                </Label>
                <Input
                  type="number"
                  value={variantForm.weight}
                  onChange={(e) =>
                    setVariantForm({
                      ...variantForm,
                      weight: e.target.value,
                    })
                  }
                  placeholder="enter a integer value"
                />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={variantForm.stockQuantity}
                  onChange={(e) =>
                    setVariantForm({
                      ...variantForm,
                      stockQuantity: e.target.value,
                    })
                  }
                  placeholder="0"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Variant</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Option Dialog */}
      <Dialog open={isOptionDialogOpen} onOpenChange={setIsOptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Purchase Option</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOptionSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={optionForm.type}
                onValueChange={(val) =>
                  setOptionForm({ ...optionForm, type: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONE_TIME">One-time Purchase</SelectItem>
                  <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Price (Cents)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  className="pl-7"
                  value={
                    optionForm.priceInCents
                      ? (parseInt(optionForm.priceInCents) / 100).toString()
                      : ""
                  }
                  onChange={(e) =>
                    setOptionForm({
                      ...optionForm,
                      priceInCents: (
                        parseFloat(e.target.value) * 100
                      ).toString(),
                    })
                  }
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Stored as cents: {optionForm.priceInCents || 0}
              </p>
            </div>

            {optionForm.type === "SUBSCRIPTION" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Interval</Label>
                  <Select
                    value={optionForm.billingInterval}
                    onValueChange={(val) =>
                      setOptionForm({ ...optionForm, billingInterval: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAY">Day</SelectItem>
                      <SelectItem value="WEEK">Week</SelectItem>
                      <SelectItem value="MONTH">Month</SelectItem>
                      <SelectItem value="YEAR">Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Count</Label>
                  <Input
                    type="number"
                    value={optionForm.billingIntervalCount}
                    onChange={(e) =>
                      setOptionForm({
                        ...optionForm,
                        billingIntervalCount: e.target.value,
                      })
                    }
                    min="1"
                    required
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="submit">Add Option</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
