import { cn } from "@/lib/utils";

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Custom max-width class (e.g. "md:max-w-[72ch]"). Defaults to "md:max-w-[48ch]". */
  maxWidth?: string;
}

/**
 * FormField — constrained-width wrapper for Label + Input + description groups.
 *
 * Applies a responsive max-width to keep input fields from stretching
 * across wide viewports. Default is 48ch; pass `maxWidth` to override.
 *
 * Usage:
 *   <FormField>
 *     <Label htmlFor="name">Name</Label>
 *     <Input id="name" ... />
 *   </FormField>
 *
 *   <FormField maxWidth="md:max-w-[72ch]">
 *     <Label>Wider field</Label>
 *     <Input ... />
 *   </FormField>
 */
export function FormField({
  className,
  maxWidth = "md:max-w-[48ch]",
  children,
  ...props
}: FormFieldProps) {
  return (
    <div
      className={cn("space-y-2", maxWidth, className)}
      {...props}
    >
      {children}
    </div>
  );
}
