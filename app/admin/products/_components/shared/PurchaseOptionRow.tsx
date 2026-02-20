"use client";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import type { ComponentProps } from "react";

type InputProps = ComponentProps<typeof InputGroupInput>;

interface BaseOptionRowProps {
  priceInputProps: InputProps;
  salePriceInputProps: InputProps;
  onDelete?: () => void;
  deleteDisabled?: boolean;
}

export type OneTimeOptionRowProps = BaseOptionRowProps;

export interface SubscriptionOptionRowProps extends BaseOptionRowProps {
  cadenceCountInputProps: InputProps;
  cadenceIntervalValue?: string;
  cadenceIntervalDefaultValue?: string;
  onCadenceIntervalChange?: (val: string) => void;
}

function PriceRow({
  priceInputProps,
  salePriceInputProps,
}: Pick<BaseOptionRowProps, "priceInputProps" | "salePriceInputProps">) {
  return (
    <div className="flex gap-2">
      <InputGroup className="flex-1 h-8">
        <InputGroupAddon align="inline-start">
          <span className="font-mono text-xs italic text-muted-foreground">$</span>
        </InputGroupAddon>
        <InputGroupInput type="number" step="0.01" {...priceInputProps} />
      </InputGroup>

      <InputGroup className="flex-1 h-8">
        <InputGroupAddon align="inline-start">
          <span className="font-mono text-xs italic text-muted-foreground">sale $</span>
        </InputGroupAddon>
        <InputGroupInput
          type="number"
          step="0.01"
          placeholder="—"
          {...salePriceInputProps}
        />
      </InputGroup>
    </div>
  );
}

export function OneTimeOptionRow({
  priceInputProps,
  salePriceInputProps,
  onDelete,
  deleteDisabled,
}: OneTimeOptionRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 text-sm">
      <span className="text-xs font-medium uppercase text-muted-foreground w-16 shrink-0">
        ONE-TIME
      </span>

      <div className="flex-1 space-y-2 min-w-0 [&_input]:!text-sm">
        <PriceRow
          priceInputProps={priceInputProps}
          salePriceInputProps={salePriceInputProps}
        />
      </div>

      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onDelete}
          disabled={deleteDisabled}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function SubscriptionOptionRow({
  priceInputProps,
  salePriceInputProps,
  cadenceCountInputProps,
  cadenceIntervalValue,
  cadenceIntervalDefaultValue,
  onCadenceIntervalChange,
  onDelete,
  deleteDisabled,
}: SubscriptionOptionRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 text-sm">
      <span className="text-xs font-medium uppercase text-muted-foreground w-16 shrink-0">
        SUB
      </span>

      <div className="flex-1 space-y-2 min-w-0 [&_input]:!text-sm">
        <PriceRow
          priceInputProps={priceInputProps}
          salePriceInputProps={salePriceInputProps}
        />

        <InputGroup className="h-8">
          <InputGroupAddon align="inline-start">
            <span className="font-mono text-xs italic text-muted-foreground">every</span>
          </InputGroupAddon>
          <InputGroupInput type="number" {...cadenceCountInputProps} />
          <InputGroupAddon align="inline-end">
            <Select
              value={cadenceIntervalValue}
              defaultValue={cadenceIntervalDefaultValue}
              onValueChange={onCadenceIntervalChange}
            >
              <SelectTrigger className="h-7 border-0 shadow-none bg-transparent px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAY">day/s</SelectItem>
                <SelectItem value="WEEK">wk/s</SelectItem>
                <SelectItem value="MONTH">mo/s</SelectItem>
              </SelectContent>
            </Select>
          </InputGroupAddon>
        </InputGroup>
      </div>

      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onDelete}
          disabled={deleteDisabled}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
