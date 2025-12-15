import { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  /** Icon displayed next to the section title */
  icon?: ReactNode;
  /** Section title */
  title: string;
  /** Description shown below the title */
  description: ReactNode;
  /** Settings fields to display */
  children: ReactNode;
}

/**
 * Consistent settings section wrapper
 * Handles Card, Header, and Content layout with standardized spacing
 */
export function SettingsSection({
  icon,
  title,
  description,
  children,
}: SettingsSectionProps) {
  const descriptionIsString = typeof description === "string";
  const descriptionClassName = cn(
    "text-muted-foreground text-sm leading-normal font-normal group-has-[[data-orientation=horizontal]]/field:text-balance",
    "last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5",
    "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4"
  );

  return (
    <Card>
      <CardHeader className="pb-8">
        <Field orientation="vertical">
          <FieldContent>
            <FieldTitle className="text-base font-semibold flex items-center gap-2">
              {icon}
              {title}
            </FieldTitle>
            {descriptionIsString ? (
              <FieldDescription>{description}</FieldDescription>
            ) : (
              <div className={descriptionClassName}>{description}</div>
            )}
          </FieldContent>
        </Field>
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  );
}
