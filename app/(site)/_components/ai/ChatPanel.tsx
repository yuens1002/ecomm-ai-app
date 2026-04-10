"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SmartSearchIcon } from "@/components/shared/icons/SmartSearchIcon";
import { useChatPanelStore, type ChatMessage, type ProductSummary } from "@/stores/chat-panel-store";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types matching the /api/search response shape
// ---------------------------------------------------------------------------

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  categories: Array<{ category: { name: string; slug: string } }>;
  variants: Array<{
    images: Array<{ url: string; altText: string | null }>;
    purchaseOptions: Array<{ type: string; priceInCents: number }>;
  }>;
}

interface SearchResponse {
  products: SearchProduct[];
  explanation: string | null;
  followUps: string[];
  intent: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapProduct(p: SearchProduct): ProductSummary {
  const firstVariant = p.variants[0];
  const oneTime = firstVariant?.purchaseOptions.find((o) => o.type === "ONE_TIME");
  const anyOption = firstVariant?.purchaseOptions[0];
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    priceInCents: oneTime?.priceInCents ?? anyOption?.priceInCents ?? null,
    imageUrl: firstVariant?.images[0]?.url ?? null,
    categorySlug: p.categories[0]?.category.slug ?? null,
  };
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function prettifyPathname(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  if (!last) return "Home";
  return last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getPathnameContext(pathname: string): { icon: string; title: string } {
  if (pathname === "/") return { icon: "🏠", title: "Home" };
  if (pathname.startsWith("/products/")) return { icon: "☕", title: prettifyPathname(pathname) };
  if (pathname === "/search") return { icon: "🔍", title: "Search" };
  if (pathname.startsWith("/categories/") || pathname.match(/^\/[^/]+$/)) {
    return { icon: "🏷️", title: prettifyPathname(pathname) };
  }
  return { icon: "📄", title: prettifyPathname(pathname) };
}

// ---------------------------------------------------------------------------
// Inner panel content (shared between desktop and mobile)
// ---------------------------------------------------------------------------

function PanelContent() {
  const { isOpen, messages, pageContext, isLoading, close, addMessage, updateLastMessage, setLoading } =
    useChatPanelStore();
  const pathname = usePathname();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionId = useRef(`panel-${Date.now()}`);

  const context = pageContext ?? getPathnameContext(pathname);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [messages, isOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendQuery = async (query: string) => {
    const q = query.trim();
    if (!q || isLoading) return;

    const userMsgId = `u-${Date.now()}`;
    const assistantMsgId = `a-${Date.now()}`;

    addMessage({ id: userMsgId, role: "user", content: q });
    addMessage({ id: assistantMsgId, role: "assistant", content: "", isLoading: true });
    setLoading(true);
    setInput("");

    const turnCount = messages.filter((m) => m.role === "user").length + 1;

    try {
      const params = new URLSearchParams({
        q,
        ai: "true",
        sessionId: sessionId.current,
        turnCount: String(turnCount),
      });
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = (await res.json()) as SearchResponse;

      updateLastMessage({
        id: assistantMsgId,
        content: data.explanation ?? "",
        products: (data.products ?? []).slice(0, 6).map(mapProduct),
        followUps: data.followUps ?? [],
        isLoading: false,
      });
    } catch {
      updateLastMessage({
        id: assistantMsgId,
        content: "Something went wrong — please try again.",
        isLoading: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendQuery(input);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 h-12 border-b shrink-0">
        <div className="flex items-center gap-2">
          <SmartSearchIcon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Ask AI</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={close}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close panel</span>
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-2">
            <SmartSearchIcon className="h-8 w-8 opacity-20" />
            <p className="text-sm">Ask anything about our coffee</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} onChipClick={(chip) => void sendQuery(chip)} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="shrink-0 px-3 pb-2 pt-2 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about our coffee…"
            disabled={isLoading}
            className="text-sm h-8"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="h-8 w-8 shrink-0">
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </form>

      {/* Context strip */}
      <div className="shrink-0 px-3 pb-2">
        <p className="text-[10px] text-muted-foreground truncate">
          {context.icon} {context.title}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({
  msg,
  onChipClick,
}: {
  msg: ChatMessage;
  onChipClick: (chip: string) => void;
}) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground text-sm px-3 py-1.5 rounded-full max-w-[85%]">
          {msg.content}
        </div>
      </div>
    );
  }

  // Assistant
  if (msg.isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
        <span>Searching…</span>
      </div>
    );
  }

  const hasProducts = msg.products && msg.products.length > 0;

  return (
    <div className="space-y-2">
      {msg.content && (
        <div className="flex items-start gap-1.5">
          <SmartSearchIcon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
          <p className="text-sm text-foreground">{msg.content}</p>
        </div>
      )}

      {/* Product cards */}
      {hasProducts && (
        <div className="space-y-1.5">
          {msg.products!.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* No results */}
      {!hasProducts && !msg.isLoading && msg.content && (
        <p className="text-xs text-muted-foreground pl-5">
          No matching products found — try rephrasing.
        </p>
      )}

      {/* Follow-up chips */}
      {msg.followUps && msg.followUps.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pl-5">
          {msg.followUps.map((chip) => (
            <button
              key={chip}
              onClick={() => onChipClick(chip)}
              className="text-xs px-2.5 py-1 rounded-full border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compact product card for panel
// ---------------------------------------------------------------------------

function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="flex items-center gap-2.5 rounded-md border p-2 hover:bg-accent transition-colors group"
    >
      {product.imageUrl ? (
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={40}
          height={40}
          className="w-10 h-10 object-cover rounded"
        />
      ) : (
        <div className="w-10 h-10 rounded bg-muted shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
          {product.name}
        </p>
        {product.priceInCents !== null && (
          <p className="text-xs text-muted-foreground">{formatPrice(product.priceInCents)}</p>
        )}
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// ChatPanel — desktop sidebar + mobile bottom sheet
// ---------------------------------------------------------------------------

export function ChatPanel() {
  const isOpen = useChatPanelStore((s) => s.isOpen);

  return (
    <>
      {/* Desktop: sticky full-height sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col",
          "sticky top-0 h-screen flex-shrink-0 overflow-hidden",
          "border-l bg-background",
          "transition-[width] duration-300 ease-in-out",
          isOpen ? "w-[25vw] min-w-[280px]" : "w-0"
        )}
      >
        {/* Inner div keeps content at stable width during transition */}
        <div className="w-[25vw] min-w-[280px] h-full">
          <PanelContent />
        </div>
      </aside>

      {/* Mobile: fixed bottom sheet */}
      <div
        className={cn(
          "fixed bottom-0 inset-x-0 z-50 md:hidden",
          "h-[25dvh] border-t bg-background",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <PanelContent />
      </div>
    </>
  );
}
