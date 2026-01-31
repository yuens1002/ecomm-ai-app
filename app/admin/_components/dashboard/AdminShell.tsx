"use client";

import { ReactNode } from "react";
import { AdminTopNav } from "./AdminTopNav";
import { AdminFooter } from "./AdminFooter";
import { AdminBreadcrumb } from "./AdminBreadcrumb";
import { BreadcrumbProvider } from "./BreadcrumbContext";
import { UpdateBanner } from "@/app/admin/_components/shared/UpdateBanner";

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
      <div className="min-h-dvh flex flex-col bg-muted/40">
        <AdminTopNav
          user={user}
          storeName={storeName}
          storeLogoUrl={storeLogoUrl}
        />

        <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6">
          <AdminBreadcrumb />
          <UpdateBanner />
          {children}
        </main>

        <AdminFooter storeName={storeName} socialLinks={socialLinks} />
      </div>
    </BreadcrumbProvider>
  );
}
