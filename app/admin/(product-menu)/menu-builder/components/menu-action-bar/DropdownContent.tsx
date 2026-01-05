import {
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type DropdownSection = {
  label?: string;
  items: Array<{
    id: string;
    name: string;
    checked: boolean;
  }>;
};

type DropdownContentProps = {
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  sections: DropdownSection[];
  onItemToggle: (itemId: string, checked: boolean) => void | Promise<void>;
  emptyMessage?: string;
};

/**
 * Base dropdown content component for action bar dropdowns.
 * Provides consistent structure for labels, categories, and products.
 */
export function DropdownContent({
  searchable = false,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  sections,
  onItemToggle,
  emptyMessage = "No items found",
}: DropdownContentProps) {
  const hasItems = sections.some((section) => section.items.length > 0);

  return (
    <>
      {searchable && onSearchChange && (
        <div className="px-2 py-2 border-b sticky top-0 bg-popover z-10">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 h-9"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <div className="max-h-64 overflow-y-auto overflow-x-hidden">
        {!hasItems ? (
          <div className="px-2 py-6 text-sm text-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          sections.map((section, sectionIndex) => {
            if (section.items.length === 0) return null;

            const hasPreviousSections = sections
              .slice(0, sectionIndex)
              .some((s) => s.items.length > 0);

            return (
              <div key={sectionIndex}>
                {hasPreviousSections && <DropdownMenuSeparator />}
                {section.label && (
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                    {section.label}
                  </DropdownMenuLabel>
                )}
                {section.items.map((item) => (
                  <DropdownMenuCheckboxItem
                    key={item.id}
                    checked={item.checked}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={(checked) =>
                      onItemToggle(item.id, checked)
                    }
                  >
                    <span className="truncate">{item.name}</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
