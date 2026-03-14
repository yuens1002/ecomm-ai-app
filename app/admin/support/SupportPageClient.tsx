"use client";

import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { SupportTicketsSection } from "./SupportTicketsSection";
import { CommunityIssueSection } from "./CommunityIssueSection";
import type { LicenseInfo } from "@/lib/license-types";
import type { TicketsResponse } from "@/lib/support-types";

interface SupportPageClientProps {
  license: LicenseInfo;
  supportData: TicketsResponse | null;
}

export function SupportPageClient({
  license,
  supportData,
}: SupportPageClientProps) {
  const hasPrioritySupport = license.features.includes("priority-support");

  return (
    <div className="space-y-8">
      <PageTitle
        title="Submit Ticket"
        subtitle="Report issues or request support"
      />

      {/* ==================== PRIORITY SUPPORT ==================== */}
      {hasPrioritySupport && supportData && (
        <SupportTicketsSection
          initialTickets={supportData.tickets}
          initialUsage={supportData.usage}
        />
      )}

      {/* ==================== COMMUNITY ISSUES ==================== */}
      <CommunityIssueSection showUpsell={!hasPrioritySupport} />
    </div>
  );
}
