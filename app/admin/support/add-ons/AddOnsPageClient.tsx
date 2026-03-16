"use client";

import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { Button } from "@/components/ui/button";
import type { LicenseInfo } from "@/lib/license-types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AddOnsPageClientProps {
  license: LicenseInfo;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AddOnsPageClient({ license }: AddOnsPageClientProps) {
  const packages = license.alaCarte;

  return (
    <div className="max-w-5xl space-y-8">
      <PageTitle
        title="Add-Ons"
        subtitle="Purchase one-time support packages — never expire"
      />

      {packages.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {packages.map((pkg) => (
            <div key={pkg.id} className="flex flex-col rounded-lg border p-6 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">{pkg.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {pkg.description}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <Button size="sm" asChild>
                    <a
                      href={pkg.checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Purchase
                    </a>
                  </Button>
                  <span className="text-lg font-bold">{pkg.price}</span>
                </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No add-on packages available at this time.
            </p>
        </div>
      )}
    </div>
  );
}
