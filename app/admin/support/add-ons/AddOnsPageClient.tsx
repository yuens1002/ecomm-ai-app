"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { startAlaCarteCheckout } from "./actions";
import type { LicenseInfo } from "@/lib/license-types";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

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
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  function handlePurchase(alaCarteSlug: string) {
    const formData = new FormData();
    formData.set("alaCarteSlug", alaCarteSlug);

    startTransition(async () => {
      const result = await startAlaCarteCheckout(formData);
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        toast({
          title: "Checkout failed",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="max-w-5xl space-y-8">
      <PageTitle
        title="Add-Ons"
        subtitle="Purchase one-time support packages — never expire"
      />

      {DEMO_MODE && (
        <div className="rounded-lg border border-dashed py-4 px-6 text-center">
          <p className="text-sm text-muted-foreground">
            Checkout is disabled in demo mode.
          </p>
        </div>
      )}

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
                  <Button
                    size="sm"
                    disabled={isPending || DEMO_MODE}
                    onClick={() => handlePurchase(pkg.id)}
                  >
                    {isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Purchase
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
