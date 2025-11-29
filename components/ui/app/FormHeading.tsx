import { FieldLabel, FieldError } from "@/components/ui/field";

type ValidationType = "dirty" | "required" | "error";

interface FormHeadingProps {
  htmlFor: string;
  label: string;
  isDirty?: boolean;
  validationType?: ValidationType;
  errorMessage?: string;
  required?: boolean;
}

const validationStyles = {
  dirty: {
    className:
      "text-sm text-amber-600 dark:text-amber-500 flex items-center gap-2",
    dotColor: "bg-amber-500",
    defaultMessage: "Unsaved changes",
  },
  required: {
    className: "text-sm text-destructive flex items-center gap-2",
    dotColor: "bg-destructive",
    defaultMessage: "Required field",
  },
  error: {
    className: "text-sm text-destructive flex items-center gap-2",
    dotColor: "bg-destructive",
    defaultMessage: "Invalid value",
  },
};

export function FormHeading({
  htmlFor,
  label,
  isDirty = false,
  validationType = "dirty",
  errorMessage,
  required = false,
}: FormHeadingProps) {
  const style = validationStyles[validationType];
  const message = errorMessage || style.defaultMessage;
  const showIndicator = isDirty || (validationType === "required" && required);

  return (
    <div className="flex items-center justify-start min-h-5 gap-2">
      <FieldLabel htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </FieldLabel>
      {showIndicator && (
        <FieldError className={style.className}>
          <div
            className={`w-2 h-2 rounded-full ${style.dotColor} animate-pulse`}
          />
          {message}
        </FieldError>
      )}
    </div>
  );
}
