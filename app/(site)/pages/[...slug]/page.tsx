import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { Typography } from "@/components/ui/typography";
import { PullQuote } from "@/components/app-components/PullQuote";
import { StatCard } from "@/components/app-components/StatCard";

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
          {/* Image Caption */}
          {page.generationPrompt &&
            typeof page.generationPrompt === "object" &&
            page.generationPrompt !== null &&
            "heroImageDescription" in page.generationPrompt &&
            typeof page.generationPrompt.heroImageDescription === "string" && (
              <Typography>
                <figcaption className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-lg max-w-md text-sm">
                  {page.generationPrompt.heroImageDescription}
                </figcaption>
              </Typography>
            )}
        </div>
      )}

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        {!page.heroImage && (
          <h1 className="mb-8 text-4xl font-bold md:text-5xl">{page.title}</h1>
        )}

        {/* AI-Generated Content with Visual Elements */}
        {page.generationPrompt &&
        typeof page.generationPrompt === "object" &&
        page.generationPrompt !== null &&
        "pullQuote" in page.generationPrompt &&
        "stats" in page.generationPrompt ? (
          <div className="space-y-12">
            {/* Stats Grid */}
            {Array.isArray(page.generationPrompt.stats) &&
              page.generationPrompt.stats.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {page.generationPrompt.stats.map(
                    (stat: any, index: number) => (
                      <StatCard
                        key={index}
                        label={stat.label}
                        value={stat.value}
                      />
                    )
                  )}
                </div>
              )}

            {/* Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Left Column - Pull Quote */}
              <div className="lg:col-span-1">
                {typeof page.generationPrompt.pullQuote === "string" && (
                  <PullQuote text={page.generationPrompt.pullQuote} />
                )}
              </div>

              {/* Right Column - Main Content */}
              <div className="lg:col-span-2">
                <Typography>
                  <div dangerouslySetInnerHTML={{ __html: page.content }} />
                </Typography>
              </div>
            </div>
          </div>
        ) : (
          /* Standard Content Layout */
          <Typography>
            <div dangerouslySetInnerHTML={{ __html: page.content }} />
          </Typography>
        )}

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
