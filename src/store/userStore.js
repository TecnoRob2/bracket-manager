import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * User Store con persistencia en sessionStorage. 
 * Guarda el apiToken, la información del usuario 
 * y los torneos asociados al usuario.
 * @typedef {Object} UserStore
 * @property {string|null} apiToken - El token de autenticación del usuario.
 * @property {User|null} user - Información del usuario actual.
 * @property {Tournament[]} torneosUsuario - Lista de torneos asociados al usuario.
 */
export const userStore = create(
  persist(
    (set) => ({
      apiToken: null,
      user: null,
      torneosUsuario: [],
      setApiToken: (token) => set({ apiToken: token }),
      setUser: (user) => set({ user: user }),
      setTorneosUsuario: (torneos) => set({ torneosUsuario: torneos }), // <-- Nueva función
      cerrarSesion: () => set({ apiToken: null, torneosUsuario: [] }), // Limpia todo al salir
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);