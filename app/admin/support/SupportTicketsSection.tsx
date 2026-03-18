"use client";

import { useMemo, useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TicketDetailSheet } from "./_components/TicketDetailSheet";
import { fetchSupportTickets } from "./actions";
import type { SupportTicket } from "@/lib/support-types";

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

type TicketFilter = "all" | "OPEN" | "RESOLVED" | "CLOSED" | "priority";

const FILTERS: { value: TicketFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
  { value: "priority", label: "Priority" },
];

const PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// Ticket list
// ---------------------------------------------------------------------------

interface SupportTicketsListProps {
  tickets: SupportTicket[];
  onTicketsChange: (tickets: SupportTicket[]) => void;
}

export function SupportTicketsList({ tickets, onTicketsChange }: SupportTicketsListProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<TicketFilter>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "all") return tickets;
    if (filter === "priority") return tickets.filter((t) => t.type === "priority");
    return tickets.filter((t) => t.status === filter);
  }, [tickets, filter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  function handleFilterChange(f: TicketFilter) {
    setFilter(f);
    setVisibleCount(PAGE_SIZE);
  }

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
      {/* Header: title + refresh */}
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

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => handleFilterChange(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Ticket list */}
      {filtered.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {filter === "all" ? "No tickets yet" : "No matching tickets"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {filter === "all"
              ? "Submitted tickets will appear here."
              : "Try a different filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-128 overflow-y-auto">
          {visible.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => { setSelectedTicket(ticket); setSheetOpen(true); }}
              className="block w-full rounded-lg border p-3 space-y-1.5 text-left transition-shadow hover:shadow-md cursor-pointer"
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
            </button>
          ))}

          {/* Load more */}
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            >
              Show more ({filtered.length - visibleCount} remaining)
            </Button>
          )}
        </div>
      )}

      <TicketDetailSheet
        ticket={selectedTicket}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
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
