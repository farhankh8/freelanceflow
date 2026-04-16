import axios from "axios"
import useAuthStore from "../store/authStore"

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(/\/$/, '')

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
  withCredentials: true,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ff_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshRes = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
        if (refreshRes.data.accessToken) {
          localStorage.setItem("ff_token", refreshRes.data.accessToken)
        }
        originalRequest.headers.Authorization = `Bearer ${localStorage.getItem("ff_token")}`
        return api(originalRequest)
      } catch {
        localStorage.removeItem("ff_token")
        useAuthStore.getState().logout()
        window.location.href = "/login"
        return Promise.reject(error)
      }
    }

    if (error.response?.status === 403) {
      const errorMsg = error.response?.data?.message || ''
      if (errorMsg.includes('Pro')) {
        window.location.href = "/app/settings?upgrade=true"
      }
    }

    return Promise.reject(error)
  }
)

export default api
