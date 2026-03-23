import axios from "axios"
import useAuthStore from "../store/authStore"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
})

api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`)
    return response
  },
  async (error) => {
    console.log(`API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data)
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (refreshToken) {
          const { data } = await axios.post(`${BASE_URL.replace('/v1', '')}/auth/refresh`, { refreshToken })
          useAuthStore.getState().updateToken(data.accessToken)
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        useAuthStore.getState().logout()
        window.location.href = "/login"
        return Promise.reject(refreshError)
      }
    }
    
    if (error.response?.status === 403) {
      if (error.response.data?.error?.includes('Pro')) {
        window.location.href = "/app/settings?upgrade=true"
      }
    }
    
    return Promise.reject(error)
  }
)

export default api