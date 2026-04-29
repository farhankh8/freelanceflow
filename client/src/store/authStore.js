import { create } from "zustand"
import { createJSONStorage } from "zustand/middleware"

const getStoredUser = () => {
  try {
    const stored = localStorage.getItem("ff_user")
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

const useAuthStore = create(
  (set, get) => ({
    user: getStoredUser(),
    accessToken: localStorage.getItem("ff_token") || null,
    refreshToken: localStorage.getItem("ff_refresh_token") || null,
    isAuthenticated: !!localStorage.getItem("ff_token"),

    setAuth: (user, accessToken, refreshToken) => {
      if (accessToken) localStorage.setItem("ff_token", accessToken)
      if (refreshToken) localStorage.setItem("ff_refresh_token", refreshToken)
      set({ user, accessToken, refreshToken, isAuthenticated: true })
    },

    updateUser: (userData) => {
      const updated = { ...get().user, ...userData }
      localStorage.setItem("ff_user", JSON.stringify(updated))
      set({ user: updated })
    },

    logout: () => set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    }),

    // Getters
    getToken: () => get().accessToken,
    getUser: () => get().user,
    getRole: () => get().user?.role || 'manager',
    isLoggedIn: () => !!get().accessToken,
    isManager: () => get().user?.role !== 'worker',
    isWorker: () => get().user?.role === 'worker',
  }),
  {
    name: "freelanceflow-auth",
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      user: state.user,
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      isAuthenticated: state.isAuthenticated,
    }),
  }
)

export default useAuthStore
