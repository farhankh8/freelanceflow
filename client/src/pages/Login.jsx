import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import api from "../lib/api"
import useAuthStore from "../store/authStore"
import useNotificationStore from "../store/notificationStore"

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
      addNotification({ type: "success", title: "Welcome back!", message: `Good to see you again, ${data.user.name}` })
      toast.success("Welcome back!")
      navigate("/app")
    } catch (error) {
      const msg = error.response?.data?.message || "Invalid email or password"
      toast.error(msg)
      addNotification({ type: "error", title: "Login failed", message: msg })
    } finally {
      setLoading(false)
    }
  }

  const inpStyle = {
    width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
    color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s"
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a0a12 0%,#0f0f1a 50%,#0a0a12 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ position: "fixed", top: "10%", left: "5%", width: "400px", height: "400px", background: "radial-gradient(circle,rgba(108,99,255,0.12),transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "10%", right: "5%", width: "350px", height: "350px", background: "radial-gradient(circle,rgba(255,101,132,0.1),transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "420px", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>💼</div>
            <span style={{ fontSize: "22px", fontWeight: 800, color: "#fff" }}>FreelanceFlow</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>Sign in to your account</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "36px", backdropFilter: "blur(20px)" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "6px" }}>Welcome back</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "28px" }}>Enter your credentials to continue</p>

          <form onSubmit={handleLogin} noValidate>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setEmailError("") }}
                placeholder="you@example.com"
                style={{ ...inpStyle, borderColor: emailError ? "#ff4d6d" : undefined }}
                autoComplete="email"
              />
              {emailError && <p style={{ color: "#ff4d6d", fontSize: "12px", marginTop: "4px" }}>{emailError}</p>}
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={show ? "text" : "password"}
                  value={form.password}
                  onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setPasswordError("") }}
                  placeholder="Enter your password"
                  style={{ ...inpStyle, paddingRight: "48px" }}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShow(!show)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "16px" }}>
                  {show ? "🙈" : "👁️"}
                </button>
              </div>
              {passwordError && <p style={{ color: "#ff4d6d", fontSize: "12px", marginTop: "4px" }}>{passwordError}</p>}
            </div>

            <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: loading ? "rgba(108,99,255,0.5)" : "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 800, fontSize: "15px", cursor: "pointer", transition: "all 0.2s", marginTop: "4px" }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Don't have an account? </span>
            <Link to="/register" style={{ color: "#6c63ff", fontWeight: 700, fontSize: "14px", textDecoration: "none" }}>Sign up free</Link>
          </div>

          <div style={{ textAlign: "center", marginTop: "12px" }}>
            <Link to="/forgot-password" style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textDecoration: "none" }}>Forgot password?</Link>
          </div>
        </div>
      </div>
    </div>
  )
}