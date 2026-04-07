import { Hero } from "./Hero";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HomeHeroProps {
  storeName: string;
  heroImageUrl?: string;
}

export function HomeHero({ storeName, heroImageUrl }: HomeHeroProps) {
  return (
    <section>
      <Hero
        heading={storeName}
        imageUrl={heroImageUrl}
        imageAlt={`${storeName} — Specialty Coffee`}
      />
      <div className="py-8 text-center border-b bg-background">
        <p className="text-muted-foreground mb-4">
          Describe what you&apos;re looking for and we&apos;ll find it
        </p>
        <Button asChild size="lg">
          <Link href="/search">Find Your Coffee</Link>
        </Button>
      </div>
    </section>
  );
}
