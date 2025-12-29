"use client";

import { MenuSettingsDialog } from "./components/MenuSettingsDialog";
import { PageTitle } from "@/components/admin/PageTitle";
import { ProductMenuProvider } from "../ProductMenuProvider";
import { MenuBuilderProvider } from "./MenuBuilderContext";

export default function MenuBuilder() {
  return (
    <ProductMenuProvider>
      <MenuBuilderProvider>
        <>
          <PageTitle
            title="Product Menu Builder"
            subtitle="Group categories under labels and arrange the links to your category pages"
            action={<MenuSettingsDialog />}
          />

          {/* Placeholder for future menu builder content */}
          <div className="mt-8 p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
            <p>
              Menu settings dialog is functional - click the gear icon above
            </p>
            <p className="text-xs mt-2">
              Uses ProductMenuProvider + MenuBuilderContext (Option 2)
            </p>
          </div>
        </>
      </MenuBuilderProvider>
    </ProductMenuProvider>
  );
}
