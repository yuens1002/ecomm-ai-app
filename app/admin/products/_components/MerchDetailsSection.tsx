"use client";

import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  FieldSet,
  FieldLegend,
  FieldGroup,
  FieldDescription,
} from "@/components/ui/field";

export interface MerchDetailRow {
  label: string;
  value: string;
}

interface MerchDetailsSectionProps {
  details: MerchDetailRow[];
  onChange: (details: MerchDetailRow[]) => void;
  hasError?: boolean;
}

function isIncompleteRow(row: MerchDetailRow): boolean {
  const hasLabel = row.label.trim() !== "";
  const hasValue = row.value.trim() !== "";
  return (hasLabel && !hasValue) || (!hasLabel && hasValue);
}

export function MerchDetailsSection({
  details,
  onChange,
  hasError = false,
}: MerchDetailsSectionProps) {
  const addRow = () => {
    onChange([...details, { label: "", value: "" }]);
  };

  const removeRow = (index: number) => {
    if (details.length <= 1) return;
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

  const moveRow = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= details.length) return;
    const updated = [...details];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  };

  const hasIncompleteRows =
    hasError && details.some((row) => isIncompleteRow(row));

  return (
    <FieldSet>
      <div className="flex items-center justify-between">
        <div>
          <FieldLegend>Product Details</FieldLegend>
          <FieldDescription>
            Label-description pairs (e.g., Material: Ceramic)
          </FieldDescription>
        </div>
        <Button type="button" size="sm" onClick={addRow}>
          <Plus className="mr-2 h-4 w-4" /> Add Detail
        </Button>
      </div>

      <FieldGroup>
        {details.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-lg text-sm text-muted-foreground">
            No details yet. Add a detail to describe this product.
          </div>
        ) : (
          <div className="space-y-3">
            {details.map((row, index) => {
              const incomplete = hasError && isIncompleteRow(row);

              return (
                <div key={index} className="flex gap-3 items-center">
                  <InputGroup
                    className={`flex-1 flex-col sm:flex-row h-auto sm:h-9 items-stretch sm:items-center ${incomplete ? "ring-2 ring-destructive/50 border-destructive" : ""}`}
                  >
                    <div className="flex items-center flex-1 sm:flex-[3] min-w-0">
                      <InputGroupAddon className="text-xs italic font-mono font-normal">
                        Label
                      </InputGroupAddon>
                      <InputGroupInput
                        value={row.label}
                        onChange={(e) =>
                          updateRow(index, "label", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                    <div className="border-t sm:border-t-0 sm:border-l border-input w-full sm:w-auto sm:self-stretch" />
                    <div className="flex items-center flex-1 sm:flex-[7] min-w-0">
                      <InputGroupAddon className="text-xs italic font-mono font-normal">
                        Description
                      </InputGroupAddon>
                      <InputGroupInput
                        value={row.value}
                        onChange={(e) =>
                          updateRow(index, "value", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                  </InputGroup>

                  <div className="flex gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === 0}
                      onClick={() => moveRow(index, "up")}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === details.length - 1}
                      onClick={() => moveRow(index, "down")}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={details.length <= 1}
                      onClick={() => removeRow(index)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasIncompleteRows && (
          <p className="text-sm text-destructive">
            All details must have both a label and description.
          </p>
        )}
      </FieldGroup>
    </FieldSet>
  );
}
