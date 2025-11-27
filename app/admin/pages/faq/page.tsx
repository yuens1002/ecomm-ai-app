import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import FaqEditorClient from "./FaqEditorClient";
import { getPageBlocks } from "@/lib/blocks/actions";

export default async function FaqEditorPage() {
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

  // Find or create the FAQ page
  let faqPage = await prisma.page.findUnique({
    where: {
      slug: "faq",
    },
  });

  if (!faqPage) {
    // Create a new FAQ page with empty content
    faqPage = await prisma.page.create({
      data: {
        title: "Frequently Asked Questions",
        slug: "faq",
        type: "FAQ",
        content: JSON.stringify([]),
        isPublished: false,
      },
    });
  } else if (faqPage.type !== "FAQ") {
    // Update existing page to FAQ type
    faqPage = await prisma.page.update({
      where: { id: faqPage.id },
      data: { type: "FAQ" },
    });
  }

  // Get blocks
  const result = await getPageBlocks(faqPage.id);
  const blocks = "error" in result ? [] : result;

  return (
    <FaqEditorClient
      pageId={faqPage.id}
      initialBlocks={blocks}
      isPublished={faqPage.isPublished}
    />
  );
}
