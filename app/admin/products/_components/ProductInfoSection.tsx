"use client";

import { NameSlugField } from "@/app/admin/_components/cms/fields/NameSlugField";
import { FormHeading } from "@/components/ui/forms/FormHeading";
import { FieldGroup, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FlagField } from "@/components/ui/forms/FlagField";
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
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
          <div className="flex flex-col">
            <FlagField
              id="isOrganic"
              label="Organic"
              description="Mark as certified organic product"
              checked={values.isOrganic}
              onCheckedChange={(checked) => update({ isOrganic: checked })}
            />
            <FlagField
              id="isFeatured"
              label="Featured"
              description="Show on homepage and featured sections"
              checked={values.isFeatured}
              onCheckedChange={(checked) => update({ isFeatured: checked })}
            />
            <FlagField
              id="isDisabled"
              label="Disabled"
              description="Hide from storefront"
              checked={values.isDisabled}
              onCheckedChange={(checked) => update({ isDisabled: checked })}
            />
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
