import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AboutEditorClient from "./AboutEditorClient";
import { getPageBlocks } from "@/lib/blocks/actions";

export default async function AboutEditorPage() {
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

  // Find or create the About page
  let aboutPage = await prisma.page.findUnique({
    where: {
      slug: "about",
    },
  });

  if (!aboutPage) {
    // Create a new About page with empty content
    aboutPage = await prisma.page.create({
      data: {
        title: "About Us",
        slug: "about",
        type: "ABOUT",
        content: JSON.stringify([]),
        isPublished: false,
      },
    });
  } else if (aboutPage.type !== "ABOUT") {
    // Update existing page to ABOUT type
    aboutPage = await prisma.page.update({
      where: { id: aboutPage.id },
      data: { type: "ABOUT" },
    });
  }

  // Get blocks
  const result = await getPageBlocks(aboutPage.id);
  const blocks = "error" in result ? [] : result;

  return (
    <AboutEditorClient
      pageId={aboutPage.id}
      pageSlug={aboutPage.slug}
      pageTitle={aboutPage.title}
      initialBlocks={blocks}
      isPublished={aboutPage.isPublished}
      metaDescription={aboutPage.metaDescription}
      showInHeader={aboutPage.showInHeader}
      showInFooter={aboutPage.showInFooter}
      headerOrder={aboutPage.headerOrder}
      footerOrder={aboutPage.footerOrder}
      icon={aboutPage.icon}
    />
  );
}
