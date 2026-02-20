"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const BACK_SENTINEL = "__back__";

interface UnsavedChangesGuardProps {
  isDirty: boolean;
}

export function UnsavedChangesGuard({ isDirty }: UnsavedChangesGuardProps) {
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const isDirtyRef = useRef(isDirty);
  const navigatingRef = useRef(false);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // beforeunload — refresh / tab close
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Push a guard entry so back-click pops ours first (not Next.js's)
  // Intercept back / forward via popstate
  useEffect(() => {
    window.history.pushState({ __guard: true }, "");

    const onPopState = () => {
      if (navigatingRef.current) return;

      if (!isDirtyRef.current) {
        // Not dirty — let browser go back past the guard entry
        window.history.back();
        return;
      }

      // Dirty — re-push guard entry to stay on page, show dialog
      window.history.pushState({ __guard: true }, "");
      setPendingHref(BACK_SENTINEL);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Intercept <a> link clicks (captures Next.js <Link> too)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!isDirtyRef.current || navigatingRef.current) return;

      const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) return;

      // Same page — allow
      if (href === window.location.pathname) return;

      e.preventDefault();
      e.stopPropagation();
      setPendingHref(href);
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  const handleConfirm = useCallback(() => {
    navigatingRef.current = true;
    isDirtyRef.current = false;
    const href = pendingHref;
    setPendingHref(null);

    if (href === BACK_SENTINEL) {
      // Go back: our guard entry is already popped, so one back() navigates away
      window.history.back();
    } else if (href) {
      window.location.href = href;
    }
  }, [pendingHref]);

  const handleCancel = useCallback(() => {
    setPendingHref(null);
  }, []);

  return (
    <AlertDialog open={pendingHref !== null}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes that will be lost if you leave this page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Stay</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Leave</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
