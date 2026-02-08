"use client";

import { ReactNode } from "react";
import { SaveButton } from "@/app/admin/_components/forms/SaveButton";
import { FieldSeparator } from "@/components/ui/field";

interface ProductPageLayoutProps {
  title: string;
  description?: string;
  isSaving?: boolean;
  onSave?: () => void;
  /** Left column (30%) — product info */
  productInfo: ReactNode;
  /** Right column (70%) — variants & pricing */
  variants: ReactNode;
  /** Left column (70%) — specs (coffee or merch details) */
  specs?: ReactNode;
  /** Right column (30%) — categories */
  categories?: ReactNode;
  /** Full-width — add-ons */
  addOns?: ReactNode;
}

export function ProductPageLayout({
  title,
  description,
  isSaving = false,
  onSave,
  productInfo,
  variants,
  specs,
  categories,
  addOns,
}: ProductPageLayoutProps) {
  return (
    <div className="container mx-auto py-10 space-y-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {/* Floating Save */}
      <div className="fixed bottom-6 right-6 z-50">
        <SaveButton isSaving={isSaving} onClick={onSave} size="default" className="shadow-lg" />
      </div>

      {/* Row 1: Product Info (30%) + Variants (70%) */}
      <div className="grid grid-cols-1 md:grid-cols-[3fr_7fr] gap-8">
        <div>{productInfo}</div>
        <div>{variants}</div>
      </div>

      {/* Separator */}
      {(specs || categories) && <FieldSeparator />}

      {/* Row 2: Specs (70%) + Categories (30%) */}
      {(specs || categories) && (
        <div className="grid grid-cols-1 md:grid-cols-[7fr_3fr] gap-8">
          <div>{specs}</div>
          <div>{categories}</div>
        </div>
      )}

      {/* Separator */}
      {addOns && <FieldSeparator />}

      {/* Row 3: Add-ons (100%) */}
      {addOns}
    </div>
  );
}
