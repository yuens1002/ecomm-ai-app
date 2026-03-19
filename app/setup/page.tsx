import { fetchAllLegalDocs } from "@/lib/legal";
import { SetupFlow } from "./_components/setup-flow";

export default async function SetupPage() {
  const docs = await fetchAllLegalDocs();
  return <SetupFlow docs={docs} />;
}
