"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useState, useEffect } from "react";

import {
  OneTimeOptionRow,
  SubscriptionOptionRow,
} from "./shared/PurchaseOptionRow";

interface PurchaseOption {
  id: string;
  type: "ONE_TIME" | "SUBSCRIPTION";
  priceInCents: number;
  salePriceInCents?: number | null;
  billingInterval?: string | null;
  billingIntervalCount?: number | null;
}

interface Variant {
  id: string;
  name: string;
  stock: number;
  options: PurchaseOption[];
}

interface EditVariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  variants: Variant[];
  onStockUpdate: (variantId: string, stock: number) => Promise<void>;
  onOptionUpdate: (
    optionId: string,
    data: {
      priceInCents?: number;
      salePriceInCents?: number | null;
      billingIntervalCount?: number;
      billingInterval?: string;
    }
  ) => Promise<void>;
  onOptionDelete: (optionId: string, variantId: string) => Promise<void>;
}

interface LocalOptionState {
  price: string;
  salePrice: string;
  billingIntervalCount: string;
  billingInterval: string;
}

interface LocalVariantState {
  stock: string;
  options: Record<string, LocalOptionState>;
  deletedOptionIds: string[];
}

export function EditVariantDialog({
  open,
  onOpenChange,
  productName,
  variants,
  onStockUpdate,
  onOptionUpdate,
  onOptionDelete,
}: EditVariantDialogProps) {
  const [localState, setLocalState] = useState<
    Record<string, LocalVariantState>
  >({});
  const [saving, setSaving] = useState(false);

  // Reset local state when dialog opens
  useEffect(() => {
    if (open) {
      const state: Record<string, LocalVariantState> = {};
      for (const v of variants) {
        state[v.id] = {
          stock: String(v.stock),
          options: Object.fromEntries(
            v.options.map((o) => [
              o.id,
              {
                price: String(o.priceInCents / 100),
                salePrice: o.salePriceInCents
                  ? String(o.salePriceInCents / 100)
                  : "",
                billingIntervalCount: String(o.billingIntervalCount ?? 1),
                billingInterval: o.billingInterval ?? "MONTH",
              },
            ])
          ),
          deletedOptionIds: [],
        };
      }
      setLocalState(state);
    }
  }, [open, variants]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises: Promise<void>[] = [];

      for (const v of variants) {
        const local = localState[v.id];
        if (!local) continue;

        // Stock
        const newStock = Math.round(Number(local.stock));
        if (!isNaN(newStock) && newStock >= 0 && newStock !== v.stock) {
          promises.push(onStockUpdate(v.id, newStock));
        }

        // Deleted options
        for (const optionId of local.deletedOptionIds) {
          promises.push(onOptionDelete(optionId, v.id));
        }

        // Updated options
        for (const opt of v.options) {
          if (local.deletedOptionIds.includes(opt.id)) continue;
          const localOpt = local.options[opt.id];
          if (!localOpt) continue;

          const updates: Parameters<typeof onOptionUpdate>[1] = {};

          const newCents = Math.round(Number(localOpt.price) * 100);
          if (!isNaN(newCents) && newCents >= 0 && newCents !== opt.priceInCents) {
            updates.priceInCents = newCents;
          }

          const salePriceVal = localOpt.salePrice;
          const newSaleCents = salePriceVal
            ? Math.round(Number(salePriceVal) * 100)
            : null;
          if (newSaleCents !== (opt.salePriceInCents ?? null)) {
            updates.salePriceInCents = newSaleCents;
          }

          if (opt.type === "SUBSCRIPTION") {
            const newCount = parseInt(localOpt.billingIntervalCount) || 1;
            if (newCount !== (opt.billingIntervalCount ?? 1)) {
              updates.billingIntervalCount = newCount;
            }
            if (localOpt.billingInterval !== (opt.billingInterval ?? "MONTH")) {
              updates.billingInterval = localOpt.billingInterval;
            }
          }

          if (Object.keys(updates).length > 0) {
            promises.push(onOptionUpdate(opt.id, updates));
          }
        }
      }

      await Promise.all(promises);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const updateStock = (variantId: string, value: string) => {
    setLocalState((prev) => ({
      ...prev,
      [variantId]: { ...prev[variantId], stock: value },
    }));
  };

  const updateOptionField = (
    variantId: string,
    optionId: string,
    field: keyof LocalOptionState,
    value: string
  ) => {
    setLocalState((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        options: {
          ...prev[variantId].options,
          [optionId]: {
            ...prev[variantId].options[optionId],
            [field]: value,
          },
        },
      },
    }));
  };

  const markOptionDeleted = (variantId: string, optionId: string) => {
    setLocalState((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        deletedOptionIds: [
          ...prev[variantId].deletedOptionIds,
          optionId,
        ],
      },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Variants</DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          {variants.map((v) => {
            const local = localState[v.id];
            if (!local) return null;

            const visibleOptions = v.options.filter(
              (o) => !local.deletedOptionIds.includes(o.id)
            );

            return (
              <div key={v.id} className="flex flex-col gap-3">
                <span className="font-semibold text-sm">{v.name}</span>
                <InputGroup>
                  <InputGroupAddon align="inline-start" className="border-r-0">
                    <span className="font-mono text-xs italic text-muted-foreground">
                      Stock
                    </span>
                  </InputGroupAddon>
                  <InputGroupInput
                    type="number"
                    min={0}
                    value={local.stock}
                    onChange={(e) => updateStock(v.id, e.target.value)}
                  />
                </InputGroup>
                {visibleOptions.length > 0 && (
                  <div className="divide-y">
                    {visibleOptions.map((opt) => {
                      const localOpt = local.options[opt.id];
                      if (!localOpt) return null;

                      const priceInputProps = {
                        value: localOpt.price,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                          updateOptionField(v.id, opt.id, "price", e.target.value),
                      };

                      const salePriceInputProps = {
                        value: localOpt.salePrice,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                          updateOptionField(v.id, opt.id, "salePrice", e.target.value),
                      };

                      if (opt.type === "SUBSCRIPTION") {
                        return (
                          <SubscriptionOptionRow
                            key={opt.id}
                            priceInputProps={priceInputProps}
                            salePriceInputProps={salePriceInputProps}
                            cadenceCountInputProps={{
                              value: localOpt.billingIntervalCount,
                              onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                                updateOptionField(
                                  v.id,
                                  opt.id,
                                  "billingIntervalCount",
                                  e.target.value
                                ),
                            }}
                            cadenceIntervalValue={localOpt.billingInterval}
                            onCadenceIntervalChange={(val) =>
                              updateOptionField(v.id, opt.id, "billingInterval", val)
                            }
                            onDelete={() => markOptionDeleted(v.id, opt.id)}
                            deleteDisabled={saving}
                          />
                        );
                      }

                      return (
                        <OneTimeOptionRow
                          key={opt.id}
                          priceInputProps={priceInputProps}
                          salePriceInputProps={salePriceInputProps}
                          onDelete={() => markOptionDeleted(v.id, opt.id)}
                          deleteDisabled={saving}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
