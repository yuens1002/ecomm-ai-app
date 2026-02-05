import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignIn } from "@/components/auth/SignIn";
import { SignInContent } from "./signin-content";
import { getSiteMetadata } from "@/lib/site-metadata";

export const metadata = {
  title: "Sign In",
};

interface SignInPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth();
  const { storeLogoUrl, storeName } = await getSiteMetadata();
  const { callbackUrl } = await searchParams;

  if (session?.user) {
    // Respect callbackUrl if provided, otherwise default to account
    redirect(callbackUrl || "/account");
  }

  return (
    <SignIn
      title={`Welcome to ${storeName}`}
      subtitle="Sign in to manage your orders and subscriptions"
      storeLogoUrl={storeLogoUrl}
      storeName={storeName}
    >
      <SignInContent />
    </SignIn>
  );
}
