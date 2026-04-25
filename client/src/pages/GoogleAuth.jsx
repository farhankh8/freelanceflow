import { useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import useAuthStore from "../store/authStore"
import useNotificationStore from "../store/notificationStore"
import api from "../lib/api"

export default function GoogleAuth() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { addNotification } = useNotificationStore()
  
  const token = searchParams.get("token")
  const userId = searchParams.get("userId")
  
  useEffect(() => {
    const handleGoogleAuth = async () => {
      if (!token || !userId) {
        toast.error("Invalid Google authentication")
        navigate("/login")
        return
      }
      
      try {
        const response = await api.post("/auth/google/success", { token, userId })
        if (response.data.accessToken) {
          localStorage.setItem("ff_token", response.data.accessToken)
          const user = response.data.user
          setAuth(user)
          localStorage.setItem("ff_user", JSON.stringify(user))
          addNotification({ type: "success", title: "Welcome!", message: `Logged in with Google successfully` })
          toast.success("Welcome!")
          
          // New users (no plan) go to billing, existing users go to dashboard
          const isNewUser = !user.plan && !user.planExpiry
          navigate(isNewUser ? "/app/settings?tab=billing" : "/app")
        }
      } catch (err) {
        toast.error("Google authentication failed")
        navigate("/login")
      }
    }
    
    handleGoogleAuth()
  }, [token, userId, navigate, setAuth, addNotification])
  
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a0a12 0%,#0f0f1a 50%,#0a0a12 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔄</div>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px" }}>Completing Google sign in...</p>
      </div>
    </div>
  )
}