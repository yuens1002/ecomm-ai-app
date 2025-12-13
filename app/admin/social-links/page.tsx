import { Metadata } from "next";
import SocialLinksManagement from "./SocialLinksManagement";

export const metadata: Metadata = {
  title: "Social Links Management - Admin",
  description: "Manage social media links for the footer",
};

export default function SocialLinksPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Social Links</h1>
        <p className="text-muted-foreground mt-2">
          Manage social media links for the footer
        </p>
      </div>
      <SocialLinksManagement />
    </>
  );
}
