"use client";

import { Field } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/app/InputGroup";
import { generateSlug } from "@/app/admin/_hooks/useSlugGenerator";

export interface NameSlugFieldProps {
  id?: string;
  label?: string; // Defaults to "Name"
  name: string;
  slug?: string; // If omitted, will be derived from name
  onChange: (next: { name: string; slug: string }) => void;
  required?: boolean;
  editableSlug?: boolean; // Defaults to false (inline preview only)
  errorMessage?: string;
}

export function NameSlugField({
  id = "name",
  label = "Name",
  name,
  slug,
  onChange,
  required = true,
  editableSlug = false,
  errorMessage,
}: NameSlugFieldProps) {
  const computedSlug = slug ?? generateSlug(name ?? "");

  return (
    <Field>
      <FormHeading
        htmlFor={id}
        label={label}
        required={required}
        validationType={errorMessage ? "error" : undefined}
        errorMessage={errorMessage}
      />
      <InputGroup>
        <InputGroupInput
          id={id}
          value={name}
          onChange={(e) => {
            const nextName = e.target.value;
            const nextSlug = generateSlug(nextName);
            onChange({ name: nextName, slug: nextSlug });
          }}
          required={required}
        />
        <InputGroupAddon align="inline-end">
          {editableSlug ? (
            <input
              id={`${id}-slug`}
              value={computedSlug}
              onChange={(e) => onChange({ name, slug: e.target.value })}
              className="text-xs italic font-mono bg-transparent outline-none text-muted-foreground"
            />
          ) : (
            <div className="text-xs italic font-mono text-muted-foreground">
              {computedSlug || "slug-preview"}
            </div>
          )}
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}
