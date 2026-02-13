"use client";

import { ReactNode } from "react";
import { SaveStatus, SaveStatusState } from "@/app/admin/_components/forms/SaveStatus";

interface ProductPageLayoutProps {
  title: string;
  description?: string;
  saveStatus?: SaveStatusState;
  saveErrorMessage?: string;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
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
  saveStatus = "saved",
  saveErrorMessage,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  productInfo,
  variants,
  specs,
  categories,
  addOns,
}: ProductPageLayoutProps) {
  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <SaveStatus
          status={saveStatus}
          errorMessage={saveErrorMessage}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
        />
      </div>

      {/* Product Info (2-col at lg via ProductInfoSection's own grid) */}
      <div className="min-w-0">{productInfo}</div>

      {/* Variants — full width */}
      <div className="min-w-0">{variants}</div>

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
