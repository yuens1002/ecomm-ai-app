"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormCard } from "@/components/ui/forms/FormCard";

export interface MerchDetailRow {
  label: string;
  value: string;
}

interface ProductMerchDetailsSectionProps {
  show?: boolean;
  details: MerchDetailRow[];
  onChange: (details: MerchDetailRow[]) => void;
}

export function ProductMerchDetailsSection({
  show = true,
  details,
  onChange,
}: ProductMerchDetailsSectionProps) {
  if (!show) return null;

  const addRow = () => {
    onChange([...details, { label: "", value: "" }]);
  };

  const removeRow = (index: number) => {
    onChange(details.filter((_, i) => i !== index));
  };

  const updateRow = (
    index: number,
    field: "label" | "value",
    newValue: string
  ) => {
    const updated = details.map((row, i) =>
      i === index ? { ...row, [field]: newValue } : row
    );
    onChange(updated);
  };

  return (
    <FormCard variant="muted">
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          Product Details
        </h3>
        <p className="text-sm text-muted-foreground">
          Key-value pairs describing this product (e.g., Material: Ceramic)
        </p>
      </div>

      <div className="space-y-3">
        {details.map((row, index) => (
          <div key={index} className="flex items-center gap-3">
            <Input
              placeholder="Label (e.g., Material)"
              value={row.label}
              onChange={(e) => updateRow(index, "label", e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Value (e.g., Ceramic)"
              value={row.value}
              onChange={(e) => updateRow(index, "value", e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeRow(index)}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          className="mt-2"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Detail
        </Button>
      </div>
    </FormCard>
  );
}
