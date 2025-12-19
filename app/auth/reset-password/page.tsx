import { SignIn } from "@/components/app-components/auth/SignIn";
import { ResetPasswordContent } from "./reset-password-content";
import { getSiteMetadata } from "@/lib/site-metadata";

export const metadata = {
  title: "Reset Password",
};

export default async function ResetPasswordPage() {
  const { storeLogoUrl, storeName } = await getSiteMetadata();

  return (
    <SignIn
      title="Reset Password"
      subtitle="Create a new password for your account"
      storeLogoUrl={storeLogoUrl}
      storeName={storeName}
    >
      <ResetPasswordContent />
    </SignIn>
  );
}
