"use client";

import { NameSlugField } from "@/app/admin/_components/cms/fields/NameSlugField";
import { FormHeading } from "@/components/ui/forms/FormHeading";
import {
  FieldSet,
  FieldLegend,
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
import { ImageListField } from "@/app/admin/_components/cms/fields/ImageListField";

export interface ProductInfoValues {
  name: string;
  slug: string;
  heading: string;
  description: string;
  images: Array<{ url: string; alt: string }>;
  isOrganic: boolean;
  isFeatured: boolean;
  isDisabled: boolean;
}

interface ProductInfoSectionProps {
  values: ProductInfoValues;
  onChange: (values: ProductInfoValues) => void;
  pendingFilesMap?: Map<number, { file: File; previewUrl: string }>;
  onImageFileSelect?: (index: number, file: File, previewUrl: string) => void;
  onImagesChange?: (images: Array<{ url: string; alt: string }>) => void;
}

export function ProductInfoSection({
  values,
  onChange,
  pendingFilesMap,
  onImageFileSelect,
  onImagesChange,
}: ProductInfoSectionProps) {
  const update = (partial: Partial<ProductInfoValues>) => {
    onChange({ ...values, ...partial });
  };

  return (
    <FieldSet>
      <FieldLegend>Product Info</FieldLegend>
      <FieldDescription>Basic product information and settings</FieldDescription>

      <FieldGroup>
        {/* Name / Slug */}
        <NameSlugField
          name={values.name}
          slug={values.slug}
          onChange={({ name, slug }) => update({ name, slug })}
        />

        {/* Heading */}
        <Field>
          <FormHeading htmlFor="heading" label="Heading" />
          <Input
            id="heading"
            value={values.heading}
            onChange={(e) => update({ heading: e.target.value })}
            placeholder="e.g., The Story"
          />
        </Field>

        {/* Description */}
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

        {/* Images */}
        <ImageListField
          label="Product Images"
          images={values.images}
          onChange={onImagesChange ?? ((imgs) => update({ images: imgs }))}
          onFileSelect={onImageFileSelect}
          pendingFiles={pendingFilesMap}
          maxImages={5}
        />

        {/* Flags */}
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
    </FieldSet>
  );
}
