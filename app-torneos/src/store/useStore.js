import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      apiToken: null, // Al principio no hay token
      setApiToken: (token) => set({ apiToken: token }),
      cerrarSesion: () => set({ apiToken: null }),
    }),
    {
      name: 'torneos-storage', // Nombre del archivo invisible en el LocalStorage
    }
  )
);