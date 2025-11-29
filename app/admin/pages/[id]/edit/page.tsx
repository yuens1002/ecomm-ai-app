import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditPageClient from "./EditPageClient";
import type { Metadata } from "next";

interface EditPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getPage(id: string) {
  const page = await prisma.page.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      heroImage: true,
      content: true,
      metaDescription: true,
      showInFooter: true,
      footerOrder: true,
      icon: true,
      isPublished: true,
      generationPrompt: true,
      generatedBy: true,
    },
  });

  return page;
}

export async function generateMetadata({
  params,
}: EditPageProps): Promise<Metadata> {
  const { id } = await params;
  const page = await getPage(id);

  if (!page) {
    return {
      title: "Page Not Found - Admin",
    };
  }

  return {
    title: `Edit ${page.title} - Admin`,
    description: `Edit the ${page.title} page.`,
  };
}

export default async function EditPagePage({ params }: EditPageProps) {
  const { id } = await params;
  const page = await getPage(id);

  if (!page) {
    notFound();
  }

  return <EditPageClient page={page} />;
}
