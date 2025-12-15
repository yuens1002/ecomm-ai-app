"use client";

import { SettingsField } from "@/components/admin/SettingsField";
import { SettingsSection } from "@/components/admin/SettingsSection";
import { PageTitle } from "@/components/admin/PageTitle";
import { ShoppingBag } from "lucide-react";
import { IconPicker } from "@/components/app-components/IconPicker";
import { InputGroupInput } from "@/components/ui/app/InputGroup";

/**
 * Store Front Settings Page
 * Product menu, add-ons, display preferences
 */
export default function StoreFrontSettingsPage() {
  return (
    <div className="space-y-8">
      <PageTitle
        title="Store Front Settings"
        subtitle="Customize your product menu and shopping experience"
      />

      <SettingsSection
        icon={<ShoppingBag className="h-5 w-5" />}
        title="Product Menu"
        description="Customize the icon and text for your product navigation"
      >
        <SettingsField
          endpoint="/api/admin/settings/product-menu"
          field="icon"
          label="Menu Icon"
          description="Icon displayed next to the product menu text in navigation"
          defaultValue="ShoppingBag"
          method="PATCH"
          autoSave
          input={(value, onChange, isDirty) => (
            <div className="w-fit">
              <IconPicker
                value={value}
                onValueChange={onChange}
                placeholder="Pick an icon..."
                className={isDirty ? "border-amber-500" : ""}
              />
            </div>
          )}
        />

        <SettingsField
          endpoint="/api/admin/settings/product-menu"
          field="text"
          label="Menu Text"
          description="Text label for the product menu (max 20 characters)"
          maxLength={20}
          defaultValue="Shop"
          method="PATCH"
          input={(value, onChange, isDirty) => (
            <InputGroupInput
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={isDirty ? "border-amber-500" : ""}
            />
          )}
        />
      </SettingsSection>

      <SettingsSection
        title="Add-Ons Section Headings"
        description="Customize headings for product add-ons and cart suggestions"
      >
        <SettingsField
          endpoint="/api/admin/settings/add-ons"
          field="productAddOnsSectionTitle"
          label="Product Page Add-Ons Title"
          description="Shown on individual product pages to introduce complementary products."
          maxLength={120}
          defaultValue="Complete Your Order"
        />

        <SettingsField
          endpoint="/api/admin/settings/add-ons"
          field="cartAddOnsSectionTitle"
          label="Shopping Cart Add-Ons Title"
          description="Shown in the shopping cart to suggest additional products before checkout."
          maxLength={120}
          defaultValue="You Might Also Like"
        />
      </SettingsSection>
    </div>
  );
}
