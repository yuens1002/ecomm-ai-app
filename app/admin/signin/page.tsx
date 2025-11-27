import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminSignInClient from "./AdminSignInClient";

export const metadata = {
  title: "Admin Sign In",
  description: "Sign in to access the admin dashboard",
};

export default async function AdminSignInPage() {
  const session = await auth();

  // If already signed in, redirect to admin
  if (session?.user) {
    redirect("/admin");
  }

  return <AdminSignInClient />;
}
