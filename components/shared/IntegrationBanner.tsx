"use client";

import { AlertTriangle } from "lucide-react";

interface IntegrationBannerProps {
  service: "Stripe" | "Resend";
  context?: string;
}

const messages: Record<string, string> = {
  Stripe:
    "Payment processing is not configured. Customers cannot check out until Stripe keys are added.",
  Resend:
    "Email sending is not configured. Order confirmations and notifications will be skipped.",
};

export function IntegrationBanner({ service, context }: IntegrationBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
      <div className="text-sm text-yellow-800 dark:text-yellow-200">
        <strong>{service} not configured.</strong>{" "}
        {context || messages[service]}{" "}
        <a
          href="https://github.com/yuens1002/artisan-roast/blob/main/INSTALLATION.md#optional-integrations"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-yellow-900 dark:hover:text-yellow-100"
        >
          Setup guide
        </a>
      </div>
    </div>
  );
}
