import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      {page.heroImage && (
        <div className="relative h-64 w-full md:h-96">
          <Image
            src={page.heroImage}
            alt={page.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-4xl font-bold text-white md:text-6xl">
              {page.title}
            </h1>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        {!page.heroImage && (
          <h1 className="mb-8 text-4xl font-bold md:text-5xl">{page.title}</h1>
        )}

        {/* Rich Text Content */}
        <div
          className="prose prose-slate max-w-none dark:prose-invert lg:prose-lg"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />

        {/* Child Pages Grid */}
        {page.children.length > 0 && (
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
        )}
      </div>
    </div>
  );
}
