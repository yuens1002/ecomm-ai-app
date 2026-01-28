"use client";

import { ReactNode } from "react";
import { AdminTopNav } from "./AdminTopNav";
import { AdminFooter } from "./AdminFooter";
import { AdminBreadcrumb } from "./AdminBreadcrumb";
import { BreadcrumbProvider } from "./BreadcrumbContext";

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
  customIconUrl?: string | null;
  useCustomIcon: boolean;
}

interface AdminShellProps {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  storeName: string;
  storeLogoUrl: string;
  socialLinks: SocialLink[];
  children: ReactNode;
}

export function AdminShell({
  user,
  storeName,
  storeLogoUrl,
  socialLinks,
  children,
}: AdminShellProps) {
  return (
    <BreadcrumbProvider>
      <div className="h-dvh flex flex-col bg-muted/40">
        <AdminTopNav
          user={user}
          storeName={storeName}
          storeLogoUrl={storeLogoUrl}
        />

        {/* Main content area - takes remaining space, scrolls internally */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <AdminBreadcrumb />
            {children}
          </div>
        </main>

        <AdminFooter storeName={storeName} socialLinks={socialLinks} />
      </div>
    </BreadcrumbProvider>
  );
}
