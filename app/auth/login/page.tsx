import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignIn } from "@/components/auth/SignIn";
import { SignInContent } from "./signin-content";
import { getSiteMetadata } from "@/lib/site-metadata";

export const metadata = {
  title: "Sign In",
};

export default async function SignInPage() {
  const session = await auth();
  const { storeLogoUrl, storeName } = await getSiteMetadata();

  if (session?.user) {
    redirect("/account");
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
