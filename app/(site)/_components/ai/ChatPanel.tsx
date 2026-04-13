"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, ArrowUp, RotateCcw, FileText, MessageSquareDot } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPlaceholderImage } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { useChatPanelStore, type ChatMessage, type ProductSummary } from "@/lib/store/chat-panel-store";

// ---------------------------------------------------------------------------
// Types matching the /api/search response shape
// ---------------------------------------------------------------------------

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  type: "COFFEE" | "MERCH";
  roastLevel: string | null;
  tastingNotes: string[];
  description: string | null;
  categories: Array<{ category: { name: string; slug: string } }>;
  variants: Array<{
    images: Array<{ url: string; altText: string | null }>;
    purchaseOptions: Array<{ type: string; priceInCents: number }>;
  }>;
}

interface SearchResponse {
  products: SearchProduct[];
  explanation: string | null;
  acknowledgment: string | null;
  followUpQuestion: string | null;
  followUps: string[];
  intent: string | null;
  aiFailed?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapProduct(p: SearchProduct): ProductSummary {
  const firstVariant = p.variants[0];
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    imageUrl: firstVariant?.images[0]?.url || getPlaceholderImage(p.name, 400),
    categorySlug: p.categories[0]?.category.slug ?? null,
    productType: p.type ?? null,
    roastLevel: p.roastLevel ?? null,
    tastingNotes: p.tastingNotes ?? [],
    description: p.description ?? null,
  };
}

