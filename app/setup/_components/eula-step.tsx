"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { LegalDocument } from "@/lib/legal-utils";
import { SetupStepper, SetupHeader, SetupMobileLogo, SetupLayout } from "./setup-ui";

export { SetupStepper, SetupHeader, SetupMobileLogo as SetupLogo };

// ─── EULA step ───────────────────────────────────────────────────────────────

interface EulaStepProps {
  docs: LegalDocument[];
  onAccepted: () => void;
}

const MIT_SLUG = "mit-license";

function renderDoc(content: string): string {
  const html = marked.parse(content, { gfm: true, breaks: true }) as string;
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

export function EulaStep({ docs, onAccepted }: EulaStepProps) {
  const renderedDocs = useMemo(() => docs.map((d) => ({ ...d, html: renderDoc(d.content) })), [docs]);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setScrolledToBottom(true);
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleAccept = async () => {
    setIsAccepting(true);
    setError("");
    const versions: Record<string, string> = {};
    for (const doc of docs) versions[doc.slug] = doc.version;
    const acceptedAt = new Date().toISOString();
    try {
      const res = await fetch("/api/admin/setup/eula", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versions, acceptedAt }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to record acceptance. Please try again.");
        setIsAccepting(false);
        return;
      }
      onAccepted();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsAccepting(false);
    }
  };

  return (
    <SetupLayout>
      <SetupStepper current="eula" />
      <SetupHeader
        title="The fine print (it's genuinely fine)"
        description="You own this code outright — MIT licensed, no strings attached. These docs just cover how our optional platform services work, in plain English."
      />

      {/* Terms flow openly — no inner window or border */}
      <div className="space-y-10 mb-8">
        {renderedDocs.map((doc) => (
          <section key={doc.slug}>
            <div className="mb-3">
              <h2 className="text-base font-semibold">{doc.title}</h2>
              {doc.slug === MIT_SLUG && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Open-Source Software License — governs the store codebase
                </p>
              )}
              <p className="text-xs text-muted-foreground">Version {doc.version}</p>
            </div>
            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: doc.html }}
            />
          </section>
        ))}
        {/* Sentinel — 1px height ensures IntersectionObserver fires reliably */}
        <div ref={sentinelRef} className="h-px" />
      </div>

      {!scrolledToBottom && (
        <p className="text-xs text-muted-foreground mb-3">
          Scroll to the bottom to continue.
        </p>
      )}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      <Button
        data-testid="eula-accept-btn"
        disabled={!scrolledToBottom || isAccepting}
        onClick={handleAccept}
      >
        {isAccepting ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Just a moment...</>
        ) : (
          "Looks good, let\u2019s continue"
        )}
      </Button>
    </SetupLayout>
  );
}
