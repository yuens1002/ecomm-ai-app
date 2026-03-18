import { validateLicense } from "@/lib/license";
import { fetchAllLegalDocs } from "@/lib/legal";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { TermsSidebarNav } from "./_components/TermsSidebarNav";

export default async function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [license, allDocs] = await Promise.all([
    validateLicense(),
    fetchAllLegalDocs(),
  ]);

  return (
    <div className="max-w-5xl space-y-8">
      <PageTitle
        title="Terms & Conditions"
        subtitle="Platform legal documents and acceptance records"
      />
      <div className="lg:grid lg:grid-cols-[220px_1fr] gap-8">
        <TermsSidebarNav legalState={license.legal} availableDocs={allDocs} />
        <div>{children}</div>
      </div>
    </div>
  );
}
