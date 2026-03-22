"use client";

import { Fragment, type ReactNode } from "react";
import Image from "next/image";
import { ChevronRight, ScrollText, Store } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/hooks/useSiteSettings";

// ─── Shared setup UI ────────────────────────────────────────────────────────

type SetupStep = "eula" | "account";

const STEPS = [
  {
    key: "eula" as SetupStep,
    icon: ScrollText,
    title: "Terms & License",
    description: "A quick read before we begin",
  },
  {
    key: "account" as SetupStep,
    icon: Store,
    title: "Your Store",
    description: "Create your admin account",
  },
];

// ─── Split layout — 1/4 branded sidebar | 3/4 content ────────────────────────

export function SetupLayout({ children }: { children: ReactNode }) {
  const { settings } = useSiteSettings();
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left sidebar — 1/4 width, hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/4 shrink-0 relative flex-col justify-between p-8">
        {/* Full-bleed coffee background */}
        <Image
          src="/images/sergey-kotenev-ayFB837en48-unsplash.jpg"
          alt="Coffee"
          fill
          sizes="25vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/55" />

        {/* Top: logo + name + brand desc */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2.5">
            <Image
              src={settings.storeLogoUrl || "/logo.svg"}
              alt={settings.storeName}
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="text-white font-semibold text-sm drop-shadow">{settings.storeName}</span>
          </div>
          <p className="text-white/60 text-sm leading-relaxed">
            An open-source platform for roasters who believe coffee is more than a commodity.
            Share your craft, build your community.
          </p>
        </div>

        {/* Bottom: tagline + unsplash credit */}
        <div className="relative z-10 space-y-4">
          <div>
            <p className="text-white text-3xl font-black leading-none tracking-tight uppercase">
              Your store.
            </p>
            <p className="text-white/70 text-3xl font-black leading-none tracking-tight uppercase">
              Your beans.
            </p>
            <p className="text-white/40 text-3xl font-black leading-none tracking-tight uppercase">
              Your rules.
            </p>
          </div>
          <p className="text-white/40 text-xs leading-relaxed">
            No platform tax. No vendor lock-in.<br />MIT licensed and yours to keep.
          </p>
          <p className="text-white/25 text-xs">
            Photo by Sergey Kotenev · Unsplash
          </p>
        </div>
      </div>

      {/* Right — 3/4 content area */}
      <div className="flex-1 flex flex-col bg-background overflow-y-auto min-h-screen lg:min-h-0">
        {/* Mobile: logo strip */}
        <div className="lg:hidden flex items-center gap-2.5 px-6 pt-6 pb-4 border-b">
          <Image
            src={settings.storeLogoUrl || "/logo.svg"}
            alt={settings.storeName}
            width={28}
            height={28}
            className="rounded-full"
          />
          <span className="font-semibold text-sm">{settings.storeName}</span>
        </div>

        <div className="flex-1 px-10 py-12 sm:px-14 lg:px-20 lg:py-16 max-w-3xl">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Stepper ─────────────────────────────────────────────────────────────────

export function SetupStepper({ current }: { current: SetupStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);
  return (
    <nav aria-label="Setup steps" className="mb-6">
      <ol className="flex items-center gap-x-1">
        {STEPS.map((step, i) => {
          const isActiveOrDone = i <= currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <Fragment key={step.key}>
              <li className="flex items-center gap-3 shrink-0">
                <Avatar className="h-9 w-9">
                  <AvatarFallback
                    className={cn(
                      "transition-colors",
                      isActiveOrDone
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <step.icon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span
                    className={cn(
                      "text-sm font-medium leading-tight",
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="text-xs text-muted-foreground">{step.description}</span>
                </div>
              </li>
              {i < STEPS.length - 1 && (
                <li aria-hidden>
                  <ChevronRight className="h-4 w-4 text-muted-foreground mx-2 shrink-0" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────

export function SetupHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold leading-tight">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

// ─── Mobile logo (no longer rendered — logo is in SetupLayout overlay) ───────
/** @deprecated Logo now lives in SetupLayout. Kept for backward compat. */
export function SetupMobileLogo() {
  return null;
}

/** @deprecated Use SetupMobileLogo instead */
export function SetupLogo() {
  return null;
}
