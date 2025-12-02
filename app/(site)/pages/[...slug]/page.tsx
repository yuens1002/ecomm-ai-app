import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { getPageBlocks } from "@/lib/blocks/actions";
import { PageContent } from "./PageContent";

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

async function getPage(slug: string) {
  const page = await prisma.page.findUnique({
    where: { slug },
    include: {
      children: {
        where: { isPublished: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return page;
}

export async function generateStaticParams() {
  const pages = await prisma.page.findMany({
    where: { isPublished: true },
    select: { slug: true },
  });

  return pages.map((page) => ({
    slug: page.slug.split("/"),
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pageSlug = slug.join("/");
  const page = await getPage(pageSlug);

  if (!page) {
    return {
      title: "Page Not Found",
    };
  }

  return {
    title: page.title,
    description: page.metaDescription || undefined,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const pageSlug = slug.join("/");
  const page = await getPage(pageSlug);

  if (!page || !page.isPublished) {
    notFound();
  }

  // Get blocks for the page
  const result = await getPageBlocks(page.id);
  const blocks = "error" in result ? [] : result;

  // Filter out deleted blocks for public view
  const visibleBlocks = blocks.filter((block) => !block.isDeleted);

  return (
    <div className="min-h-screen bg-background">
      <PageContent
        blocks={visibleBlocks}
        pageType={page.type}
        pageTitle={page.title}
      />

      {/* Child Pages Grid */}
      {page.children.length > 0 && (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="mt-12">
            <h2 className="mb-6 text-2xl font-bold">Explore More</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {page.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/pages/${child.slug}`}
                  className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary"
                >
                  {child.heroImage && (
                    <div className="relative mb-4 h-32 w-full overflow-hidden rounded-md">
                      <Image
                        src={child.heroImage}
                        alt={child.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}
                  <h3 className="mb-2 text-xl font-semibold group-hover:text-primary">
                    {child.title}
                  </h3>
                  {child.metaDescription && (
                    <p className="text-sm text-muted-foreground">
                      {child.metaDescription}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
