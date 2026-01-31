import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export type FormCardProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * Visual variant of the card
   * @default "default"
   */
  variant?: "default" | "muted";
};

/**
 * FormCard component for admin forms
 * Provides consistent Card-like styling for form sections
 */
export function FormCard({
  className,
  variant = "default",
  children,
  ...props
}: FormCardProps) {
  return (
    <Card
      className={cn(
        "bg-card text-card-foreground rounded-xl border p-6 shadow-sm",
        variant === "muted" && "bg-muted/30",
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
}
