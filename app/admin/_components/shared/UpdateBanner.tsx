"use client";

import { useCallback, useSyncExternalStore } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";
import Link from "next/link";
import type { VersionInfo } from "@/lib/version";

const DISMISS_KEY = "artisan-update-dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// External store for dismiss state
let dismissListeners: Array<() => void> = [];

function subscribeToDismiss(callback: () => void) {
  dismissListeners.push(callback);
  return () => {
    dismissListeners = dismissListeners.filter((l) => l !== callback);
  };
}

function getDismissSnapshot(): boolean {
  const dismissedAt = localStorage.getItem(DISMISS_KEY);
  if (!dismissedAt) return false;
  const elapsed = Date.now() - parseInt(dismissedAt, 10);
  return elapsed < DISMISS_DURATION;
}

function getServerSnapshot(): boolean {
  return true; // Assume dismissed on server to prevent flash
}

function setDismissed(latestVersion?: string) {
  localStorage.setItem(DISMISS_KEY, Date.now().toString());
  if (latestVersion) {
    localStorage.setItem(`${DISMISS_KEY}-version`, latestVersion);
  }
  dismissListeners.forEach((l) => l());
}

export function UpdateBanner() {
  const dismissed = useSyncExternalStore(
    subscribeToDismiss,
    getDismissSnapshot,
    getServerSnapshot
  );

  const { data } = useSWR<VersionInfo>("/api/version/check", fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 24 * 60 * 60 * 1000, // Check every 24 hours
    dedupingInterval: 60 * 60 * 1000, // Dedupe for 1 hour
  });

  // Check if dismiss should be reset for new version
  const lastDismissedVersion =
    typeof window !== "undefined"
      ? localStorage.getItem(`${DISMISS_KEY}-version`)
      : null;
  const shouldShowForNewVersion =
    data?.latest && lastDismissedVersion !== data.latest;

  const handleDismiss = useCallback(() => {
    setDismissed(data?.latest);
  }, [data?.latest]);

  // Don't render if no update or dismissed (and not new version)
  if (!data?.updateAvailable || (dismissed && !shouldShowForNewVersion)) {
    return null;
  }

  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
      <RefreshCw className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Update available:</strong> v{data.latest} is now available.
          You&apos;re on v{data.current}.
        </span>
        <div className="flex gap-2">
          {data.changelogUrl && (
            <Button asChild size="sm" variant="outline">
              <Link href={data.changelogUrl} target="_blank" rel="noopener">
                View Changelog
              </Link>
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            aria-label="Dismiss update notification"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
