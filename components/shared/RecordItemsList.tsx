import Link from "next/link";
import type { RecordItem } from "./MobileRecordCard";

interface RecordItemsListProps {
  items: RecordItem[];
}

export function RecordItemsList({ items }: RecordItemsListProps) {
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={item.id}>
          <div className="text-sm">
            {item.href ? (
              <Link
                href={item.href}
                className="text-text-base hover:text-primary"
              >
                {item.name}
              </Link>
            ) : (
              item.name
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {[item.variant, item.purchaseType, `Qty: ${item.quantity}`]
              .filter(Boolean)
              .join(" · ")}
          </div>
          {idx < items.length - 1 && (
            <div className="border-t border-border mt-2 pt-2" />
          )}
        </div>
      ))}
    </div>
  );
}
