"use client";

import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSearchDrawerStore } from "./store";
import { cn } from "@/lib/utils";

/**
 * Search drawer overlay. Fullscreen on mobile, top-anchored on desktop with
 * backdrop blur for "context underneath".
 *
 * Body content is filled in by subsequent commits (search input wiring,
 * empty/results/no-results states, fade-in animation).
 */
export function SearchDrawer() {
  const isOpen = useSearchDrawerStore((s) => s.isOpen);
  const close = useSearchDrawerStore((s) => s.close);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        className={cn(
          // Reset shadcn Dialog defaults that center on screen
          "p-0 gap-0 max-w-none rounded-none border-0 sm:rounded-none",
          // Mobile: fullscreen
          "fixed inset-0 left-0 right-0 top-0 bottom-0 translate-x-0 translate-y-0 w-screen h-screen",
          // Desktop: top-anchored, max-w-4xl, max-h-[80vh], rounded bottom
          "md:left-1/2 md:right-auto md:top-0 md:bottom-auto md:-translate-x-1/2 md:translate-y-0",
          "md:w-full md:max-w-4xl md:max-h-[80vh] md:rounded-b-xl md:border md:shadow-lg",
          // Animation handled by Dialog's built-in data-state animations
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "md:data-[state=open]:slide-in-from-top-4 md:data-[state=closed]:slide-out-to-top-4",
          "duration-200"
        )}
      >
        <DialogTitle className="sr-only">Search products</DialogTitle>
        <DialogDescription className="sr-only">
          Search for coffee, brewing equipment, and more.
        </DialogDescription>

        <div className="flex flex-col h-full md:max-h-[80vh] overflow-hidden">
          {/* Search input row */}
          <div className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products…"
                className="pl-10 h-11 text-base"
                autoFocus
              />
            </div>
          </div>

          {/* Body — filled by subsequent commits */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8">
            <p className="text-sm text-muted-foreground">
              Search drawer scaffold — body content wired in subsequent commits.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
