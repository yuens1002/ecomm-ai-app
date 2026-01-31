import { requireAdmin } from "@/lib/admin";
import { ProductType } from "@prisma/client";
import ProductManagementClient from "./ProductManagementClient";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";

export default async function ProductManagementPage() {
  await requireAdmin();

  return (
    <>
      <PageTitle
        title="Coffee Products"
        subtitle="Manage coffee catalog, variants, and pricing"
      />
      <ProductManagementClient productType={ProductType.COFFEE} />
    </>
  );
}
