import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      apiToken: null,
      torneosUsuario: [], // <-- Nuevo array para guardar los torneos reales
      setApiToken: (token) => set({ apiToken: token }),
      setTorneosUsuario: (torneos) => set({ torneosUsuario: torneos }), // <-- Nueva función
      cerrarSesion: () => set({ apiToken: null, torneosUsuario: [] }), // Limpia todo al salir
    }),
    {
      name: 'torneos-storage',
    }
  )
);