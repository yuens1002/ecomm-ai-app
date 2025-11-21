import { requireAdmin } from "@/lib/admin";
import ProductFormClient from "../ProductFormClient";

export default async function NewProductPage() {
  await requireAdmin();

  return (
    <div className="container mx-auto py-10">
      <ProductFormClient />
    </div>
  );
}
