"use client";

import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";

/**
 * Admin Search settings page. Form fields wired in commit 7
 * (chips heading text input, top-categories multi-select via
 * CheckboxListContent, curated category single-select).
 */
export default function SearchSettingsPage() {
  return (
    <div className="space-y-8">
      <PageTitle
        title="Search Settings"
        subtitle="Configure the search drawer's discovery surface — top categories chip row and curated products section."
      />

      <SettingsSection
        title="Search drawer"
        description="Customize what customers see when they open the search drawer. Form coming in next commit."
      >
        <p className="text-sm text-muted-foreground">
          Form fields will appear here: chips section heading, top categories
          (max 6), curated products category.
        </p>
      </SettingsSection>
    </div>
  );
}
