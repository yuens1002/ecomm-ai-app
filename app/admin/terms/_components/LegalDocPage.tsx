"use client";

import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { getLegalUrl } from "@/lib/legal-utils";
import { DocVersionStatus } from "./DocVersionStatus";
import type { LegalDocument } from "@/lib/legal-utils";
import type { LicenseInfo } from "@/lib/license-types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LegalDocPageProps {
  slug: string;
  doc: LegalDocument | null;
  license: LicenseInfo;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LegalDocPage({ slug, doc, license }: LegalDocPageProps) {
  const rendered = useMemo(() => {
    if (!doc) return null;
    const html = (marked.parse(doc.content, { gfm: true, breaks: true }) as string).replace(
      /<a href="mailto:([^"]+)">([^<]+)<\/a>\s*\(subject:\s*(\[[^\]]+\])\)/g,
      (_, email: string, label: string, subject: string) =>
        `<a href="mailto:${email}?subject=${encodeURIComponent(subject)}">${label}</a> (subject: ${subject})`
    );
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  }, [doc]);

  // Null state: platform unavailable
  if (!doc) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          This document could not be loaded from the platform.
        </p>
        <a
          href={getLegalUrl(slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
        >
          View on platform <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-6 space-y-5">
      {/* Header */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">{doc.title}</h2>
        <DocVersionStatus doc={doc} legalState={license.legal ?? null} />
      </div>

      {/* Material change notice */}
      {doc.materialChange && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Material change
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              This document has been updated with a material change. Please review carefully.
            </p>
          </div>
        </div>
      )}

      <Separator />

      {/* Content */}
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: rendered ?? "" }}
      />
    </div>
  );
}
