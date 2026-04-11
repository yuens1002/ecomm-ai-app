import { create } from "zustand";

export interface PageContext {
  icon: string;
  title: string;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  priceInCents: number | null;
  imageUrl: string | null;
  categorySlug: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: ProductSummary[];
  followUps?: string[];
  isLoading?: boolean;
}

interface ChatPanelState {
  isOpen: boolean;
  messages: ChatMessage[];
  pageContext: PageContext | null;
  isLoading: boolean;
  // Actions
  open: () => void;
  close: () => void;
  toggle: () => void;
  setPageContext: (ctx: PageContext) => void;
  addMessage: (msg: ChatMessage) => void;
  updateLastMessage: (updates: Partial<ChatMessage>) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useChatPanelStore = create<ChatPanelState>()((set) => ({
  isOpen: false,
  messages: [],
  pageContext: null,
  isLoading: false,

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
}));
