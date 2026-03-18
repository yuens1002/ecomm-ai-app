"use client";

import { useState } from "react";
import Link from "next/link";
import SocialLinks from "@/app/(site)/_components/content/SocialLinks";
import { FeedbackDialog } from "@/app/admin/_components/shared/FeedbackDialog";

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
  customIconUrl?: string | null;
  useCustomIcon: boolean;
}

interface AdminFooterProps {
  storeName: string;
  socialLinks: SocialLink[];
}

const GITHUB_ISSUES_URL = "https://github.com/yuens1002/ecomm-ai-app/issues";

export function AdminFooter({ storeName, socialLinks }: AdminFooterProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const appVersion = process.env.APP_VERSION || "dev";

  return (
    <>
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Desktop Layout: 3 columns */}
          <div className="hidden md:flex h-16 items-center justify-between">
            {/* Left: Branding with copyright and version */}
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {storeName}
              <span className="ml-2 text-xs opacity-60">v{appVersion}</span>
            </div>

            {/* Center: Links */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link
                href="/admin/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms &amp; Conditions
              </Link>
              <span className="text-border">•</span>
              <Link
                href="/admin/support/terms?tab=license"
                className="hover:text-foreground transition-colors"
              >
                License
              </Link>
              <span className="text-border">•</span>
              <button
                onClick={() => setFeedbackOpen(true)}
                className="hover:text-foreground transition-colors"
              >
                Feedback
              </button>
              <span className="text-border">•</span>
              <Link
                href={GITHUB_ISSUES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Support
              </Link>
            </div>

            {/* Right: Social Links */}
            <div>
              <SocialLinks links={socialLinks} />
            </div>
          </div>

          {/* Mobile/Tablet Layout: xs–md stacked groups */}
          <div className="md:hidden py-4 space-y-3">
            {/* Row 1: Branding */}
            <div className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} {storeName}
              <span className="ml-2 text-xs opacity-60">v{appVersion}</span>
            </div>

            {/* Row 2: Links */}
            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground flex-wrap">
              <Link
                href="/admin/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms &amp; Conditions
              </Link>
              <span className="text-border">•</span>
              <Link
                href="/admin/support/terms?tab=license"
                className="hover:text-foreground transition-colors"
              >
                License
              </Link>
              <span className="text-border">•</span>
              <button
                onClick={() => setFeedbackOpen(true)}
                className="hover:text-foreground transition-colors"
              >
                Feedback
              </button>
              <span className="text-border">•</span>
              <Link
                href={GITHUB_ISSUES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Support
              </Link>
            </div>

            {/* Row 3: Social icons */}
            {socialLinks.length > 0 && (
              <div className="flex justify-center">
                <SocialLinks links={socialLinks} />
              </div>
            )}
          </div>
        </div>
      </footer>

      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
}
