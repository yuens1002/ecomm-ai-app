"use client";

import { useMemo, useState } from "react";
import {
  ExternalLink,
  Loader2,
  Send,
} from "lucide-react";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumb } from "@/app/admin/_components/dashboard/BreadcrumbContext";
import { usePaidAction } from "@/app/admin/support/_hooks/usePaidAction";
import { TermsNotice } from "@/app/admin/support/_components/TermsNotice";
import { submitTicketReply } from "@/app/admin/support/actions";
import type { SupportTicket, TicketMessage, ReplyResponse } from "@/lib/support-types";

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

interface TicketDetailClientProps {
  ticket: SupportTicket;
  messages: TicketMessage[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TicketDetailClient({
  ticket,
  messages: initialMessages,
}: TicketDetailClientProps) {
  const breadcrumbs = useMemo(
    () => [
      { label: "Submit Ticket", href: "/admin/support" },
      { label: ticket.title },
    ],
    [ticket.title]
  );
  useBreadcrumb(breadcrumbs);

  const { toast } = useToast();
  const [messages, setMessages] = useState(initialMessages);
  const [replyText, setReplyText] = useState("");

  const replyAction = usePaidAction<ReplyResponse>({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, data.message]);
      setReplyText("");
      toast({ title: "Reply sent" });
    },
    onError: (error) => {
      toast({ title: "Failed to send reply", description: error, variant: "destructive" });
    },
  });

  function handleReply() {
    if (!replyText.trim()) return;
    const formData = new FormData();
    formData.set("body", replyText.trim());
    replyAction.execute(() => submitTicketReply(ticket.id, formData));
  }

  const isOpen = ticket.status === "OPEN";

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <PageTitle title={ticket.title} />
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant={STATUS_VARIANT[ticket.status] ?? "outline"}>
            {ticket.status}
          </Badge>
          <Badge variant="outline">{ticket.type}</Badge>
          <span>{formatDate(ticket.createdAt)}</span>
          {ticket.githubUrl && (
            <a
              href={ticket.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
            >
              GitHub <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      <Separator />

      {/* Message thread */}
      {messages.length > 0 ? (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={
                msg.sender === "support"
                  ? "rounded-lg border bg-muted/30 p-4"
                  : "rounded-lg border p-4"
              }
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">
                  {msg.sender === "support" ? "Support Team" : "You"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(msg.createdAt)}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No messages yet. Start the conversation below.
          </p>
        </div>
      )}

      {/* Reply form */}
      {isOpen && (
        <>
          {replyAction.showTermsNotice && <TermsNotice />}
          <div className="space-y-3">
            <Textarea
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={replyAction.isPending}
              rows={3}
              maxLength={5000}
            />
            <Button
              onClick={handleReply}
              disabled={!replyText.trim() || replyAction.isPending}
              size="sm"
            >
              {replyAction.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Reply
            </Button>
          </div>
        </>
      )}

      {!isOpen && (
        <div className="rounded-md bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          This ticket is {ticket.status.toLowerCase()} and cannot receive new replies.
        </div>
      )}
    </div>
  );
}
