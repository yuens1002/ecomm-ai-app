import { create } from "zustand";
import type { VoiceSurfaces } from "@/lib/ai/voice-surfaces";
import { DEFAULT_VOICE_SURFACES } from "@/lib/ai/voice-surfaces";

export interface PageContext {
  icon: string;
  title: string;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  categorySlug: string | null;
  productType: "COFFEE" | "MERCH" | null;
  roastLevel: string | null;
  tastingNotes: string[];
  description: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  acknowledgment?: string;
  followUpQuestion?: string;
  products?: ProductSummary[];
  followUps?: string[];
  isLoading?: boolean;
}

interface ChatPanelState {
  isOpen: boolean;
  messages: ChatMessage[];
  pageContext: PageContext | null;
  isLoading: boolean;
  /** null while the initial lazy-init fetch is in flight; populated once loaded */
  voiceSurfaces: VoiceSurfaces | null;
  surfacesLoaded: boolean;
  /** true after the first greeting fires in this browser session */
  sessionGreeted: boolean;
  /** Full result set from the last search — used for client-side chip filtering */
  allProducts: ProductSummary[];
  // Actions
  open: () => void;
  close: () => void;
  toggle: () => void;
  setPageContext: (ctx: PageContext) => void;
  addMessage: (msg: ChatMessage) => void;
  updateLastMessage: (updates: Partial<ChatMessage>) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  setSessionGreeted: (v: boolean) => void;
  loadSurfaces: () => Promise<void>;
  /** Clears cached surfaces + messages so the next open re-fetches from the API */
  resetSurfaces: () => void;
  setAllProducts: (products: ProductSummary[]) => void;
  /** Narrow the last assistant message's products by chip label — no API call */
  filterByChip: (chip: string) => void;
}

export const useChatPanelStore = create<ChatPanelState>()((set, get) => ({
  isOpen: false,
  messages: [],
  pageContext: null,
  isLoading: false,
  voiceSurfaces: null,
  surfacesLoaded: false,
  sessionGreeted: false,
  allProducts: [],

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  setPageContext: (ctx) => set({ pageContext: ctx }),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  updateLastMessage: (updates) =>
    set((s) => {
      const messages = [...s.messages];
      const last = messages[messages.length - 1];
      if (last) messages[messages.length - 1] = { ...last, ...updates };
      return { messages };
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  clearMessages: () => set({ messages: [] }),

  setSessionGreeted: (v) => set({ sessionGreeted: v }),

  resetSurfaces: () =>
    set({ surfacesLoaded: false, voiceSurfaces: null, messages: [], sessionGreeted: false, allProducts: [] }),

  setAllProducts: (products) => set({ allProducts: products }),

  filterByChip: (chip) => {
    const { allProducts, messages } = get();
    if (allProducts.length === 0) return;

    const chipLower = chip.toLowerCase();
    // Split into meaningful content words — exclude stopwords that cause false text matches
    const STOPWORDS = new Set(["and", "or", "the", "for", "with", "from", "into", "this", "that", "they", "than", "then", "when", "what", "some", "just", "like", "also", "have", "your", "more", "good", "best", "great"]);
    const chipWords = chipLower.split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));

    // Brew method → suitable roast levels (pour-over/drip = light/medium; espresso/french press = medium/dark)
    const brewMethodRoasts: Record<string, string[]> = {
      "pour-over": ["light", "medium"], "pour over": ["light", "medium"],
      drip: ["light", "medium"], aeropress: ["light", "medium"],
      espresso: ["medium", "dark"], "moka pot": ["medium", "dark"],
      "french press": ["medium", "dark"], "french-press": ["medium", "dark"],
      "cold brew": ["medium", "dark"],
    };

    // Roast-level keyword mappings
    const roastKeywords: Record<string, string[]> = {
      bold: ["dark"], strong: ["dark"], intense: ["dark"],
      light: ["light"], bright: ["light"], lively: ["light"],
      smooth: ["medium", "light"], mellow: ["medium", "light"],
      medium: ["medium"],
    };

    // Check brew method first (whole chip phrase match), then roast keywords
    const matchedRoasts = new Set<string>();
    for (const [method, roasts] of Object.entries(brewMethodRoasts)) {
      if (chipLower.includes(method)) {
        roasts.forEach((r) => matchedRoasts.add(r));
      }
    }
    if (matchedRoasts.size === 0) {
      for (const [keyword, roasts] of Object.entries(roastKeywords)) {
        if (chipLower.includes(keyword)) {
          roasts.forEach((r) => matchedRoasts.add(r));
        }
      }
    }

    const textMatch = (p: ProductSummary) => {
      const searchable = [p.name, p.description ?? "", ...p.tastingNotes]
        .join(" ")
        .toLowerCase();
      return chipWords.some((word) => searchable.includes(word));
    };

    let filtered: ProductSummary[];
    if (matchedRoasts.size > 0) {
      filtered = allProducts.filter(
        (p) => p.roastLevel && matchedRoasts.has(p.roastLevel.toLowerCase())
      );
      // Roast/brew mapping produced nothing — fall through to word-level text search.
      if (filtered.length === 0) {
        filtered = allProducts.filter(textMatch);
      }
    } else {
      filtered = allProducts.filter(textMatch);
    }

    // If filter produces 0 results, fall back to all products
    if (filtered.length === 0) filtered = allProducts;

    // If no narrowing happened, leave the message unchanged (preserves chips)
    if (filtered.length >= allProducts.length) return;

    // Update last assistant message by role — handles trailing user bubbles
    const lastAssistantIdx = messages.reduce((best, m, i) =>
      m.role === "assistant" ? i : best, -1);

    const updatedMessages = messages.map((msg, i) => {
      if (i === lastAssistantIdx) {
        return { ...msg, products: filtered, followUps: [], followUpQuestion: undefined };
      }
      return msg;
    });

    set({ messages: updatedMessages });
  },

  loadSurfaces: async () => {
    if (get().surfacesLoaded) return;
    try {
      const res = await fetch("/api/settings/voice-surfaces");
      if (res.ok) {
        const fetched = (await res.json()) as VoiceSurfaces;
        // Merge with defaults so keys added after initial generation still have values
        const surfaces = { ...DEFAULT_VOICE_SURFACES, ...fetched };
        set({ voiceSurfaces: surfaces, surfacesLoaded: true });
      } else {
        set({ voiceSurfaces: DEFAULT_VOICE_SURFACES, surfacesLoaded: true });
      }
    } catch {
      // Keep defaults on fetch failure so the UI is never stuck on null
      set({ voiceSurfaces: DEFAULT_VOICE_SURFACES, surfacesLoaded: true });
    }
  },
}));
