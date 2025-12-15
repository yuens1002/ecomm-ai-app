import SocialLinksManagement from "./SocialLinksManagement";
import { PageTitle } from "@/components/admin/PageTitle";

export const metadata = {
  title: "Social Media - Admin",
  description: "Manage social media links and settings",
};

export default function SocialLinksPage() {
  return (
    <>
      <PageTitle
        title="Social Media"
        subtitle="Manage social media links and settings"
      />
      <SocialLinksManagement />
    </>
  );
}
