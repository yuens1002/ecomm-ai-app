import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Separator } from "@/components/ui/separator";
import NewsletterSignup from "./NewsletterSignup";
import SocialLinks from "./SocialLinks";
import FooterCategories from "./FooterCategories";
import FooterAccountLinks from "./FooterAccountLinks";

/**
 * Get all categories grouped by their label for footer navigation
 */
async function getCategoriesForFooter() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      labelSetting: {
        select: { value: true },
      },
    },
  });

  // Group categories by their label
  const grouped: Record<string, { name: string; slug: string }[]> = {};

  categories.forEach((category) => {
    const label = category.labelSetting.value;
    if (!grouped[label]) {
      grouped[label] = [];
    }
    grouped[label].push({
      name: category.name,
      slug: category.slug,
    });
  });

  return grouped;
}

/**
 * Get active social links for footer
 */
async function getSocialLinks() {
  return await prisma.socialLink.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: {
      platform: true,
      url: true,
      icon: true,
    },
  });
}

/**
 * Mega footer with category navigation, newsletter signup, and social links
 */
export default async function SiteFooter() {
  const categoryGroups = await getCategoriesForFooter();
  const socialLinks = await getSocialLinks();
  
  // Check if current user is admin for footer links
  const session = await auth();
  let isAdmin = false;
  
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true },
    });
    isAdmin = user?.isAdmin || false;
  }

  return (
    <footer className="bg-secondary text-secondary-foreground border-t">
      <div className="container mx-auto px-4 md:px-8 pt-12 pb-6">
        {/* Logo and Branding */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logo.svg"
              alt="Artisan Roast Logo"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <span className="text-2xl font-bold">Artisan Roast</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[30%_auto_1fr] lg:grid-cols-[1fr_auto_3fr_auto_2fr] gap-8 items-start">
          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm hover:underline hover:text-primary transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm hover:underline hover:text-primary transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm hover:underline hover:text-primary transition-colors"
                >
                  Contact
                </Link>
              </li>
              <FooterAccountLinks isAdmin={isAdmin} />
            </ul>
          </div>

          {/* Horizontal Separator (sm only) */}
          <Separator className="md:hidden" />

          {/* Vertical Separator (md+) */}
          <Separator
            orientation="vertical"
            className="hidden md:block h-auto self-stretch"
          />

          {/* Coffee Categories */}
          <FooterCategories categoryGroups={categoryGroups} />

          {/* Horizontal Separator (sm only) */}
          <Separator className="md:hidden" />

          {/* Horizontal Separator spanning full width at md (after row 1) */}
          <Separator className="hidden md:block lg:hidden md:col-span-3" />

          {/* Vertical Separator (lg+ only) */}
          <Separator
            orientation="vertical"
            className="hidden lg:block h-auto self-stretch"
          />

          {/* Third Column: Stay Connected & Follow Us wrapper (lg+ only) */}
          <div className="md:col-span-3 lg:col-span-1 space-y-8">
            {/* Stay Connected (Newsletter) */}
            <div className="space-y-4 pb-6 lg:pb-0">
              <h3 className="text-lg font-semibold">Stay Connected</h3>
              <p className="text-sm text-muted-foreground">
                Subscribe to our newsletter for exclusive offers and coffee
                tips.
              </p>
              <NewsletterSignup />
            </div>

            {/* Horizontal Separator (sm & md only) */}
            <Separator className="lg:hidden" />

            {/* Horizontal Separator within third column at lg+ */}
            <Separator className="hidden lg:block" />

            {/* Follow Us (Social) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Follow Us</h3>
              <SocialLinks links={socialLinks} />
              <div className="pt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Hours:</strong> Mon-Fri 7am-7pm
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:hello@artisan-roast.com"
                    className="hover:underline hover:text-primary"
                  >
                    hello@artisan-roast.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright - Full Width Separator */}
      <div className="border-t border-border/30 bg-white/90 dark:bg-slate-950/90">
        <div className="container mx-auto px-4 md:px-8 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Artisan Roast. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
