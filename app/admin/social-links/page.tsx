import { Metadata } from "next";
import SocialLinksManagement from "./SocialLinksManagement";

export const metadata: Metadata = {
  title: "Social Links Management - Admin",
  description: "Manage social media links for the footer",
};

export default function SocialLinksPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SocialLinksManagement />
    </div>
  );
}
