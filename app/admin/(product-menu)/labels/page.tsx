"use client";

import { useProductMenuData } from "../hooks/useProductMenuData";
import { LabelsTable } from "./LabelsTable";
import { PageTitle } from "@/components/admin/PageTitle";

export default function Page() {
  const { labels, categories, isLoading } = useProductMenuData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">
          Loading labels...
        </div>
      </div>
    );
  }

  return (
    <>
      <PageTitle
        title="Labels"
        subtitle="Manage category labels and menu organization"
      />
      <LabelsTable labels={labels} categories={categories} />
    </>
  );
}
