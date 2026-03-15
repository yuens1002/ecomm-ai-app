import { redirect } from "next/navigation";

export default function ManagePage() {
  redirect("/admin/support/terms?tab=license");
}
