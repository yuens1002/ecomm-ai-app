import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import LinkPageEditorClient from "./LinkPageEditorClient";

export default async function LinkPageEditor({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    redirect("/unauthorized");
  }

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
