import { Leaf } from "lucide-react";
import { RoastLevel } from "@prisma/client";

const brewMethodsByRoast: Record<RoastLevel, string[]> = {
  LIGHT: ["Pour-over (V60/Chemex)", "Aeropress", "Filter"],
  MEDIUM: ["Drip", "Chemex", "Aeropress"],
  DARK: ["Espresso", "French press", "Moka"],
};

interface CoffeeDetailsProps {
  roastLevel: RoastLevel | null;
  variety: string | null;
  altitude: string | null;
  isOrganic: boolean;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-text-base">{value}</dd>
    </div>
  );
}

export function CoffeeDetails({
  roastLevel,
  variety,
  altitude,
  isOrganic,
}: CoffeeDetailsProps) {
  const brewMethods = roastLevel ? brewMethodsByRoast[roastLevel] : null;

  return (
    <dl className="flex flex-col gap-4">
      {brewMethods && (
        <DetailItem label="Best For" value={brewMethods.join(", ")} />
      )}
      {variety && <DetailItem label="Variety" value={variety} />}
      {altitude && <DetailItem label="Altitude" value={altitude} />}
      {isOrganic && (
        <div className="flex items-center gap-1.5 text-sm text-emerald-700">
          <Leaf className="h-4 w-4" />
          <span>Certified Organic</span>
        </div>
      )}
    </dl>
  );
}
