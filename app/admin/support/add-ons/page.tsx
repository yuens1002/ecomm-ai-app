import { validateLicense } from "@/lib/license";
import { AddOnsPageClient } from "./AddOnsPageClient";

export default async function AddOnsPage() {
  const license = await validateLicense();

  return <AddOnsPageClient license={license} />;
}
