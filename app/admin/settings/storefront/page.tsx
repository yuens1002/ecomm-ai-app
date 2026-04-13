import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { HeroSettingsSection } from "./_components/HeroSettingsSection";
import { ProductMenuSettingsSection } from "./_components/ProductMenuSettingsSection";

/**
 * Store Front Settings Page
 * Product menu, add-ons, display preferences
 */
export default async function StoreFrontSettingsPage() {
  return (
    <div className="space-y-8">
      <PageTitle
        title="Store Front Settings"
        subtitle="Customize your product menu and shopping experience"
      />

      <HeroSettingsSection />

      <ProductMenuSettingsSection />
    </div>
  );
}
