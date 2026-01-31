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

  return (
    <>
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Desktop Layout: 3 columns */}
          <div className="hidden sm:flex h-16 items-center justify-between">
            {/* Left: Branding with copyright */}
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {storeName}
            </div>

            {/* Center: Links */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link
                href="#"
                className="hover:text-foreground transition-colors"
              >
                Disclaimer
              </Link>
              <span className="text-border">•</span>
              <Link
                href="#"
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

          {/* Mobile Layout: Stacked */}
          <div className="sm:hidden py-4 space-y-3">
            {/* Row 1: Branding with copyright */}
            <div className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} {storeName}
            </div>

            {/* Row 2: Links + Social */}
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap">
              <Link
                href="#"
                className="hover:text-foreground transition-colors"
              >
                Disclaimer
              </Link>
              <span className="text-border">•</span>
              <Link
                href="#"
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
              {socialLinks.length > 0 && (
                <>
                  <span className="text-border">•</span>
                  <SocialLinks links={socialLinks} />
                </>
              )}
            </div>
          </div>
        </div>
      </footer>

      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
}
