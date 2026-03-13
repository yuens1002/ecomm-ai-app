"use client";

import { useState, useTransition } from "react";
import {
  ExternalLink,
  Loader2,
  RefreshCw,
  Send,
} from "lucide-react";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { submitSupportTicket, fetchSupportTickets } from "./actions";
import type { SupportTicket, SupportUsage } from "@/lib/support-types";

interface SupportTicketsSectionProps {
  initialTickets: SupportTicket[];
  initialUsage: SupportUsage;
}

export function SupportTicketsSection({
  initialTickets,
  initialUsage,
}: SupportTicketsSectionProps) {
  const { toast } = useToast();
  const [tickets, setTickets] = useState(initialTickets);
  const [usage, setUsage] = useState(initialUsage);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  const usagePercent =
    usage.limit > 0 ? Math.round((usage.used / usage.limit) * 100) : 0;
  const exhausted = usage.remaining === 0;

  function handleSubmit() {
    if (!title.trim()) return;

    const formData = new FormData();
    formData.set("title", title.trim());
    if (body.trim()) formData.set("body", body.trim());

    startTransition(async () => {
      const result = await submitSupportTicket(formData);
      if (result.success && result.data) {
        setTickets([result.data.ticket, ...tickets]);
        setUsage(result.data.usage);
        setTitle("");
        setBody("");
        toast({ title: "Ticket created" });
      } else {
        toast({
          title: "Failed to create ticket",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  function handleRefresh() {
    startTransition(async () => {
      const result = await fetchSupportTickets();
      if (result.success && result.data) {
        setTickets(result.data.tickets);
        setUsage(result.data.usage);
        toast({ title: "Tickets refreshed" });
      } else {
        toast({
          title: "Failed to refresh",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <SettingsSection
      title="Priority Support"
      description="Submit tickets and track their status"
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`}
          />
        </Button>
      }
    >
      {/* Usage bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {usage.used} / {usage.limit} tickets this cycle
          </span>
          <span className="text-xs text-muted-foreground">
            {usage.remaining} remaining
          </span>
        </div>
        <Progress
          value={Math.min(usagePercent, 100)}
          className={`h-2 ${exhausted ? "[&>div]:bg-destructive" : ""}`}
        />
      </div>

      {/* New ticket form */}
      <div className="space-y-3">
        <Input
          placeholder="Ticket title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPending || exhausted}
          maxLength={200}
          aria-label="Ticket title"
        />
        <Textarea
          placeholder="Describe your issue (optional)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={isPending || exhausted}
          rows={3}
          maxLength={5000}
          aria-label="Ticket description"
        />
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSubmit}
            disabled={isPending || !title.trim() || exhausted}
            size="sm"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Submit Ticket
          </Button>
          {exhausted && (
            <span className="text-xs text-destructive">
              Ticket limit reached for this billing cycle
            </span>
          )}
        </div>
      </div>

      {/* Ticket list */}
      {tickets.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Recent Tickets
          </h4>
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-start justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ticket.status} />
                    <Badge variant="outline" className="text-xs shrink-0">
                      Priority
                    </Badge>
                    <p className="truncate text-sm font-medium">
                      {ticket.title}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {relativeTime(ticket.createdAt)}
                  </p>
                </div>
                {ticket.githubUrl && (
                  <a
                    href={ticket.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="View on GitHub"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </SettingsSection>
  );
}

// ---------------------------------------------------------------------------
// Sub-components & helpers
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "OPEN"
      ? "default"
      : status === "RESOLVED"
        ? "secondary"
        : "outline";

  return (
    <Badge variant={variant} className="text-xs">
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
