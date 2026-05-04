import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * @typedef {Object} tournamentStore
 * @property {Tournament|null} tournament - El torneo seleccionado.
 */
export const tournamentStore = create(
  persist(
    (set) => ({
      tournament: null,
      phase_idx: 0,
      phases: [],
      drafts: [],

      setTournament: (tournament) => set({ tournament: tournament }),
      setPhases: (phases) => set({ phases: phases }),
      setDrafts: (drafts) => set({ drafts: drafts }),
      setPhaseIndex: (index) => set({ phase_idx: index }),
      cerrarSesion: () => set({ tournament: null, phases: [], drafts: [] }), // Limpia todo al salir
    }),
    {
      name: 'tournament-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);