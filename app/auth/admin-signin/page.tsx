import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Shield } from "lucide-react";
import { SignIn } from "@/components/app-components/sign-in/SignIn";
import { LoginForm } from "@/components/app-components/sign-in/LoginForm";
import { signInAdmin } from "@/actions/auth";
import { getSiteMetadata } from "@/lib/site-metadata";
import Link from "next/link";

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
      <LoginForm signInAction={signInAdmin} />
      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          ← Back to Store
        </Link>
      </div>
    </SignIn>
  );
}
