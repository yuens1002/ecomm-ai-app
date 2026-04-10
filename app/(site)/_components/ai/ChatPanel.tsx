"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, Loader2, ChevronRight, Home, Coffee, Search, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SmartSearchIcon } from "@/components/shared/icons/SmartSearchIcon";
import { useChatPanelStore, type ChatMessage, type ProductSummary } from "@/stores/chat-panel-store";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

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

function getPathnameIcon(pathname: string): LucideIcon {
  if (pathname === "/") return Home;
  if (pathname.startsWith("/products/")) return Coffee;
  if (pathname === "/search") return Search;
  return FileText;
}

const GREETING_ID = "panel-greeting";
const GREETING =
  "What are you in the mood for? Tell me how you like to brew, what flavors you enjoy, or just ask — I'm here to help you find the perfect coffee.";

// ---------------------------------------------------------------------------
// Inner panel content (shared between desktop and mobile)
// ---------------------------------------------------------------------------

function PanelContent() {
  const {
    isOpen,
    messages,
    pageContext,
    isLoading,
    close,
    addMessage,
    updateLastMessage,
    setLoading,
  } = useChatPanelStore();
  const pathname = usePathname();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionId = useRef(`panel-${Date.now()}`);
  const hasGreeted = useRef(false);

  // Derive context — title from store if available, icon always from pathname
  const ContextIcon = getPathnameIcon(pathname);
  const contextTitle = pageContext?.title ?? prettifyPathname(pathname);

  // Add opening greeting the first time the panel opens with no messages
  useEffect(() => {
    if (isOpen && !hasGreeted.current) {
      hasGreeted.current = true;
      const current = useChatPanelStore.getState().messages;
      if (current.length === 0) {
        addMessage({ id: GREETING_ID, role: "assistant", content: GREETING, isLoading: false });
      }
    }
  }, [isOpen, addMessage]);

  // Auto-scroll to bottom on new messages
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
    <div className="relative flex flex-col h-full">
      {/* Floating close button — top-right, no header bar */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
        onClick={close}
      >
        <X className="h-3.5 w-3.5" />
        <span className="sr-only">Close panel</span>
      </Button>

      {/* Messages — anchored to bottom; spacer pushes up when few messages */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        <div className="flex-1" />
        <div className="px-4 pb-3 pt-2 space-y-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onChipClick={(chip) => void sendQuery(chip)}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="shrink-0 px-3 pb-3 pt-1">
        <div className="flex gap-2 items-center">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about our coffee…"
            disabled={isLoading}
            className="text-sm h-9 rounded-full bg-muted/40 border-muted-foreground/20 focus-visible:bg-background"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="h-9 w-9 rounded-full shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </form>

      {/* Context strip */}
      <div className="shrink-0 px-4 pb-3">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
          <ContextIcon className="h-3 w-3 shrink-0" />
          <span className="truncate">{contextTitle}</span>
        </div>
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
  const [showThoughts, setShowThoughts] = useState(false);

  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground text-sm px-3.5 py-2 rounded-2xl max-w-[85%] leading-snug">
          {msg.content}
        </div>
      </div>
    );
  }

  // Assistant loading
  if (msg.isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
        <span className="text-xs">Searching…</span>
      </div>
    );
  }

  const isGreeting = msg.id === GREETING_ID;
  const hasProducts = msg.products && msg.products.length > 0;
  const hasContent = !!msg.content;

  return (
    <div className="space-y-2.5">
      {/* Greeting or explanation — shown directly; search thoughts hidden behind toggle */}
      {hasContent && (
        <>
          {isGreeting || !hasProducts ? (
            <div className="flex items-start gap-2">
              <SmartSearchIcon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/50" />
              <p className="text-sm text-foreground/80 leading-relaxed">{msg.content}</p>
            </div>
          ) : (
            // Search result with products: explanation goes behind "AI thoughts" toggle
            <>
              <button
                type="button"
                onClick={() => setShowThoughts(!showThoughts)}
                className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                <ChevronRight
                  className={cn(
                    "h-3 w-3 transition-transform duration-150",
                    showThoughts && "rotate-90"
                  )}
                />
                {showThoughts ? "Hide thoughts" : "AI thoughts"}
              </button>
              {showThoughts && (
                <div className="pl-4 border-l-2 border-muted">
                  <p className="text-xs text-muted-foreground leading-relaxed">{msg.content}</p>
                </div>
              )}
            </>
          )}
        </>
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
      {!hasProducts && !msg.isLoading && !isGreeting && hasContent && (
        <p className="text-xs text-muted-foreground pl-5">
          No matching products found — try rephrasing.
        </p>
      )}

      {/* Follow-up chips — question framing from API */}
      {msg.followUps && msg.followUps.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {msg.followUps.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onChipClick(chip)}
              className="text-xs px-3 py-1.5 rounded-full border border-border/60 hover:bg-accent hover:border-border hover:text-accent-foreground transition-colors text-muted-foreground"
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
// Compact product card
// ---------------------------------------------------------------------------

function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="flex items-center gap-2.5 rounded-xl border border-border/50 p-2.5 hover:bg-accent hover:border-border transition-colors group"
    >
      {product.imageUrl ? (
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={40}
          height={40}
          className="w-10 h-10 object-cover rounded-lg shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-muted shrink-0" />
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
      {/* Desktop: sticky full-height sidebar — shadow only, no hard border */}
      <aside
        className={cn(
          "hidden md:flex flex-col",
          "sticky top-0 h-screen flex-shrink-0 overflow-hidden",
          "bg-background/96 backdrop-blur-sm",
          "shadow-[-2px_0_20px_rgba(0,0,0,0.07)]",
          "transition-[width] duration-300 ease-in-out",
          isOpen ? "w-[25vw] min-w-[280px]" : "w-0"
        )}
      >
        {/* Inner div keeps content at stable width during the collapse animation */}
        <div className="w-[25vw] min-w-[280px] h-full">
          <PanelContent />
        </div>
      </aside>

      {/* Mobile: fixed bottom sheet — shadow only, no hard top border */}
      <div
        className={cn(
          "fixed bottom-0 inset-x-0 z-50 md:hidden",
          "h-[50dvh] bg-background/96 backdrop-blur-sm",
          "shadow-[0_-2px_20px_rgba(0,0,0,0.1)]",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <PanelContent />
      </div>
    </>
  );
}
