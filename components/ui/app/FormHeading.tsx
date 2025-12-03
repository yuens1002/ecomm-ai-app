import { FieldLabel, FieldError } from "@/components/ui/field";

type ValidationType = "dirty" | "required" | "error";

interface FormHeadingProps {
  /** ID of the form element this label is for (optional for standalone labels) */
  htmlFor?: string;
  /** Label text to display */
  label: string;
  /** Whether the field value has been modified */
  isDirty?: boolean;
  /** Type of validation indicator to show */
  validationType?: ValidationType;
  /** Custom error message to display */
  errorMessage?: string;
  /** Whether the field is required (shows * indicator) */
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

  // If htmlFor is provided, render as proper label; otherwise just styled text
  const LabelContent = (
    <>
      {label}
      {required && <span className="text-destructive ml-1">*</span>}
    </>
  );

  return (
    <div className="flex items-center justify-start min-h-5 gap-2">
      {htmlFor ? (
        <FieldLabel htmlFor={htmlFor}>{LabelContent}</FieldLabel>
      ) : (
        <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {LabelContent}
        </span>
      )}
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
