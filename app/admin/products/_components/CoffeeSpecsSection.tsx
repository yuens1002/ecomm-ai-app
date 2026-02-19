"use client";

import { RoastLevel } from "@prisma/client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FieldSet,
  FieldLegend,
  FieldGroup,
  FieldDescription,
  Field,
} from "@/components/ui/field";
import { FormHeading } from "@/components/ui/forms/FormHeading";

export interface CoffeeSpecsValues {
  roastLevel: RoastLevel;
  origin: string; // comma-separated
  variety: string;
  altitude: string;
  tastingNotes: string; // comma-separated
  processing: string;
}

interface CoffeeSpecsSectionProps {
  values: CoffeeSpecsValues;
  onChange: (values: CoffeeSpecsValues) => void;
}

export function CoffeeSpecsSection({
  values,
  onChange,
}: CoffeeSpecsSectionProps) {
  const update = (partial: Partial<CoffeeSpecsValues>) => {
    onChange({ ...values, ...partial });
  };

  return (
    <FieldSet>
      <FieldLegend>Coffee Details</FieldLegend>
      <FieldDescription>
        Roast profile, origin, and tasting notes
      </FieldDescription>

      <FieldGroup>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Roast Level */}
          <Field>
            <FormHeading htmlFor="roastLevel" label="Roast Level" required />
            <Select
              value={values.roastLevel}
              onValueChange={(val) => update({ roastLevel: val as RoastLevel })}
            >
              <SelectTrigger id="roastLevel">
                <SelectValue placeholder="Select roast level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LIGHT">Light</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="DARK">Dark</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {/* Origin */}
          <Field>
            <FormHeading htmlFor="origin" label="Origin" required validationType={!values.origin.trim() ? "required" : undefined} />
            <Input
              id="origin"
              value={values.origin}
              onChange={(e) => update({ origin: e.target.value })}
              placeholder="e.g., Brazil, Colombia"
            />
          </Field>

          {/* Variety */}
          <Field>
            <FormHeading htmlFor="variety" label="Variety" />
            <Input
              id="variety"
              value={values.variety}
              onChange={(e) => update({ variety: e.target.value })}
              placeholder="e.g., Bourbon, Typica"
            />
          </Field>

          {/* Altitude */}
          <Field>
            <FormHeading htmlFor="altitude" label="Altitude" />
            <Input
              id="altitude"
              value={values.altitude}
              onChange={(e) => update({ altitude: e.target.value })}
              placeholder="e.g., 1800m"
            />
          </Field>

          {/* Tasting Notes */}
          <Field>
            <FormHeading htmlFor="tastingNotes" label="Tasting Notes" />
            <Input
              id="tastingNotes"
              value={values.tastingNotes}
              onChange={(e) => update({ tastingNotes: e.target.value })}
              placeholder="e.g., Dark Chocolate, Caramel"
            />
          </Field>

          {/* Processing */}
          <Field>
            <FormHeading htmlFor="processing" label="Processing" />
            <Input
              id="processing"
              value={values.processing}
              onChange={(e) => update({ processing: e.target.value })}
              placeholder="e.g., Natural (Dry Process)"
            />
          </Field>
        </div>
      </FieldGroup>
    </FieldSet>
  );
}
