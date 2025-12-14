import { Control } from "react-hook-form";
import { FormField } from "@/components/ui/form";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormCard } from "@/components/ui/app/FormCard";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { ROAST_LEVELS } from "@/lib/productEnums";

type ProductCoffeeDetailsSectionProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  show?: boolean;
};

export function ProductCoffeeDetailsSection({
  control,
  show = true,
}: ProductCoffeeDetailsSectionProps) {
  if (!show) return null;

  return (
    <FormCard variant="muted">
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          ☕ Coffee Details
        </h3>
        <p className="text-sm text-muted-foreground">
          Coffee-specific attributes and characteristics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="roastLevel"
          render={({ field, fieldState }) => (
            <Field>
              <FormHeading
                htmlFor="roastLevel"
                label="Roast Level"
                required
                validationType={fieldState.error ? "error" : undefined}
                errorMessage={fieldState.error?.message}
              />
              <Select
                value={field.value}
                onValueChange={(val) => field.onChange(val)}
              >
                <SelectTrigger id="roastLevel">
                  <SelectValue placeholder="Select roast level" />
                </SelectTrigger>
                <SelectContent>
                  {ROAST_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level.charAt(0) + level.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />

        <FormField
          control={control}
          name="origin"
          render={({ field, fieldState }) => (
            <Field>
              <FormHeading
                htmlFor="origin"
                label="Origin(s)"
                required
                validationType={fieldState.error ? "error" : undefined}
                errorMessage={fieldState.error?.message}
              />
              <Input
                id="origin"
                {...field}
                placeholder="e.g., Colombia, Ethiopia"
              />
            </Field>
          )}
        />

        <FormField
          control={control}
          name="variety"
          render={({ field, fieldState }) => (
            <Field>
              <FormHeading
                htmlFor="variety"
                label="Variety"
                validationType={fieldState.error ? "error" : undefined}
                errorMessage={fieldState.error?.message}
              />
              <Input
                id="variety"
                {...field}
                placeholder="e.g., Bourbon, Typica"
              />
            </Field>
          )}
        />

        <FormField
          control={control}
          name="altitude"
          render={({ field, fieldState }) => (
            <Field>
              <FormHeading
                htmlFor="altitude"
                label="Altitude"
                validationType={fieldState.error ? "error" : undefined}
                errorMessage={fieldState.error?.message}
              />
              <Input id="altitude" {...field} placeholder="e.g., 1800m" />
            </Field>
          )}
        />

        <FormField
          control={control}
          name="tastingNotes"
          render={({ field, fieldState }) => (
            <Field className="md:col-span-2">
              <FormHeading
                htmlFor="tastingNotes"
                label="Tasting Notes"
                validationType={fieldState.error ? "error" : undefined}
                errorMessage={fieldState.error?.message}
              />
              <Input
                id="tastingNotes"
                {...field}
                placeholder="e.g., Chocolate, Caramel, Citrus"
              />
            </Field>
          )}
        />
      </div>
    </FormCard>
  );
}
