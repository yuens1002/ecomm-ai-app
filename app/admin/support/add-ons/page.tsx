import { validateLicense } from "@/lib/license";
import { AddOnsPageClient } from "./AddOnsPageClient";
import type { AlaCartePackage } from "@/lib/license-types";

const DEMO_ALA_CARTE: AlaCartePackage[] = [
  {
    id: "alacarte-tickets-5",
    label: "5 Support Tickets",
    description: "Add 5 priority support tickets to your account. Never expire.",
    price: "$39",
    checkoutUrl: "#",
  },
  {
    id: "alacarte-sessions-2",
    label: "2 One-on-One Sessions (30 min)",
    description: "Add 2 scheduled 1:1 sessions. Never expire.",
    price: "$99",
    checkoutUrl: "#",
  },
];

export default async function AddOnsPage() {
  const license = await validateLicense();

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const alaCarte =
    isDemoMode && license.alaCarte.length === 0
      ? DEMO_ALA_CARTE
      : license.alaCarte;

  return <AddOnsPageClient license={{ ...license, alaCarte }} />;
}
