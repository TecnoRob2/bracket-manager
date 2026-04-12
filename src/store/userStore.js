import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * User Store con persistencia en sessionStorage. 
 * Guarda el apiToken, la información del usuario 
 * y los torneos asociados al usuario.
 * @typedef {Object} UserStore
 * @property {string|null} apiToken - El token de autenticación del usuario.
 * @property {User|null} user - Información del usuario actual.
 * @property {Tournament[]} tournaments - Lista de torneos asociados al usuario.
 */

export const userStore = create(
  persist(
    (set) => ({
      apiToken: null,
      user: null,
      tournaments: [],
      tema: 'light', // <-- NUEVO: Estado del tema
      setApiToken: (token) => set({ apiToken: token }),
      setUser: (user) => set({ user: user }),
      setTournaments: (tournaments) => set({ tournaments: tournaments}), // <-- Nueva función
      cerrarSesion: () => set({ apiToken: null, tournaments: [] }), // Limpia todo al salir
      toggleTema: () => set((state) => ({ tema: state.tema === 'light' ? 'dark' : 'light' })), // <-- NUEVO: Función para cambiarlo
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);