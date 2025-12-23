"use client";

import { useProductMenuData } from "../hooks/useProductMenuData";
import { LabelsTable } from "./LabelsTable";

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

  return <LabelsTable labels={labels} categories={categories} />;
}
