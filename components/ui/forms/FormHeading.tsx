import { FieldLabel, FieldError } from "@/components/ui/field";
import { useDebouncedDirty } from "@/hooks/useDebouncedDirty";

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
  /** Delay in ms before showing "unsaved changes" indicator (default: 30000ms) */
  dirtyDelay?: number;
  /** Explicit status message to show immediately (overrides delay/dirty logic) */
  statusMessage?: string;
  /** Visual style for statusMessage (defaults to dirty style) */
  statusType?: ValidationType;
  /** Optional action link/element to display inline at the end (e.g., "Forgot password?") */
  action?: React.ReactNode;
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
  dirtyDelay = 30000,
  statusMessage,
  statusType,
  action,
}: FormHeadingProps) {
  // Delay showing dirty indicator so it only appears if user forgets to save
  const showDirty = useDebouncedDirty(isDirty, dirtyDelay);

  const indicatorType = statusMessage ? statusType || "dirty" : validationType;

  const style = validationStyles[indicatorType];
  const message = statusMessage || errorMessage || style.defaultMessage;
  // Show indicator when: explicit status message provided OR dirty (after delay) OR required indicator OR error
  const showIndicator =
    !!statusMessage ||
    showDirty ||
    (validationType === "required" && required) ||
    (validationType === "error" && errorMessage);

  // If htmlFor is provided, render as proper label; otherwise just styled text
  const LabelContent = (
    <>
      {label}
      {required && <span className="text-destructive ml-1">*</span>}
    </>
  );

  return (
    <div className="flex items-center justify-start gap-2">
      <div className="flex items-center gap-2">
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
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}
