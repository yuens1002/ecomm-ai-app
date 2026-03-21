"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import { useSiteSettings } from "@/hooks/useSiteSettings";

type Step = "eula" | "account";

interface SetupStepperProps {
  current: Step;
}

export function SetupStepper({ current }: SetupStepperProps) {
  const steps: { key: Step; label: string }[] = [
    { key: "eula", label: "EULA" },
    { key: "account", label: "Store Setup" },
  ];
  const currentIndex = steps.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-center mb-6">
      {steps.map((step, i) => {
        const isComplete = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-3 h-3 rounded-full border-2 transition-colors ${
                  isComplete || isActive
                    ? "bg-primary border-primary"
                    : "bg-background border-muted-foreground/40"
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-16 h-px mx-2 mb-4 transition-colors ${
                  isComplete ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface SetupHeaderProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function SetupHeader({ icon, title, description }: SetupHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="shrink-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="flex flex-col justify-center">
        <h2 className="text-xl font-bold leading-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function SetupLogo() {
  const { settings } = useSiteSettings();
  return (
    <div className="flex justify-center mb-6">
      <Image
        src={settings.storeLogoUrl || "/logo.svg"}
        alt={settings.storeName}
        width={56}
        height={56}
        className="rounded-full"
      />
    </div>
  );
}
