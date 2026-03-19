import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken = null) => set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
      }),

      updateUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData }
      })),

      updateToken: (accessToken) => set({ accessToken }),

      logout: () => set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      }),

      // Getters
      getToken: () => get().accessToken,
      getUser: () => get().user,
      isLoggedIn: () => !!get().accessToken,
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
)

export default useAuthStore