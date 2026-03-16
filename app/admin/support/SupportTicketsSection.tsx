"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
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
  onTicketsChange: (tickets: SupportTicket[]) => void;
}

export function SupportTicketsList({ tickets, onTicketsChange }: SupportTicketsListProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(async () => {
      const result = await fetchSupportTickets();
      if (result.success && result.data) {
        onTicketsChange(result.data.tickets);
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
    <div className="rounded-lg border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Recent Tickets</h3>
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
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <a
              key={ticket.id}
              href={ticket.githubUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border p-3 space-y-1.5 transition-shadow hover:shadow-md cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusBadge status={ticket.status} />
                  {ticket.type === "priority" && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                      Priority
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {relativeTime(ticket.createdAt)}
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium truncate">{ticket.title}</p>
            </a>
          ))}
        </div>
      )}
    </div>
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
