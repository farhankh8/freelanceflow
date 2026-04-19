import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import api from "../lib/api"
import useAuthStore from "../store/authStore"
import useNotificationStore from "../store/notificationStore"
import { Eye, EyeOff } from "lucide-react"

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { addNotification } = useNotificationStore()
  const [form, setForm] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const handleLogin = async (e) => {
    e.preventDefault()
    let valid = true
    if (!form.email) { setEmailError("Email is required"); valid = false } else { setEmailError("") }
    if (!form.password) { setPasswordError("Password is required"); valid = false } else { setPasswordError("") }
    if (!valid) return
    setLoading(true)
    try {
      const { data } = await api.post("/auth/login", form)
      if (data.accessToken) localStorage.setItem("ff_token", data.accessToken)
      setAuth(data.user)
      localStorage.setItem("ff_user", JSON.stringify(data.user))
      addNotification({
        type: "success",
        title: "Welcome back!",
        message: `Good to see you again, ${data.user.name}`
      })
      toast.success("Welcome back!")
      navigate("/app")
    } catch (error) {
      const msg = error.response?.data?.message || "Invalid email or password"
      toast.error(msg)
      addNotification({
        type: "error",
        title: "Login failed",
        message: msg
      })
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: "100%", padding: "14px 16px", background: "#fff", border: "1px solid #e0e0e0",
    borderRadius: "4px", color: "#333", fontSize: "16px", outline: "none", boxSizing: "border-box",
    transition: "box-shadow 0.2s, border-color 0.2s"
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f6f6f6", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      {/* Firebase-style header bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "64px", background: "#fff", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "24px" }}>🔥</span>
          <span style={{ fontSize: "22px", fontWeight: 500, color: "#5f6368" }}>FreelanceFlow</span>
        </div>
        <div style={{ fontSize: "14px", color: "#5f6368" }}>
          <Link to="/register" style={{ color: "#1a73e8", textDecoration: "none", fontWeight: 500 }}>Get Started</Link>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: "400px", marginTop: "40px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 87.8 127.4'%3E%3Cpath fill='%23FFCA28' d='M87.8 63.7L43.9 127.4z'/%3E%3Cpath fill='%23FBBC04' d='M43.9 63.7L87.8 0z'/%3E%3Cpath fill='%23EA4335' d='M0 63.7L43.9 127.4z'/%3E%3Cpath fill='%23FBBC04' d='M0 63.7L43.9 0z'/%3E%3Cpath fill='%2334A853' d='M43.9 25.5L0 63.7h25.9z'/%3E%3Cpath fill='%234285F4' d='M87.8 63.7L43.9 25.5H87.8z'/%3E%3Cpath fill='%23EA4335' d='M17.9 38.2l-12.8 14.9c-3.2 3.7-1 8.9 3.2 9.9l30.7 7.1c1.7 0.4 3.5 0.5 5.3 0.5 7.1 0 13-4.9 14.3-11.6L87.8 63.7 43.9 25.5 17.9 38.2z'/%3E%3Cpath fill='%234285F4' d='M69.9 101.9L43.9 63.7 69.9 101.9z'/%3E%3C/svg%3E" alt="Firebase" style={{ width: "52px", height: "52px" }} />
          <div style={{ fontSize: "24px", fontWeight: 500, color: "#202124", marginTop: "16px" }}>Welcome back to FreelanceFlow</div>
          <p style={{ color: "#5f6368", fontSize: "14px", marginTop: "8px" }}>Sign in to continue to your dashboard</p>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 -1px 0 rgba(0,0,0,0.05) inset", padding: "40px", border: "1px solid #e0e0e0" }}>
          <form onSubmit={handleLogin} noValidate>
            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="login-email" style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#5f6368", marginBottom: "8px" }}>Email</label>
              <input
                id="login-email"
                type="email"
                value={form.email}
                onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setEmailError("") }}
                placeholder="you@example.com"
                style={{ ...inputStyle, borderColor: emailError ? "#d93025" : undefined }}
                autoComplete="email"
              />
              {emailError && <p style={{ color: "#d93025", fontSize: "12px", marginTop: "4px" }}>{emailError}</p>}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="login-password" style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#5f6368", marginBottom: "8px" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  type={show ? "text" : "password"}
                  value={form.password}
                  onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setPasswordError("") }}
                  placeholder="Enter your password"
                  style={{ ...inputStyle, paddingRight: "48px", borderColor: passwordError ? "#d93025" : undefined }}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShow(s => !s)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", fontSize: "16px", color: "#5f6368" }}>
                  {show ? "🙈" : "👁"}
                </button>
              </div>
              {passwordError && <p style={{ color: "#d93025", fontSize: "12px", marginTop: "4px" }}>{passwordError}</p>}
            </div>

            <button type="submit" disabled={loading} style={{ width: "100%", padding: "10px 24px", background: "#1a73e8", border: "none", borderRadius: "4px", color: "#fff", fontSize: "14px", fontWeight: 500, cursor: "pointer", transition: "background 0.2s" }}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "16px", fontSize: "14px" }}>
            <span style={{ color: "#5f6368" }}>Don't have an account? </span>
            <Link to="/register" style={{ color: "#1a73e8", textDecoration: "none", fontWeight: 500 }}>Sign up</Link>
          </div>
          
          <div style={{ textAlign: "center", marginTop: "12px", fontSize: "14px" }}>
            <Link to="/forgot-password" style={{ color: "#1a73e8", textDecoration: "none" }}>Forgot password?</Link>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link to="/register" style={{ color: "#1a73e8", textDecoration: "none", fontSize: "14px" }}>Need help?</Link>
        </div>
      </div>

      {/* Firebase footer */}
      <div style={{ position: "fixed", bottom: "16px", left: "24px", fontSize: "12px", color: "#5f6368" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a href="#" style={{ color: "#1a73e8", textDecoration: "none" }}>Terms</a>
          <a href="#" style={{ color: "#1a73e8", textDecoration: "none" }}>Privacy Policy</a>
          <a href="#" style={{ color: "#1a73e8", textDecoration: "none" }}>Help</a>
        </div>
      </div>
    </div>
  )
}