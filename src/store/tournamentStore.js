import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * User Store con persistencia en sessionStorage. 
 * Guarda el apiToken, la información del usuario 
 * y los torneos asociados al usuario.
 * @typedef {Object} tournamentStore
 * @property {Tournament|null} tournament - El torneo seleccionado.
 */
export const tournamentStore = create(
  persist(
    (set) => ({
      tournament: null,
      phases: [],
      setTournament: (tournament) => set({ tournament: tournament }),
      setPhases: (phases) => set({ phases: phases }),
      cerrarSesion: () => set({ tournament: null, phases: [] }), // Limpia todo al salir
    }),
    {
      name: 'tournament-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);