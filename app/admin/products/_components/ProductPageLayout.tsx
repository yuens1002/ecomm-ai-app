"use client";

import { ReactNode } from "react";
import { SaveButton } from "@/app/admin/_components/forms/SaveButton";

interface ProductPageLayoutProps {
  title: string;
  description?: string;
  isSaving?: boolean;
  onSave?: () => void;
  /** Left column (50%) — product info */
  productInfo: ReactNode;
  /** Right column (50%) — variants & pricing */
  variants: ReactNode;
  /** Left column (50%) — specs (coffee or merch details) */
  specs?: ReactNode;
  /** Right column (50%) — categories */
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
    <div className="space-y-12">
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

      {/* Row 1: Product Info (50%) + Variants (50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-x-16">
        <div className="min-w-0">{productInfo}</div>
        <div className="min-w-0">{variants}</div>
      </div>

      {/* Row 2: Specs (50%) + Categories (50%) */}
      {(specs || categories) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-x-16">
          <div>{specs}</div>
          <div>{categories}</div>
        </div>
      )}

      {/* Row 3: Add-ons (100%) */}
      {addOns}
    </div>
  );
}
