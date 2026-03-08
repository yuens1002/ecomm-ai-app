"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

// ── Types ──────────────────────────────────────────────────────────

export interface ItemsCellItem {
  key: string;
  name: string;
  variant?: string;
  quantity?: number;
  cadence?: string;
  refundedQuantity?: number;
  imageUrl?: string;
  productHref?: string;
  /** Inline content rendered after the product name (e.g., review indicator) */
  inlineAction?: ReactNode;
}

interface ItemsCellProps {
  items: ItemsCellItem[];
  /** Apply line-through + muted styling (e.g., full refund) */
  strikethrough?: boolean;
  /** Render after all items (e.g., BuyAgainButton) */
  footer?: ReactNode;
}

// ── Component ──────────────────────────────────────────────────────

export function ItemsCell({ items, strikethrough, footer }: ItemsCellProps) {
  return (
    <div
      className={`space-y-2 ${strikethrough ? "line-through text-muted-foreground" : ""}`}
    >
      {items.map((item) => (
        <div key={item.key} className="flex items-start gap-2">
          {item.imageUrl && (
            <div className="relative h-10 w-10 shrink-0 rounded overflow-hidden bg-muted">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {item.productHref ? (
                <Link
                  href={item.productHref}
                  className="text-sm hover:text-primary truncate"
                >
                  {item.name}
                </Link>
              ) : (
                <span className="text-sm">{item.name}</span>
              )}
              {item.inlineAction}
            </div>
            {(item.variant || item.quantity != null) && (
              <div className="text-xs text-muted-foreground">
                {item.variant}
                {item.variant && item.quantity != null && " · "}
                {item.quantity != null && <>Qty: {item.quantity}</>}
                {item.cadence && ` · ${item.cadence}`}
                {item.refundedQuantity != null &&
                  item.refundedQuantity > 0 && (
                    <span className="text-red-600 ml-1">
                      (-{item.refundedQuantity})
                    </span>
                  )}
              </div>
            )}
          </div>
        </div>
      ))}
      {footer}
    </div>
  );
}
