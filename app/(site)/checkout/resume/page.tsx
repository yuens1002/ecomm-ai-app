import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CheckoutResumeClient } from "./checkout-resume-client";

export default async function CheckoutResumePage() {
  const session = await auth();

  // Server-side auth check - if not authenticated, redirect to sign-in
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/checkout/resume");
  }

  // User is authenticated - render client component that will auto-submit
  return <CheckoutResumeClient userId={session.user.id || ""} />;
}
