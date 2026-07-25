import { create } from "zustand";

export const useQuickAddStore = create((set) => ({
  activeModal: null, // 'product' | 'category' | 'brand' | 'invite' | null
  isCommandPaletteOpen: false,
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
}));
