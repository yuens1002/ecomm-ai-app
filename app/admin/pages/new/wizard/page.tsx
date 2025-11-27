import AIWizardClient from "./AIWizardClient";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "AI About Page Wizard - Admin",
  description: "Generate your About page using AI",
};

export default async function AIWizardPage() {
  // Fetch store name from settings
  const storeNameSetting = await prisma.siteSettings.findUnique({
    where: { key: "store_name" },
  });

  const storeName = storeNameSetting?.value || "";

  return <AIWizardClient initialBusinessName={storeName} />;
}
