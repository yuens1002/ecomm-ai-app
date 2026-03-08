import {
  CalendarOff,
  PlayCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import type { RowActionConfigEntry } from "@/components/shared/data-table/row-action-config";
import type { Subscription } from "../hooks/useSubscriptionsTable";

// ── Predicates ─────────────────────────────────────────────────────

const isActionable = (s: Subscription) =>
  !s.cancelAtPeriodEnd && s.status !== "CANCELED";
const isActive = (s: Subscription) => s.status === "ACTIVE";
const isPaused = (s: Subscription) => s.status === "PAUSED";
const isCancellable = (s: Subscription) =>
  s.status === "ACTIVE" || s.status === "PAUSED" || s.status === "PAST_DUE";
const hasStripeId = (s: Subscription) => !!s.stripeSubscriptionId;

// ── Config ─────────────────────────────────────────────────────────

export const adminSubscriptionRowActions: RowActionConfigEntry<Subscription>[] =
  [
    {
      id: "skipBilling",
      type: "item",
      label: "Skip Next Billing",
      icon: CalendarOff,
      when: (s) => isActionable(s) && isActive(s),
    },
    {
      id: "resume",
      type: "item",
      label: "Resume Subscription",
      icon: PlayCircle,
      when: (s) => isActionable(s) && isPaused(s),
    },
    {
      id: "cancel",
      type: "item",
      label: "Cancel Subscription",
      icon: XCircle,
      variant: "destructive",
      when: (s) => isActionable(s) && isCancellable(s),
    },
    {
      id: "manageStripe",
      type: "item",
      label: "Manage in Stripe",
      icon: ExternalLink,
      when: (s) => isActionable(s) && hasStripeId(s),
    },
  ];
