"use client";

import { cn } from "@/lib/utils";
import { Check, Pencil, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

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

type PriceField = "priceInCents" | "salePriceInCents";

type EditingField =
  | { type: "stock"; variantId: string }
  | { type: "price"; optionId: string; field: PriceField }
  | null;

interface VariantCellProps {
  variants: Variant[];
  onStockUpdate: (variantId: string, stock: number) => Promise<void>;
  onPriceUpdate: (
    optionId: string,
    priceInCents: number,
    field?: PriceField
  ) => Promise<void>;
}

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

function getEffectivePrice(opt: PurchaseOption): number {
  return opt.salePriceInCents ?? opt.priceInCents;
}

function getEffectivePriceField(opt: PurchaseOption): PriceField {
  return opt.salePriceInCents != null ? "salePriceInCents" : "priceInCents";
}

export function VariantCell({
  variants,
  onStockUpdate,
  onPriceUpdate,
}: VariantCellProps) {
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = useCallback(
    (field: NonNullable<EditingField>, currentValue: string) => {
      setEditingField(field);
      setEditValue(currentValue);
      setTimeout(() => inputRef.current?.select(), 0);
    },
    []
  );

  const cancelEdit = useCallback(() => {
    setEditingField(null);
    setEditValue("");
  }, []);

  const confirmEdit = useCallback(async () => {
    if (!editingField) return;
    const num = Number(editValue);
    if (isNaN(num) || num < 0) {
      cancelEdit();
      return;
    }

    try {
      if (editingField.type === "stock") {
        await onStockUpdate(editingField.variantId, Math.round(num));
      } else {
        await onPriceUpdate(
          editingField.optionId,
          Math.round(num * 100),
          editingField.field
        );
      }
    } catch {
      // Error handled by parent (toast)
    }
    setEditingField(null);
    setEditValue("");
  }, [editingField, editValue, onStockUpdate, onPriceUpdate, cancelEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit();
      }
    },
    [confirmEdit, cancelEdit]
  );

  if (!variants || variants.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div className="grid gap-3 py-1">
      {variants.map((v) => {
        const isEditingStock =
          editingField?.type === "stock" &&
          editingField.variantId === v.id;

        return (
          <div key={v.id} className="group/variant">
            {/* Two-column row: name (left) + stock (right) */}
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-sm whitespace-nowrap">
                {v.name}
              </span>
              <div className="flex items-center gap-1">
                {isEditingStock ? (
                  <span className="flex items-center gap-1">
                    <input
                      ref={inputRef}
                      type="number"
                      min={0}
                      className="w-16 h-6 text-xs rounded border bg-background px-1.5 text-right focus:outline-none focus:ring-1 focus:ring-ring"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={() => cancelEdit()}
                    />
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        confirmEdit();
                      }}
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        cancelEdit();
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : (
                  <>
                    <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded whitespace-nowrap">
                      Stock: {v.stock}
                    </span>
                    <button
                      type="button"
                      className={cn(
                        "rounded-sm p-0.5 outline-none transition-opacity text-muted-foreground hover:text-foreground",
                        "opacity-100 md:opacity-0 md:group-hover/row:opacity-100 focus-visible:opacity-100",
                        "focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                      )}
                      onClick={() =>
                        startEdit(
                          { type: "stock", variantId: v.id },
                          String(v.stock)
                        )
                      }
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
            {/* Two-column options: label (left) + price (right) */}
            <div className="mt-1 grid gap-1 pl-2 border-l-2 border-muted">
              {v.options.map((opt) => {
                const isEditingPrice =
                  editingField?.type === "price" &&
                  editingField.optionId === opt.id;
                const effectivePrice = getEffectivePrice(opt);
                const effectiveField = getEffectivePriceField(opt);
                const hasSalePrice = opt.salePriceInCents != null;

                return (
                  <div
                    key={opt.id}
                    className="text-xs flex items-center justify-between gap-4 group/option"
                  >
                    <span className="text-muted-foreground whitespace-nowrap">
                      {opt.type === "ONE_TIME"
                        ? "One-time"
                        : `Sub (${opt.billingIntervalCount} ${opt.billingInterval?.toLowerCase()})`}
                    </span>
                    <div className="flex items-center gap-1">
                      {isEditingPrice ? (
                        <span className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">$</span>
                          <input
                            ref={inputRef}
                            type="number"
                            min={0}
                            step={0.01}
                            className="w-16 h-5 text-xs rounded border bg-background px-1.5 text-right font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={() => cancelEdit()}
                          />
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              confirmEdit();
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              cancelEdit();
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ) : (
                        <>
                          {hasSalePrice && (
                            <span className="font-mono text-muted-foreground/50 line-through whitespace-nowrap">
                              {formatPrice(opt.priceInCents)}
                            </span>
                          )}
                          <span className={cn(
                            "font-mono font-medium whitespace-nowrap",
                            hasSalePrice && "text-destructive"
                          )}>
                            {formatPrice(effectivePrice)}
                          </span>
                          <button
                            type="button"
                            className={cn(
                              "rounded-sm p-0.5 outline-none transition-opacity text-muted-foreground hover:text-foreground",
                              "opacity-100 md:opacity-0 md:group-hover/row:opacity-100 focus-visible:opacity-100",
                              "focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                            )}
                            onClick={() =>
                              startEdit(
                                {
                                  type: "price",
                                  optionId: opt.id,
                                  field: effectiveField,
                                },
                                String(effectivePrice / 100)
                              )
                            }
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
