import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * @typedef {Object} clashStore
 * @property {Clash[]} clasheos - Los clasheos del torneo.
 */
export const clashStore = create(
  persist(
    (set) => ({
        clasheos: [],
        setClasheos: (clasheos) => set({ clasheos: clasheos }),
    }),
    {
      name: 'clash-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);