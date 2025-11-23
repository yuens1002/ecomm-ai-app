import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NewsletterSignup from "./NewsletterSignup";
import SocialLinks from "./SocialLinks";

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

  return (
    <footer className="bg-secondary text-secondary-foreground border-t">
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Coffee Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Coffee Selection</h3>
            {Object.entries(categoryGroups).map(([label, categories]) => (
              <div key={label} className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {label}
                </h4>
                <ul className="space-y-1">
                  {categories.map((category) => (
                    <li key={category.slug}>
                      <Link
                        href={`/${category.slug}`}
                        className="text-sm hover:underline hover:text-primary transition-colors"
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

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
              <li>
                <Link
                  href="/account"
                  className="text-sm hover:underline hover:text-primary transition-colors"
                >
                  My Account
                </Link>
              </li>
              <li>
                <Link
                  href="/orders"
                  className="text-sm hover:underline hover:text-primary transition-colors"
                >
                  Order History
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Signup */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Stay Connected</h3>
            <p className="text-sm text-muted-foreground">
              Subscribe to our newsletter for exclusive offers and coffee tips.
            </p>
            <NewsletterSignup />
          </div>

          {/* Social Links & Info */}
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

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Artisan Roast. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
