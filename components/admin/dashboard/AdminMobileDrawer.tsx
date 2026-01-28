"use client";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  adminNavConfig,
  isNavChildActive,
  isNavItemActive,
  type NavChild,
  type NavItem,
} from "@/lib/admin-nav-config";
import { cn } from "@/lib/utils";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, ChevronRight, Menu, Settings, Users, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import * as React from "react";

interface AdminMobileDrawerProps {
  storeName: string;
  storeLogoUrl?: string;
}

// Transform nav config to flatten "More" into separate sections
function getMobileNavItems(): NavItem[] {
  const items: NavItem[] = [];

  for (const item of adminNavConfig) {
    if (item.label === "More" && item.children) {
      // Split "More" into Management and Settings sections
      const managementItems: NavChild[] = [];
      const settingsItems: NavChild[] = [];
      let currentSection: "management" | "settings" | null = null;

      for (const child of item.children) {
        if (child.section === "Management") {
          currentSection = "management";
        } else if (child.section === "Settings") {
          currentSection = "settings";
        }

        if (currentSection === "management") {
          managementItems.push({ ...child, section: undefined, sectionIcon: undefined });
        } else if (currentSection === "settings") {
          settingsItems.push({ ...child, section: undefined, sectionIcon: undefined });
        }
      }

      if (managementItems.length > 0) {
        items.push({
          label: "Management",
          icon: Users,
          children: managementItems,
        });
      }

      if (settingsItems.length > 0) {
        items.push({
          label: "Settings",
          icon: Settings,
          children: settingsItems,
        });
      }
    } else {
      items.push(item);
    }
  }

  return items;
}

function NavSection({
  item,
  pathname,
  searchParams,
  isExpanded,
  onToggle,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  searchParams: URLSearchParams;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  // Direct link (no children)
  if (!hasChildren && item.href) {
    const isActive = pathname === item.href;
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md min-h-[48px] transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-accent text-accent-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
        {item.label}
      </Link>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium rounded-md min-h-[48px] transition-colors hover:bg-accent hover:text-accent-foreground">
        <span className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          {item.label}
        </span>
        <ChevronRight
          className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-90")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        <div className="pl-8 pr-2 py-1">
          {item.children?.map((child) => {
            const isChildActive = isNavChildActive(child, pathname, searchParams);

            if (child.disabled) {
              return (
                <div
                  key={child.href}
                  className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground opacity-50 min-h-[48px]"
                >
                  <span>{child.label}</span>
                  {child.disabledLabel && <span className="text-xs">({child.disabledLabel})</span>}
                </div>
              );
            }

            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center px-4 py-3 text-sm rounded-md min-h-[48px] transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isChildActive && "bg-accent text-accent-foreground font-medium"
                )}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AdminMobileDrawer({ storeName, storeLogoUrl }: AdminMobileDrawerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);

  const mobileNavItems = React.useMemo(() => getMobileNavItems(), []);

  // Determine which section should be expanded based on current path
  const getInitialExpanded = React.useCallback(() => {
    const expanded: Record<string, boolean> = {};
    for (const item of mobileNavItems) {
      expanded[item.label] = isNavItemActive(item, pathname);
    }
    return expanded;
  }, [mobileNavItems, pathname]);

  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>(() =>
    getInitialExpanded()
  );

  // Reset expanded state when drawer opens
  React.useEffect(() => {
    if (open) {
      setExpandedSections(getInitialExpanded());
    }
  }, [open, getInitialExpanded]);

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const handleNavigate = () => {
    setOpen(false);
  };

  return (
    <SheetPrimitive.Root open={open} onOpenChange={setOpen}>
      <SheetPrimitive.Trigger asChild>
        <Button variant="ghost" size="icon" className="h-11 w-11 lg:hidden -ml-3.5">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetPrimitive.Trigger>
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <SheetPrimitive.Content
          className="fixed inset-y-0 left-0 z-50 h-full w-80 bg-background shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left flex flex-col"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Header with logo OR store name */}
          <div className="flex items-center justify-between px-4 py-4">
            {storeLogoUrl ? (
              <>
                <Image
                  src={storeLogoUrl}
                  alt={storeName}
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
                <SheetPrimitive.Title className="sr-only">{storeName}</SheetPrimitive.Title>
              </>
            ) : (
              <SheetPrimitive.Title className="font-semibold text-lg">
                {storeName}
              </SheetPrimitive.Title>
            )}
            <SheetPrimitive.Close asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" tabIndex={-1}>
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </SheetPrimitive.Close>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-2 py-2">
            {mobileNavItems.map((item) => (
              <NavSection
                key={item.label}
                item={item}
                pathname={pathname}
                searchParams={searchParams}
                isExpanded={expandedSections[item.label] ?? false}
                onToggle={() => toggleSection(item.label)}
                onNavigate={handleNavigate}
              />
            ))}
          </nav>

          {/* Footer - Back to public site */}
          <div className="border-t px-2 py-3">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleNavigate}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md min-h-[48px] transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
              Open public site
            </Link>
          </div>
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}
