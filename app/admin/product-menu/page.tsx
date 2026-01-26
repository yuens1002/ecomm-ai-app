import { requireAdmin } from "@/lib/admin";
import MenuBuilder from "./menu-builder/MenuBuilder";

export const metadata = {
  title: "Product Menu Builder | Admin",
};

export default async function Page() {
  await requireAdmin();
  return <MenuBuilder />;
}
