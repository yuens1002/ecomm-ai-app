"use client";

import { useState, useTransition } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import {
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchSupportTickets } from "./actions";
import type { SupportTicket } from "@/lib/support-types";

// ---------------------------------------------------------------------------
// Ticket list (display only — form is in SupportPageClient)
// ---------------------------------------------------------------------------

interface SupportTicketsListProps {
  tickets: SupportTicket[];
}

export function SupportTicketsList({ tickets: initialTickets }: SupportTicketsListProps) {
  const { toast } = useToast();
  const [tickets, setTickets] = useState(initialTickets);
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(async () => {
      const result = await fetchSupportTickets();
      if (result.success && result.data) {
        setTickets(result.data.tickets);
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
    <FieldSet>
      <div className="flex items-center justify-between">
        <FieldLegend className="mb-0">Recent Tickets</FieldLegend>
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
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center">
          <p className="text-sm font-medium text-muted-foreground">No tickets yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Submitted tickets will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={ticket.status} />
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
      )}
    </FieldSet>
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
