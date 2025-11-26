import AIWizardClient from "./AIWizardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI About Page Wizard - Admin",
  description: "Generate your About page using AI",
};

export default function AIWizardPage() {
  return <AIWizardClient />;
}
