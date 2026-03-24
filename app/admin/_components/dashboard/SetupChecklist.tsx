"use client";

import { useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  CreditCard,
  Mail,
  Package,
  Palette,
  X,
} from "lucide-react";

const DISMISS_KEY = "artisan-setup-checklist-dismissed";

let listeners: Array<() => void> = [];

function subscribe(callback: () => void) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function getSnapshot(): boolean {
  return localStorage.getItem(DISMISS_KEY) === "true";
}

function getServerSnapshot(): boolean {
  return true; // Hide on server to prevent flash
}

function dismiss() {
  localStorage.setItem(DISMISS_KEY, "true");
  listeners.forEach((l) => l());
}

export interface SetupStatus {
  hasProducts: boolean;
  hasPayments: boolean;
  hasEmail: boolean;
}

const checks = [
  {
    key: "hasProducts" as const,
    label: "Add your products",
    href: "/admin/products/new",
    linkText: "Add product",
    icon: Package,
  },
  {
    key: "hasPayments" as const,
    label: "Configure payments (Stripe)",
    href: "https://github.com/yuens1002/artisan-roast/blob/main/INSTALLATION.md#optional-integrations",
    linkText: "Setup guide",
    icon: CreditCard,
    external: true,
  },
  {
    key: "hasEmail" as const,
    label: "Configure email (Resend)",
    href: "https://github.com/yuens1002/artisan-roast/blob/main/INSTALLATION.md#optional-integrations",
    linkText: "Setup guide",
    icon: Mail,
    external: true,
  },
];

const suggestions = [
  {
    label: "Customize your store branding",
    href: "/admin/settings",
    linkText: "Settings",
    icon: Palette,
  },
];

export function SetupChecklist({ status }: { status: SetupStatus }) {
  const dismissed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const handleDismiss = useCallback(() => {
    dismiss();
  }, []);

  const completedCount = checks.filter((c) => status[c.key]).length;

  if (dismissed) return null;

  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            Getting started ({completedCount}/{checks.length})
          </h3>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            Complete these steps to get the most out of your store.
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          aria-label="Dismiss setup checklist"
          className="shrink-0 text-amber-600 hover:text-amber-800 dark:text-amber-400"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ul className="mt-4 space-y-3">
        {checks.map((check) => {
          const done = status[check.key];
          const Icon = check.icon;
          return (
            <li key={check.key} className="flex items-center gap-3 text-sm">
              {done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-amber-400 dark:text-amber-500" />
              )}
              <Icon className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
              <span
                className={
                  done
                    ? "text-muted-foreground line-through"
                    : "text-amber-900 dark:text-amber-100"
                }
              >
                {check.label}
              </span>
              {!done && (
                <Link
                  href={check.href}
                  className="ml-auto text-xs font-medium text-amber-700 underline hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
                  {...(check.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {check.linkText}
                </Link>
              )}
            </li>
          );
        })}
        {suggestions.map((s) => {
          const Icon = s.icon;
          return (
            <li key={s.href} className="flex items-center gap-3 text-sm">
              <Circle className="h-4 w-4 shrink-0 text-amber-400 dark:text-amber-500" />
              <Icon className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
              <span className="text-amber-900 dark:text-amber-100">{s.label}</span>
              <Link
                href={s.href}
                className="ml-auto text-xs font-medium text-amber-700 underline hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
              >
                {s.linkText}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
