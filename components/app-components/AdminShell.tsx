"use client";

import { ReactNode } from "react";
import AdminTopNav from "./AdminTopNav";
import AdminFooter from "./AdminFooter";
import AdminBreadcrumb from "./AdminBreadcrumb";

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

export default function AdminShell({
  user,
  storeName,
  storeLogoUrl,
  socialLinks,
  children,
}: AdminShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <AdminTopNav
        user={user}
        storeName={storeName}
        storeLogoUrl={storeLogoUrl}
      />

      {/* Main content area */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <AdminBreadcrumb />
          {children}
        </div>
      </main>

      <AdminFooter storeName={storeName} socialLinks={socialLinks} />
    </div>
  );
}
