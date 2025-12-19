import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LinkPageEditorClient from "./LinkPageEditorClient";

export default async function LinkPageEditor({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Auth and admin checks are enforced by the parent admin layout

  const { slug } = await params;

  // Find the LINK page
  const page = await prisma.page.findUnique({
    where: { slug },
  });

  if (!page || page.type !== "LINK") {
    redirect("/admin/pages");
  }

  return <LinkPageEditorClient page={page} />;
}
