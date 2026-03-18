"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import type { LegalState } from "@/lib/license-types";
import type { LegalDocument } from "@/lib/legal-utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TermsSidebarNavProps {
  legalState: LegalState | null;
  availableDocs: LegalDocument[];
}

// ---------------------------------------------------------------------------
// Nav config
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  {
    slug: "support-terms",
    label: "Support Service Terms",
    href: "/admin/terms/support-terms",
    group: "support" as const,
  },
  {
    slug: "terms-of-service",
    label: "Terms of Service",
    href: "/admin/terms/terms-of-service",
    group: "agreements" as const,
  },
  {
    slug: "privacy-policy",
    label: "Privacy Policy",
    href: "/admin/terms/privacy-policy",
    group: "agreements" as const,
  },
  {
    slug: "acceptable-use",
    label: "Acceptable Use Policy",
    href: "/admin/terms/acceptable-use",
    group: "agreements" as const,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TermsSidebarNav({ legalState, availableDocs }: TermsSidebarNavProps) {
  const pathname = usePathname();
  const availableSlugs = new Set(availableDocs.map((d) => d.slug));

  const supportItems = NAV_ITEMS.filter((item) => item.group === "support");
  const agreementItems = NAV_ITEMS.filter(
    (item) => item.group === "agreements" && availableSlugs.has(item.slug)
  );

  const docVersionMap = new Map(availableDocs.map((d) => [d.slug, d.version]));

  function getStatusLabel(slug: string): { text: string; className: string } | null {
    if (legalState?.pendingAcceptance?.includes(slug)) {
      return null;
    }
    const acceptedVersion = legalState?.acceptedVersions?.[slug];
    if (acceptedVersion) {
      const currentVersion = docVersionMap.get(slug);
      if (currentVersion && acceptedVersion !== currentVersion) {
        return { text: `v${acceptedVersion} · update available`, className: "text-muted-foreground" };
      }
      return { text: `Accepted v${acceptedVersion}`, className: "text-muted-foreground" };
    }
    return null;
  }

  function renderGroup(
    label: string,
    items: typeof NAV_ITEMS
  ) {
    return (
      <div className="space-y-1">
        <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {label}
        </p>
        {items.map((item) => {
          const isActive = pathname === item.href;
          const status = getStatusLabel(item.slug);
          const isPending = legalState?.pendingAcceptance?.includes(item.slug) ?? false;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                isActive
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              {isPending ? (
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              ) : (
                <span className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              )}
              <span className="flex-1 space-y-0.5">
                <span className="block">{item.label}</span>
                {status && (
                  <span className={`block text-xs ${status.className}`}>
                    {status.text}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <nav className="hidden lg:block sticky top-24 self-start space-y-6">
      {renderGroup("Support", supportItems)}
      {agreementItems.length > 0 && renderGroup("Your Agreements", agreementItems)}
    </nav>
  );
}
