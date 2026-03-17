import { notFound } from "next/navigation";
import { getTicketDetail } from "@/lib/support";
import { SupportError } from "@/lib/support";
import { TicketDetailClient } from "./TicketDetailClient";
import type { TicketDetailResponse } from "@/lib/support-types";

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({
  params,
}: TicketDetailPageProps) {
  const { id } = await params;

  let data: TicketDetailResponse;
  try {
    data = await getTicketDetail(id);
  } catch (error) {
    if (error instanceof SupportError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <TicketDetailClient ticket={data.ticket} replies={data.replies} />
  );
}
