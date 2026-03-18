"use client";

import { Circle, CircleCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LegalDocument } from "@/lib/legal-utils";
import type { LegalState } from "@/lib/license-types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DocVersionStatusProps {
  doc: LegalDocument;
  legalState: LegalState | null;
  onAccept?: () => void;
  isPending?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocVersionStatus({
  doc,
  legalState,
  onAccept,
  isPending,
}: DocVersionStatusProps) {
  const acceptedVersion = legalState?.acceptedVersions?.[doc.slug];
  const acceptedAt = legalState?.acceptedAt?.[doc.slug];
  const needsAcceptance =
    legalState?.pendingAcceptance?.includes(doc.slug) ?? false;

  // Build rows: current version state first, then acceptance history below.
  // History (acceptedVersions) is always shown regardless of current plan status —
  // pendingAcceptance is ephemeral, but past acceptances are a permanent record.
  type Row =
    | { version: string; state: "pending" }
    | { version: string; state: "accepted"; date: string | null };

  const rows: Row[] = [];

  if (needsAcceptance) {
    // Action required: show current version as pending
    rows.push({ version: doc.version, state: "pending" });
  } else if (acceptedVersion === doc.version) {
    // Current version is already accepted — show it as the top row
    rows.push({ version: acceptedVersion, state: "accepted", date: acceptedAt ?? null });
  }
  // else: current version needs no action and wasn't accepted under this slug —
  // just show history below without a "current" row

  // Always append history if there's a prior accepted version different from current
  if (acceptedVersion && acceptedVersion !== doc.version) {
    rows.push({ version: acceptedVersion, state: "accepted", date: acceptedAt ?? null });
  }

  if (rows.length === 0) return null;

  return (
    <div>
      {rows.map((row, idx) => (
        <div
          key={row.version}
          className={`flex items-center gap-3 ${idx < rows.length - 1 ? "mb-3" : ""}`}
        >
          {/* Status icon */}
          {row.state === "accepted" ? (
            <CircleCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
          )}

          {/* Version + status */}
          <div className="flex items-center gap-3 text-sm">
            <span className="font-mono text-xs text-muted-foreground">
              v{row.version}
            </span>
            {row.state === "pending" ? (
              onAccept ? (
                <Button
                  onClick={onAccept}
                  disabled={isPending}
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs"
                >
                  {isPending && (
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  )}
                  Accept
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Pending acceptance
                </span>
              )
            ) : (
              <span className="text-xs text-muted-foreground">
                Accepted
                {row.date
                  ? ` · ${new Date(row.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}`
                  : ""}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
