import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignIn } from "@/components/auth/SignIn";
import { getSiteMetadata } from "@/lib/site-metadata";
import { SignupContent } from "./signup-content";

export const metadata = {
  title: "Sign Up",
};

interface SignUpPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const session = await auth();
  const { storeLogoUrl, storeName } = await getSiteMetadata();
  const { callbackUrl } = await searchParams;

  if (session?.user) {
    // Respect callbackUrl if provided, otherwise default to account
    redirect(callbackUrl || "/account");
  }

  return (
    <SignIn
      title={`Create your ${storeName} account`}
      subtitle="Sign up to track your orders and save preferences"
      storeLogoUrl={storeLogoUrl}
      storeName={storeName}
    >
      <SignupContent />
    </SignIn>
  );
}
