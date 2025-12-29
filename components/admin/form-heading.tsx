import * as React from "react";
import {
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

interface FormHeadingProps
  extends React.ComponentPropsWithoutRef<typeof FieldLabel> {
  required?: boolean;
  error?: boolean | string;
  description?: string;
}

export const FormHeading = React.forwardRef<
  React.ElementRef<typeof FieldLabel>,
  FormHeadingProps
>(({ className, children, required, error, description, ...props }, ref) => {
  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : undefined;

  return (
    <>
      <FieldLabel ref={ref} className={className} {...props}>
        {children}
        {required && <span className="ml-1 text-destructive">*</span>}
      </FieldLabel>
      {description && !hasError && (
        <FieldDescription>{description}</FieldDescription>
      )}
      {errorMessage && <FieldError>{errorMessage}</FieldError>}
    </>
  );
});
FormHeading.displayName = "FormHeading";
