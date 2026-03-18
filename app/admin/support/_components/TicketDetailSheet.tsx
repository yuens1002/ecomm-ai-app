"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  ExternalLink,
  Loader2,
  MessageSquare,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { usePaidAction } from "@/app/admin/support/_hooks/usePaidAction";
import { TermsNotice } from "@/app/admin/support/_components/TermsNotice";
import { fetchTicketDetail, submitTicketReply } from "@/app/admin/support/actions";
import type { SupportTicket, TicketReply, ReplyResponse } from "@/lib/support-types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  OPEN: "default",
  RESOLVED: "secondary",
  CLOSED: "outline",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TicketDetailSheetProps {
  ticket: SupportTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TicketDetailSheet({
  ticket,
  open,
  onOpenChange,
}: TicketDetailSheetProps) {
  const { toast } = useToast();
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [isLoadingReplies, startLoadTransition] = useTransition();
  const [replyText, setReplyText] = useState("");
  const threadEndRef = useRef<HTMLDivElement>(null);
  const prevTicketIdRef = useRef<string | null>(null);

  // Reset state when sheet closes
  function handleOpenChange(next: boolean) {
    if (!next) {
      setReplies([]);
      setReplyText("");
      prevTicketIdRef.current = null;
    }
    onOpenChange(next);
  }

  // Load replies when a ticket is selected
  const loadReplies = useCallback((ticketId: string) => {
    startLoadTransition(async () => {
      const result = await fetchTicketDetail(ticketId);
      if (result.success && result.data) {
        setReplies(result.data.replies);
      } else {
        toast({
          title: "Failed to load replies",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }, [toast]);

  // Trigger load when sheet opens with a new ticket
  useEffect(() => {
    if (!open || !ticket) return;
    if (prevTicketIdRef.current === ticket.id) return;
    prevTicketIdRef.current = ticket.id;
    loadReplies(ticket.id);
  }, [open, ticket, loadReplies]);

  // Scroll to bottom when new replies are added
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies.length]);

  const replyAction = usePaidAction<ReplyResponse>({
    onSuccess: (data) => {
      setReplies((prev) => [...prev, data]);
      setReplyText("");
      toast({ title: "Reply sent" });
    },
    onError: (error, errorCode) => {
      if (errorCode === "ticket_not_open") {
        toast({ title: "Ticket closed", description: "This ticket is no longer open.", variant: "destructive" });
      } else {
        toast({ title: "Failed to send reply", description: error, variant: "destructive" });
      }
    },
  });

  function handleReply() {
    if (!ticket || !replyText.trim()) return;
    const formData = new FormData();
    formData.set("body", replyText.trim());
    replyAction.execute(() => submitTicketReply(ticket.id, formData));
  }

  const isOpen = ticket?.status === "OPEN";

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col w-full sm:max-w-md p-0 gap-0"
      >
        {ticket && (
          <>
            {/* Header */}
            <SheetHeader className="border-b px-5 py-4 space-y-2">
              <SheetTitle className="text-base leading-snug pr-6">
                {ticket.title}
              </SheetTitle>
              <SheetDescription asChild>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={STATUS_VARIANT[ticket.status] ?? "outline"} className="text-xs">
                    {ticket.status}
                  </Badge>
                  {ticket.type === "priority" && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                      Priority
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(ticket.createdAt)}
                  </span>
                  {ticket.githubUrl && (
                    <a
                      href={ticket.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      GitHub <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </SheetDescription>
            </SheetHeader>

            {/* Reply thread — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {isLoadingReplies ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : replies.length > 0 ? (
                <div className="space-y-4">
                  {/* Original ticket body — visually distinct from replies */}
                  {ticket.body && (
                    <div className="rounded-lg bg-muted/50 px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Original Issue
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(ticket.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{ticket.body}</p>
                    </div>
                  )}

                  {replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={cn(
                        "rounded-lg px-4 py-3 space-y-2",
                        reply.source === "SUPPORT"
                          ? "bg-muted/40"
                          : "border"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-xs font-medium",
                          reply.source === "SUPPORT" ? "text-muted-foreground" : "text-foreground"
                        )}>
                          {reply.source === "SUPPORT" ? "Support Team" : "You"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{reply.body}</p>
                    </div>
                  ))}
                  <div ref={threadEndRef} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No replies yet
                  </p>
                  {isOpen && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Start the conversation below
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Reply form — fixed at bottom */}
            {isOpen && (
              <div className="border-t px-5 py-4 space-y-3">
                {replyAction.showTermsNotice && <TermsNotice />}
                <Textarea
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={replyAction.isPending}
                  rows={2}
                  maxLength={10000}
                  className="resize-none"
                />
                <Button
                  onClick={handleReply}
                  disabled={!replyText.trim() || replyAction.isPending}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  {replyAction.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send Reply
                </Button>
              </div>
            )}

            {!isOpen && (
              <div className="border-t px-5 py-4">
                <p className="text-sm text-center text-muted-foreground">
                  This ticket is {ticket.status.toLowerCase()} and cannot receive new replies.
                </p>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
