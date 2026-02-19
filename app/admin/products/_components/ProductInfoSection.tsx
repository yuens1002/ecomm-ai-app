"use client";

import { NameSlugField } from "@/app/admin/_components/cms/fields/NameSlugField";
import { FormHeading } from "@/components/ui/forms/FormHeading";
import {
  FieldGroup,
  FieldDescription,
  Field,
  FieldLabel,
  FieldContent,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
export interface ProductInfoValues {
  name: string;
  slug: string;
  heading: string;
  description: string;
  isOrganic: boolean;
  isFeatured: boolean;
  isDisabled: boolean;
}

interface ProductInfoSectionProps {
  values: ProductInfoValues;
  onChange: (values: ProductInfoValues) => void;
  showValidation?: boolean;
}

export function ProductInfoSection({
  values,
  onChange,
  showValidation = true,
}: ProductInfoSectionProps) {
  const update = (partial: Partial<ProductInfoValues>) => {
    onChange({ ...values, ...partial });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-6">
      {/* Left column: Name/Slug, Flags */}
      <FieldGroup>
        <NameSlugField
          name={values.name}
          slug={values.slug}
          onChange={({ name, slug }) => update({ name, slug })}
          showValidation={showValidation}
        />

        <Field>
          <FormHeading label="Flags" />
          <div className="flex flex-col gap-3">
            <Field orientation="horizontal">
              <Checkbox
                id="isOrganic"
                checked={values.isOrganic}
                onCheckedChange={(checked) =>
                  update({ isOrganic: checked === true })
                }
              />
              <FieldLabel htmlFor="isOrganic">
                <FieldContent>
                  <FieldTitle>Organic</FieldTitle>
                  <FieldDescription>Mark as certified organic product</FieldDescription>
                </FieldContent>
              </FieldLabel>
            </Field>

            <Field orientation="horizontal">
              <Checkbox
                id="isFeatured"
                checked={values.isFeatured}
                onCheckedChange={(checked) =>
                  update({ isFeatured: checked === true })
                }
              />
              <FieldLabel htmlFor="isFeatured">
                <FieldContent>
                  <FieldTitle>Featured</FieldTitle>
                  <FieldDescription>Show on homepage and featured sections</FieldDescription>
                </FieldContent>
              </FieldLabel>
            </Field>

            <Field orientation="horizontal">
              <Checkbox
                id="isDisabled"
                checked={values.isDisabled}
                onCheckedChange={(checked) =>
                  update({ isDisabled: checked === true })
                }
              />
              <FieldLabel htmlFor="isDisabled">
                <FieldContent>
                  <FieldTitle>Disabled</FieldTitle>
                  <FieldDescription>Hide from storefront</FieldDescription>
                </FieldContent>
              </FieldLabel>
            </Field>
          </div>
        </Field>
      </FieldGroup>

      {/* Right column: Heading, Description */}
      <FieldGroup>
        <Field>
          <FormHeading htmlFor="heading" label="Heading" />
          <Input
            id="heading"
            value={values.heading}
            onChange={(e) => update({ heading: e.target.value })}
            placeholder="e.g., The Story"
          />
        </Field>

        <Field>
          <FormHeading htmlFor="description" label="Description" />
          <Textarea
            id="description"
            value={values.description}
            onChange={(e) => update({ description: e.target.value })}
            rows={4}
            placeholder="Product description..."
          />
        </Field>
      </FieldGroup>
    </div>
  );
}
