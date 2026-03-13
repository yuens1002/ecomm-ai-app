"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Send } from "lucide-react";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { submitCommunityIssue } from "./actions";

interface CommunityIssueSectionProps {
  adminEmail: string;
  showUpsell: boolean;
}

export function CommunityIssueSection({
  adminEmail,
  showUpsell,
}: CommunityIssueSectionProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState(adminEmail);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!title.trim() || !email.trim()) return;

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("email", email.trim());
    if (body.trim()) formData.set("body", body.trim());

    startTransition(async () => {
      const result = await submitCommunityIssue(formData);
      if (result.success && result.data) {
        setTitle("");
        setBody("");
        toast({
          title: `Issue #${result.data.issueNumber} created`,
          description: (
            <a
              href={result.data.issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline"
            >
              View on GitHub
              <ExternalLink className="h-3 w-3" />
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
    });
  }

  return (
    <SettingsSection
      title="Community Support"
      description="Report bugs or request features — tracked on GitHub"
    >
      <div className="space-y-3">
        <Input
          placeholder="Issue title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPending}
          maxLength={200}
          aria-label="Issue title"
        />
        <Textarea
          placeholder="Describe your issue or feature request (optional)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={isPending}
          rows={3}
          maxLength={5000}
          aria-label="Issue details"
        />
        <Input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          aria-label="Email address"
        />
        <Button
          onClick={handleSubmit}
          disabled={isPending || !title.trim() || !email.trim()}
          size="sm"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Submit Issue
        </Button>
      </div>

      <p className="text-xs text-muted-foreground pt-2">
        Community issues are tracked on GitHub.
      </p>
      {showUpsell && (
        <p className="text-xs text-muted-foreground">
          For priority response times, subscribe to Priority Support in{" "}
          <Link
            href="/admin/settings/plan"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Settings &gt; Plan
          </Link>
          .
        </p>
      )}
    </SettingsSection>
  );
}
