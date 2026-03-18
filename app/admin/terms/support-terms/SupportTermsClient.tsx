"use client";

import { useMemo, useState, useTransition } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { acceptTerms } from "@/app/admin/support/actions";
import { getLegalUrl } from "@/lib/legal-utils";
import { DocVersionStatus } from "../_components/DocVersionStatus";
import type { LegalDocument } from "@/lib/legal-utils";
import type { LicenseInfo } from "@/lib/license-types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SupportTermsClientProps {
  supportTerms: LegalDocument | null;
  license: LicenseInfo;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SupportTermsClient({
  supportTerms,
  license: initialLicense,
}: SupportTermsClientProps) {
  const { toast } = useToast();
  const [license, setLicense] = useState(initialLicense);
  const [isPending, startTransition] = useTransition();

  const rendered = useMemo(() => {
    if (!supportTerms) return null;
    const html = (marked.parse(supportTerms.content, { gfm: true, breaks: true }) as string).replace(
      /<a href="mailto:([^"]+)">([^<]+)<\/a>\s*\(subject:\s*(\[[^\]]+\])\)/g,
      (_, email: string, label: string, subject: string) =>
        `<a href="mailto:${email}?subject=${encodeURIComponent(subject)}">${label}</a> (subject: ${subject})`
    );
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  }, [supportTerms]);

  function handleAccept() {
    if (!supportTerms) return;
    startTransition(async () => {
      const result = await acceptTerms([
        { slug: "support-terms", version: supportTerms.version },
      ]);
      if (result.success && result.license) {
        setLicense(result.license);
        toast({ title: "Terms accepted" });
      } else {
        toast({
          title: "Failed to accept terms",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  // Null state: platform unavailable
  if (!supportTerms) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          This document could not be loaded from the platform.
        </p>
        <a
          href={getLegalUrl("support-terms")}
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
        <h2 className="text-base font-semibold">{supportTerms.title}</h2>
        <DocVersionStatus
          doc={supportTerms}
          legalState={license.legal ?? null}
          onAccept={handleAccept}
          isPending={isPending}
        />
      </div>

      <Separator />

      {/* Content */}
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: rendered ?? "" }}
      />
    </div>
  );
}
