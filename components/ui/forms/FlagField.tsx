import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldLabel,
  FieldTitle,
  FieldDescription,
} from "@/components/ui/field";

interface FlagFieldProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function FlagField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: FlagFieldProps) {
  return (
    <div className="space-y-1.5 [&+&]:mt-4">
      <Field orientation="horizontal">
        <Checkbox
          id={id}
          checked={checked}
          aria-disabled={disabled}
          className={disabled ? "cursor-not-allowed opacity-50" : undefined}
          onCheckedChange={(val) => {
            if (disabled) return;
            onCheckedChange(val === true);
          }}
        />
        <FieldLabel htmlFor={id}>
          <FieldTitle>{label}</FieldTitle>
        </FieldLabel>
      </Field>
      <FieldDescription>{description}</FieldDescription>
    </div>
  );
}
