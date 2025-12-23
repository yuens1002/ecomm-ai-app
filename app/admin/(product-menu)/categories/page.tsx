"use client";

import { useProductMenuData } from "../hooks/useProductMenuData";
import { CategoriesTable } from "./CategoriesTable";
import { PageTitle } from "@/components/admin/PageTitle";

export default function Page() {
  const { categories, labels, isLoading } = useProductMenuData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">
          Loading categories...
        </div>
      </div>
    );
  }

  return (
    <>
      <PageTitle
        title="Categories"
        subtitle="Manage product categories and organize your catalog"
      />
      <CategoriesTable categories={categories} labels={labels} />
    </>
  );
}
