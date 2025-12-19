import { SignIn } from "@/components/app-components/auth/SignIn";
import { ForgotPasswordContent } from "./forgot-password-content";
import { getSiteMetadata } from "@/lib/site-metadata";

export const metadata = {
  title: "Forgot Password",
};

export default async function ForgotPasswordPage() {
  const { storeLogoUrl, storeName } = await getSiteMetadata();

  return (
    <SignIn
      title="Forgot Password?"
      subtitle="Enter your email to receive a password reset link"
      storeLogoUrl={storeLogoUrl}
      storeName={storeName}
    >
      <ForgotPasswordContent />
    </SignIn>
  );
}
