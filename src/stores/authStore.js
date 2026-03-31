import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  office: null,
  role: null,
  initialized: false,
  setUser: (user) => set({ user }),
  setInitialized: (initialized) => set({ initialized }),
  setOffice: (office) => set({ office }),
  setRole: (role) => set({ role }),
  clearAuth: () => set({ user: null, office: null, role: null, initialized: true })
}))
