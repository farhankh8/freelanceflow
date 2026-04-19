import { create } from "zustand"

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
    isAuthenticated: !!localStorage.getItem("ff_token"),

    setAuth: (user) => {
      set({ user, isAuthenticated: true })
    },

    updateUser: (userData) => {
      const updated = { ...get().user, ...userData }
      localStorage.setItem("ff_user", JSON.stringify(updated))
      set({ user: updated })
    },

    logout: () => {
      localStorage.removeItem("ff_token")
      set({ user: get().user, isAuthenticated: false })
    },

    getUser: () => get().user,
    isLoggedIn: () => !!localStorage.getItem("ff_token"),
  })
)

export default useAuthStore
