"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Loader2, ScrollText } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import type { LegalDocument } from "@/lib/legal-utils";

// ─── Shared setup UI ────────────────────────────────────────────────────────

type SetupStep = "eula" | "account";

export function SetupStepper({ current }: { current: SetupStep }) {
  const steps: { key: SetupStep; label: string }[] = [
    { key: "eula", label: "EULA" },
    { key: "account", label: "Store Setup" },
  ];
  const currentIndex = steps.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center justify-center mb-2">
      {steps.map((step, i) => {
        const isActive = i <= currentIndex;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-3 h-3 rounded-full border-2 transition-colors ${
                  isActive ? "bg-primary border-primary" : "bg-background border-muted-foreground/40"
                }`}
              />
              <span className={`text-xs font-medium ${i === currentIndex ? "text-foreground" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 h-px mx-2 mb-4 transition-colors ${i < currentIndex ? "bg-primary" : "bg-muted-foreground/30"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function SetupHeader({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="shrink-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-bold leading-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function SetupLogo() {
  const { settings } = useSiteSettings();
  return (
    <div className="flex justify-center mb-6">
      <Image
        src={settings.storeLogoUrl || "/logo.svg"}
        alt={settings.storeName}
        width={56}
        height={56}
        className="rounded-full"
      />
    </div>
  );
}

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      if (el.scrollHeight - el.scrollTop <= el.clientHeight + 8) setScrolledToBottom(true);
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    return () => el.removeEventListener("scroll", check);
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
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-2xl">
        <SetupLogo />
        <Card>
          <CardHeader className="space-y-4">
            <SetupStepper current="eula" />
            <SetupHeader
              icon={<ScrollText className="h-6 w-6" />}
              title="Review & Accept Terms"
              description="Please read and scroll through the following documents before proceeding."
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              ref={scrollRef}
              className="border rounded-md overflow-y-auto bg-muted/30"
              style={{ maxHeight: "400px" }}
            >
              <div className="p-5 space-y-8">
                {renderedDocs.map((doc) => (
                  <section key={doc.slug}>
                    <div className="mb-2">
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
              </div>
            </div>
            {!scrolledToBottom && (
              <p className="text-xs text-muted-foreground text-center">
                Scroll to the bottom to enable the Accept button.
              </p>
            )}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled={!scrolledToBottom || isAccepting} onClick={handleAccept}>
              {isAccepting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Recording acceptance...</>
              ) : (
                "I Accept"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