function prettifyPathname(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  if (!last) return "Home";
  return last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const GREETING_ID = "panel-greeting";

// ---------------------------------------------------------------------------
// Inner panel content
// ---------------------------------------------------------------------------

function PanelContent() {
  const {
    isOpen,
    messages,
    pageContext,
    isLoading,
    voiceSurfaces,
    addMessage,
    updateLastMessage,
    setLoading,
    loadSurfaces,
  } = useChatPanelStore();
  const pathname = usePathname();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionId = useRef(`panel-${Date.now()}`);
  const hasGreeted = useRef(false);

  const contextTitle = pageContext?.title ?? prettifyPathname(pathname);

  // Detect page type from pathname for context-aware greetings
  const getContextGreeting = (): string => {
    const surfaces = useChatPanelStore.getState().voiceSurfaces;
    // Product page: /products/<slug>
    const productMatch = pathname.match(/^\/products\/([^/]+)$/);
    if (productMatch) {
      const productName = prettifyPathname(`/${productMatch[1]}`);
      return surfaces["greeting.product"].replace("{product}", productName);
    }
    // Category page: /categories/<slug> or /coffee, /merch, etc.
    const categoryMatch = pathname.match(/^\/categor(?:y|ies)\/([^/]+)$/);
    if (categoryMatch) {
      const categoryName = prettifyPathname(`/${categoryMatch[1]}`);
      return surfaces["greeting.category"].replace("{category}", categoryName);
    }
    // Homepage or other pages — open-ended greeting
    return surfaces["greeting.home"];
  };

  // Load voice surfaces on first open
  useEffect(() => {
    if (isOpen) void loadSurfaces();
  }, [isOpen, loadSurfaces]);

  // Add opening greeting the first time the panel opens with no messages
  useEffect(() => {
    if (isOpen && !hasGreeted.current) {
      hasGreeted.current = true;
      const state = useChatPanelStore.getState();
      if (state.messages.length === 0) {
        addMessage({
          id: GREETING_ID,
          role: "assistant",
          content: getContextGreeting(),
          isLoading: false,
        });
      }
    }
  }, [isOpen, addMessage, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [messages, isOpen]);

  // Scroll to bottom when mobile keyboard opens/closes (visual viewport resize)
  useEffect(() => {
    if (!isOpen) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      });
    };
    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
    };
  }, [isOpen]);

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
      if (contextTitle && contextTitle !== "Home") {
        params.set("pageTitle", contextTitle);
      }
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = (await res.json()) as SearchResponse;

      const products = data.aiFailed ? [] : (data.products ?? []).map(mapProduct);
      const hasProducts = products.length > 0;

      // Determine response content — never go silent. Uses voice surfaces
      // (owner's voice) for recovery messages.
      let content = data.acknowledgment || data.explanation || "";
      if (!content && data.aiFailed) {
        content = voiceSurfaces.aiFailed;
      } else if (!content && !hasProducts) {
        content = voiceSurfaces.noResults;
      }

      updateLastMessage({
        id: assistantMsgId,
        content,
        acknowledgment: data.acknowledgment ?? undefined,
        followUpQuestion: data.followUpQuestion ?? undefined,
        products,
        // Cadence rule: follow-ups only shown when >3 products (enforced in render)
        followUps: data.followUps ?? [],
        isLoading: false,
      });
    } catch {
      updateLastMessage({
        id: assistantMsgId,
        content: voiceSurfaces.error,
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
      {/* Messages — scrollable list, renders from top */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-4 pb-3 pt-4 space-y-4">
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

      {/* Input with send button embedded inside */}
      <form onSubmit={handleSubmit} className="shrink-0 px-4 pb-3 pt-1">
        <div className="relative">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={voiceSurfaces.placeholder}
            disabled={isLoading}
            className="text-sm h-9 rounded-full bg-muted/40 border-muted-foreground/20 focus-visible:bg-background pr-11"
          />
          <button
            type="submit"
            disabled={isLoading}
            aria-label="Send message"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>

      {/* Context strip */}
      <div className="shrink-0 px-4 pb-3">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <FileText className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
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
  const [showAll, setShowAll] = useState(false);

  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground text-sm px-3.5 py-2 rounded-2xl max-w-[85%] leading-snug">
          {msg.content}
        </div>
      </div>
    );
  }

  // Assistant loading — animated waiting filler from voice surfaces
  if (msg.isLoading) {
    const waitingText = useChatPanelStore.getState().voiceSurfaces.waiting;
    return (
      <div className="flex items-start gap-2 text-muted-foreground text-sm">
        <MessageSquareDot className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/50" />
        <span className="text-xs">
          {waitingText}
          <span className="waiting-dots" />
        </span>
      </div>
    );
  }

  const hasProducts = msg.products && msg.products.length > 0;
  const productCount = msg.products?.length ?? 0;
  const hasContent = !!msg.content;

  // Cadence rules (deterministic, code-enforced):
  // 1. Acknowledgment always first
  // 2. Products after acknowledgment
  // 3. Follow-up question + chips ONLY when products > 3
  // 4. Chips only alongside a follow-up question
  const showFollowUp =
    productCount > 3 && !!msg.followUpQuestion && msg.followUps && msg.followUps.length > 0;

  const visibleProducts = hasProducts
    ? showAll
      ? msg.products!
      : msg.products!.slice(0, 3)
    : [];
  const extraCount = hasProducts ? msg.products!.length - 3 : 0;

  return (
    <div className="space-y-2.5">
      {/* 1. Acknowledgment (always first when present) */}
      {hasContent && (
        <div className="flex items-start gap-2">
          <MessageSquareDot className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/50" />
          <p className="text-sm text-foreground/80 leading-relaxed">{msg.content}</p>
        </div>
      )}

      {/* 2. Product cards after acknowledgment */}
      {hasProducts && (
        <div className={extraCount > 0 ? "relative pb-3" : ""}>
          <div className="space-y-1.5">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {extraCount > 0 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
              <Badge
                variant="outline"
                role="button"
                tabIndex={0}
                onClick={() => setShowAll((s) => !s)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setShowAll((s) => !s); } }}
                aria-label={showAll ? "Show fewer products" : `Show ${extraCount} more products`}
                className="cursor-pointer text-muted-foreground font-normal bg-background hover:bg-accent hover:text-foreground transition-colors focus:ring-0 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {showAll ? "Less" : "More"}
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* 3. Follow-up question + chips (only when products > 3) */}
      {showFollowUp && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground pl-5">{msg.followUpQuestion}</p>
          <div className="flex flex-wrap gap-1.5 pl-5">
            {msg.followUps!.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => onChipClick(chip)}
                className="text-xs px-3 py-1.5 rounded-full border border-primary/40 hover:bg-primary/10 hover:border-primary/70 transition-colors text-primary"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compact product card
// ---------------------------------------------------------------------------

function ProductCard({ product }: { product: ProductSummary }) {
  const close = useChatPanelStore((s) => s.close);

  const isCoffee = product.productType === "COFFEE" || !!product.roastLevel;
  const roastLabel = product.roastLevel
    ? product.roastLevel.charAt(0).toUpperCase() + product.roastLevel.slice(1).toLowerCase() + " roast"
    : null;
  const secondLine = isCoffee
    ? [roastLabel, product.tastingNotes.join(", ")].filter(Boolean).join(" — ")
    : (product.description?.slice(0, 60) ?? null);

  return (
    <Link
      href={`/products/${product.slug}`}
      onClick={close}
      className="flex items-center gap-2.5 rounded-xl border border-border/50 p-2.5 hover:bg-accent hover:border-border transition-colors group"
    >
      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="40px"
            className="object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
          {product.name}
        </p>
        {secondLine && (
          <p className="text-xs text-muted-foreground truncate">{secondLine}</p>
        )}
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// ChatPanel — vaul Drawer overlay (right side)
// ---------------------------------------------------------------------------

export function ChatPanel() {
  const { isOpen, close, open, clearMessages, addMessage } = useChatPanelStore();
  const bodyCleanupRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  // Track visual viewport height so the drawer doesn't get obscured by the mobile keyboard
  useEffect(() => {
    if (!isOpen) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setViewportHeight(vv.height);
    onResize();
    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
      setViewportHeight(null);
    };
  }, [isOpen]);

  // Lock #site-scroll when drawer is open and clean up stale vaul body styles on close.
  useEffect(() => {
    if (bodyCleanupRef.current !== null) {
      clearTimeout(bodyCleanupRef.current);
      bodyCleanupRef.current = null;
    }
    if (!isOpen) return;
    const siteScroll = document.getElementById("site-scroll");
    if (siteScroll) siteScroll.style.overflow = "hidden";
    return () => {
      if (siteScroll) siteScroll.style.overflow = "";
      // Vaul direction="right" leaves stale pointer-events/overflow on body
      // after its close animation. Only clear if Vaul is no longer scroll-locking
      // so we don't interfere with other overlays that may still be open.
      bodyCleanupRef.current = setTimeout(() => {
        bodyCleanupRef.current = null;
        if (document.body.hasAttribute("data-scroll-locked")) return;
        if (document.body.style.pointerEvents === "none") {
          document.body.style.pointerEvents = "";
        }
        if (document.body.style.overflow === "hidden") {
          document.body.style.overflow = "";
        }
      }, 500);
    };
  }, [isOpen]);

  const handleReset = () => {
    clearMessages();
    const surfaces = useChatPanelStore.getState().voiceSurfaces;
    addMessage({
      id: GREETING_ID,
      role: "assistant",
      content: surfaces["greeting.home"],
      isLoading: false,
    });
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(o) => {
        if (o) open(); else close();
      }}
      direction="right"
      shouldScaleBackground={false}
    >
      <DrawerContent
        className="inset-y-0 right-0 left-auto h-full w-full sm:w-[min(25vw,360px)] rounded-none border-l border-t-0 border-b-0 focus:outline-none"
        style={viewportHeight ? { height: `${viewportHeight}px` } : undefined}
      >
        {/* Header row — title left, reset + close right */}
        <div className="shrink-0 px-4 py-2 flex items-center gap-2">
          <MessageSquareDot className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          <DrawerTitle className="flex-1 text-sm font-medium">
            Counter
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Chat about our products and get personalized recommendations
          </DrawerDescription>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
            onClick={handleReset}
            aria-label="New conversation"
            title="New conversation"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 -mr-2 rounded-full text-muted-foreground hover:text-foreground"
            onClick={close}
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <PanelContent />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
