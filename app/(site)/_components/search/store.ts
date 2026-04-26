"use client";

import { create } from "zustand";

interface SearchDrawerState {
  isOpen: boolean;
  /**
   * Slug of the chip currently filtering the drawer body, or null when no
   * chip is active. Mutually exclusive with the typed query — typing clears
   * this; clicking a chip clears the query. Cleared on drawer close.
   */
  activeChipSlug: string | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setActiveChipSlug: (slug: string | null) => void;
}

export const useSearchDrawerStore = create<SearchDrawerState>((set) => ({
  isOpen: false,
  activeChipSlug: null,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, activeChipSlug: null }),
  toggle: () =>
    set((s) => (s.isOpen ? { isOpen: false, activeChipSlug: null } : { isOpen: true })),
  setActiveChipSlug: (slug) => set({ activeChipSlug: slug }),
}));
