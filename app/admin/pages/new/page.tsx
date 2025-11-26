import NewPageClient from "./NewPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Page - Admin",
  description: "Create a new informational page.",
};

export default function NewPagePage() {
  return <NewPageClient />;
}
