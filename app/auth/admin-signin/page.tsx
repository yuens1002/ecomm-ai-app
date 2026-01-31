import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Shield } from "lucide-react";
import { SignIn } from "@/components/auth/SignIn";
import { getSiteMetadata } from "@/lib/site-metadata";
import { AdminSignInContent } from "./admin-signin-content";

export const metadata = {
  title: "Admin Sign In",
};

export default async function AdminSignInPage() {
  const session = await auth();
  const { storeLogoUrl, storeName } = await getSiteMetadata();

  if (session?.user) {
    redirect("/admin");
  }

  return (
    <SignIn
      title="Admin Sign In"
      subtitle="Sign in to access the admin dashboard"
      icon={<Shield className="w-4 h-4" />}
      storeLogoUrl={storeLogoUrl}
      storeName={storeName}
    >
      <AdminSignInContent />
    </SignIn>
  );
}
