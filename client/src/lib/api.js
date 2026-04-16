import axios from "axios"
import useAuthStore from "../store/authStore"

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(/\/$/, '')

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
        return api(originalRequest)
      } catch (refreshError) {
        useAuthStore.getState().logout()
        window.location.href = "/login"
        return Promise.reject(refreshError)
      }
    }
    
    if (error.response?.status === 403) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || ''
      if (errorMsg.includes('Pro')) {
        window.location.href = "/app/settings?upgrade=true"
      }
    }
    
    return Promise.reject(error)
  }
)

export default api
