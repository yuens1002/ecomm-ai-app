"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Loader2,
  Send,
} from "lucide-react";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import {
  FieldSet,
  FieldLegend,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { submitTypedTicket, submitCommunityIssue, acceptTerms } from "./actions";
import { SupportTicketsList } from "./SupportTicketsSection";
import type { LicenseInfo, AlaCartePackage } from "@/lib/license-types";
import type { SupportTicket } from "@/lib/support-types";

// ---------------------------------------------------------------------------
// Config-driven state
// ---------------------------------------------------------------------------

interface TicketPageConfig {
  showCredits: boolean;
  ticketCount: number;
  showTypeSelector: boolean;
  defaultType: "normal" | "priority";
  priorityDisabled: boolean;
  ticketPacks: AlaCartePackage[];
  needsTermsAcceptance: boolean;
  showUpsell: boolean;
  hasKey: boolean;
}

function computeTicketPageConfig(license: LicenseInfo, hasKey: boolean): TicketPageConfig {
  const ticketCredits = license.support.tickets;
  const hasCredits = ticketCredits.remaining > 0;
  const hasPurchased = ticketCredits.purchased > 0;
  const hasPlan = ticketCredits.limit > 0;

  // Filter a la carte for ticket packs only
  const ticketPacks = license.alaCarte.filter((p) => p.id.startsWith("alacarte-tickets"));

  // Legal gate
  const needsTermsAcceptance =
    hasKey && license.legal != null &&
    (license.legal.pendingAcceptance.includes("support-terms") ||
      !license.legal.acceptedVersions["support-terms"]);

  return {
    showCredits: hasKey && (hasCredits || hasPurchased || hasPlan),
    ticketCount: ticketCredits.remaining,
    showTypeSelector: hasKey && (hasCredits || hasPurchased || hasPlan),
    defaultType: hasCredits ? "priority" : "normal",
    priorityDisabled: ticketCredits.remaining === 0,
    ticketPacks: (!hasCredits || !hasKey) ? ticketPacks : [],
    needsTermsAcceptance,
    showUpsell: !hasKey,
    hasKey,
  };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface SupportPageClientProps {
  license: LicenseInfo;
  tickets: SupportTicket[];
  hasKey: boolean;
}

export function SupportPageClient({
  license,
  tickets,
  hasKey,
}: SupportPageClientProps) {
  const config = computeTicketPageConfig(license, hasKey);

  return (
    <div className="space-y-12">
      <PageTitle
        title="Submit Ticket"
        subtitle="Report issues and get community support"
      />

      <TicketFormSection config={config} license={license} />

      <SupportTicketsList tickets={tickets} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ticket form section
// ---------------------------------------------------------------------------

function TicketFormSection({
  config,
  license,
}: {
  config: TicketPageConfig;
  license: LicenseInfo;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [ticketType, setTicketType] = useState<"normal" | "priority">(config.defaultType);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const isLegalBlocked = config.needsTermsAcceptance && !termsAccepted;
  const canSubmit =
    title.trim().length > 0 &&
    !isPending &&
    !isLegalBlocked &&
    (ticketType === "normal" || !config.priorityDisabled);

  function handleSubmit() {
    if (!canSubmit) return;

    startTransition(async () => {
      // If terms were accepted, send acceptance first
      if (config.needsTermsAcceptance && termsAccepted) {
        const legalResult = await acceptTerms([
          { slug: "support-terms", version: "current" },
        ]);
        if (!legalResult.success) {
          toast({
            title: "Failed to accept terms",
            description: legalResult.error,
            variant: "destructive",
          });
          return;
        }
      }

      if (config.hasKey && config.showTypeSelector) {
        // Priority ticket flow (has key + credits or plan)
        const formData = new FormData();
        formData.set("title", title.trim());
        if (steps.trim()) formData.set("steps", steps.trim());
        if (expected.trim()) formData.set("expected", expected.trim());
        formData.set("type", ticketType);

        const result = await submitTypedTicket(formData);
        if (result.success && result.data) {
          setTitle("");
          setSteps("");
          setExpected("");
          if (ticketType === "priority") {
            toast({ title: "Ticket created — we'll respond within 48 hours" });
          } else {
            const ticket = result.data.ticket;
            toast({
              title: "Issue created",
              description: ticket.githubUrl ? (
                <a
                  href={ticket.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline"
                >
                  View on GitHub <ExternalLink className="h-3 w-3" />
                </a>
              ) : undefined,
            });
          }
        } else {
          toast({
            title: "Failed to create ticket",
            description: result.error,
            variant: "destructive",
          });
        }
      } else {
        // Community issue flow (no key / FREE)
        const formData = new FormData();
        formData.set("title", title.trim());
        const bodyParts: string[] = [];
        if (steps.trim()) bodyParts.push(`**Steps to reproduce:**\n${steps.trim()}`);
        if (expected.trim()) bodyParts.push(`**Expected / actual:**\n${expected.trim()}`);
        if (bodyParts.length > 0) formData.set("body", bodyParts.join("\n\n"));

        const result = await submitCommunityIssue(formData);
        if (result.success && result.data) {
          setTitle("");
          setSteps("");
          setExpected("");
          toast({
            title: `Issue #${result.data.issueNumber} created`,
            description: (
              <a
                href={result.data.issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline"
              >
                View on GitHub <ExternalLink className="h-3 w-3" />
              </a>
            ),
          });
        } else {
          toast({
            title: "Failed to create issue",
            description: result.error,
            variant: "destructive",
          });
        }
      }
    });
  }

  return (
    <FieldSet>
      <FieldLegend>Submit a Ticket</FieldLegend>
      <FieldDescription>
        Tickets are submitted anonymously. No personal information is shared.
      </FieldDescription>

      {/* Legal gate */}
      {config.needsTermsAcceptance && (
        <div className="rounded-md border border-dashed p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Before submitting, please review and accept the{" "}
            <Link
              href="/admin/support/terms?tab=terms"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Support Service Terms
            </Link>
            .
          </p>
          <div className="flex items-center gap-2">
            <Checkbox
              id="accept-terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            />
            <Label htmlFor="accept-terms" className="text-sm">
              I accept the Support Service Terms
            </Label>
          </div>
        </div>
      )}

      {/* Ticket credits */}
      {config.showCredits && (
        <p className="text-sm text-muted-foreground">
          {config.ticketCount} ticket{config.ticketCount !== 1 ? "s" : ""} remaining
        </p>
      )}

      {/* Ticket type selector */}
      {config.showTypeSelector && (
        <div className="max-w-xs">
          <Label htmlFor="ticket-type" className="text-sm mb-1.5 block">
            Ticket Type
          </Label>
          <Select
            value={ticketType}
            onValueChange={(v) => setTicketType(v as "normal" | "priority")}
          >
            <SelectTrigger id="ticket-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" align="start" sideOffset={4}>
              <SelectItem value="priority" disabled={config.priorityDisabled}>
                Priority{config.priorityDisabled ? " (no credits)" : ""}
              </SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Form fields */}
      <div className="space-y-6">
        <div>
          <Label htmlFor="ticket-title" className="text-sm mb-1.5 block">
            Title
          </Label>
          <Input
            id="ticket-title"
            placeholder="Brief summary of the issue"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isPending}
            maxLength={200}
            className="max-w-md"
          />
        </div>
        <div>
          <Label htmlFor="ticket-steps" className="text-sm mb-1.5 block">
            Steps to Reproduce
          </Label>
          <Textarea
            id="ticket-steps"
            placeholder="1. Go to...\n2. Click on...\n3. See error"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            disabled={isPending}
            rows={3}
            maxLength={5000}
          />
        </div>
        <div>
          <Label htmlFor="ticket-expected" className="text-sm mb-1.5 block">
            Expected / Actual Behavior
          </Label>
          <Textarea
            id="ticket-expected"
            placeholder="Expected: ... / Actual: ..."
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            disabled={isPending}
            rows={2}
            maxLength={5000}
          />
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        size="sm"
      >
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Submit Ticket
      </Button>

      {/* Quota exhausted — a la carte CTA */}
      {config.ticketPacks.length > 0 && (
        <div className="space-y-3 pt-2">
          {config.ticketPacks.map((pack) => (
            <a
              key={pack.id}
              href={pack.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium">{pack.label}</p>
                <p className="text-xs text-muted-foreground">{pack.description}</p>
              </div>
              <span className="text-sm font-medium shrink-0 ml-4">{pack.price}</span>
            </a>
          ))}
        </div>
      )}

      {/* FREE user (no key) — upsell */}
      {config.showUpsell && (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Issues are tracked on GitHub and triaged by our team and the community.
          </p>
          <p>
            For priority response times, subscribe to{" "}
            <Link
              href="/admin/support/plans"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Priority Support
            </Link>{" "}
            in Subscriptions.
          </p>
          {license.alaCarte.filter((p) => p.id.startsWith("alacarte-tickets")).length > 0 && (
            <div className="space-y-2 pt-1">
              <p>Or purchase support credits:</p>
              {license.alaCarte
                .filter((p) => p.id.startsWith("alacarte-tickets"))
                .map((pack) => (
                  <a
                    key={pack.id}
                    href={pack.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{pack.label}</p>
                      <p className="text-xs text-muted-foreground">{pack.description}</p>
                    </div>
                    <span className="text-sm font-medium shrink-0 ml-4">{pack.price}</span>
                  </a>
                ))}
            </div>
          )}
        </div>
      )}
    </FieldSet>
  );
}
