import { prisma } from "@/lib/prisma";
import CafeEditorClient from "./CafeEditorClient";
import { getPageBlocks } from "@/lib/blocks/actions";
import { getLocationType } from "@/lib/app-settings";

export default async function CafeEditorPage() {
  // Auth and admin checks are enforced by the parent admin layout

  // Find or create the Cafe page
  let cafePage = await prisma.page.findUnique({
    where: {
      slug: "cafe",
    },
  });

  if (!cafePage) {
    // Create a new Cafe page with empty content
    cafePage = await prisma.page.create({
      data: {
        title: "Our Cafe",
        slug: "cafe",
        type: "CAFE",
        content: JSON.stringify([]),
        isPublished: false,
      },
    });
  } else if (cafePage.type !== "CAFE") {
    // Update existing page to CAFE type
    cafePage = await prisma.page.update({
      where: { id: cafePage.id },
      data: { type: "CAFE" },
    });
  }

  // Get blocks
  const result = await getPageBlocks(cafePage.id);
  const blocks = "error" in result ? [] : result;

  // Get location type for dynamic block filtering
  const locationType = await getLocationType();

  return (
    <CafeEditorClient
      pageId={cafePage.id}
      pageSlug={cafePage.slug}
      pageTitle={cafePage.title}
      initialBlocks={blocks}
      isPublished={cafePage.isPublished}
      metaDescription={cafePage.metaDescription}
      showInHeader={cafePage.showInHeader}
      showInFooter={cafePage.showInFooter}
      headerOrder={cafePage.headerOrder}
      footerOrder={cafePage.footerOrder}
      icon={cafePage.icon}
      locationType={locationType}
    />
  );
}
