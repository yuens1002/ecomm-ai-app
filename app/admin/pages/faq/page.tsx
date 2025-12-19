import { prisma } from "@/lib/prisma";
import FaqEditorClient from "./FaqEditorClient";
import { getPageBlocks } from "@/lib/blocks/actions";

export default async function FaqEditorPage() {
  // Auth and admin checks are enforced by the parent admin layout

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
      pageSlug={faqPage.slug}
      pageTitle={faqPage.title}
      initialBlocks={blocks}
      isPublished={faqPage.isPublished}
      metaDescription={faqPage.metaDescription}
      showInHeader={faqPage.showInHeader}
      showInFooter={faqPage.showInFooter}
      headerOrder={faqPage.headerOrder}
      footerOrder={faqPage.footerOrder}
      icon={faqPage.icon}
    />
  );
}
