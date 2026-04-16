import { create } from "zustand"

const useAuthStore = create(
  (set, get) => ({
    user: null,
    isAuthenticated: false,

    setAuth: (user) => set({
      user,
      isAuthenticated: true,
    }),

    updateUser: (userData) => set((state) => ({
      user: { ...state.user, ...userData }
    })),

    logout: () => set({
      user: null,
      isAuthenticated: false,
    }),

    getUser: () => get().user,
    isLoggedIn: () => !!get().user,
  })
)

export default useAuthStore