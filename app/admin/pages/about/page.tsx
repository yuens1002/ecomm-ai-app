import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AboutEditorClient from "./AboutEditorClient";
import { getPageBlocks } from "@/lib/blocks/actions";
import { prisma } from "@/lib/prisma";
import { WizardAnswers } from "@/lib/api-schemas/generate-about";

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

  // Pull site settings for default wizard answers (store name varies per install)
  const settings = await prisma.siteSettings.findMany({
    where: {
      key: {
        in: [
          "store_name",
          "store_tagline",
          "store_description",
          "contactEmail",
        ],
      },
    },
    select: { key: true, value: true },
  });

  const settingsMap = settings.reduce(
    (acc, { key, value }) => {
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  const defaultAnswers: WizardAnswers = {
    businessName: settingsMap.store_name || aboutPage.title || "",
    foundingStory:
      settingsMap.store_description ||
      "Our team started roasting to share vibrant, origin-forward coffees with our community.",
    uniqueApproach:
      settingsMap.store_tagline ||
      "Small-batch roasting with meticulous profiles to highlight sweetness and clarity.",
    coffeeSourcing:
      "Long-term relationships with trusted importers and producers across Central and East Africa.",
    roastingPhilosophy: "Light roasts to highlight origin characteristics",
    targetAudience:
      "Coffee enthusiasts who appreciate traceable, thoughtfully roasted single origins and blends.",
    brandPersonality: "friendly",
    keyValues:
      "Quality, transparency, community, sustainability, and hospitality.",
    communityRole:
      "We host public cuppings, donate to local food programs, and collaborate with neighborhood makers.",
    futureVision:
      "Grow responsible sourcing partnerships and open more educational community events.",
    heroImageUrl: null,
    heroImageDescription: null,
    previousHeroImageUrl: null,
  };

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
      initialWizardAnswers={defaultAnswers}
    />
  );
}
