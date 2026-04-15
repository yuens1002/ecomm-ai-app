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
}

export const useChatPanelStore = create<ChatPanelState>()((set, get) => ({
  isOpen: false,
  messages: [],
  pageContext: null,
  isLoading: false,
  voiceSurfaces: null,
  surfacesLoaded: false,
  sessionGreeted: false,

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
    set({ surfacesLoaded: false, voiceSurfaces: null, messages: [], sessionGreeted: false }),

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
