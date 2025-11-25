import { FieldLabel, FieldError } from "@/components/ui/field";

interface FormHeadingProps {
  htmlFor: string;
  label: string;
  isDirty?: boolean;
  errorMessage?: string;
}

export function FormHeading({
  htmlFor,
  label,
  isDirty = false,
  errorMessage = "Unsaved changes",
}: FormHeadingProps) {
  return (
    <div className="flex items-center justify-start min-h-5 gap-2">
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {isDirty && (
        <FieldError className="text-sm text-amber-600 dark:text-amber-500 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          {errorMessage}
        </FieldError>
      )}
    </div>
  );
}
