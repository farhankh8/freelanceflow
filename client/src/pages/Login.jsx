import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import api from "../lib/api"
import useAuthStore from "../store/authStore"

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error("Fill in all fields"); return }
    setLoading(true)
    try {
      const { data } = await api.post("/auth/login", form)
      // ✅ Save token + user to persisted store
      setAuth(data.user, data.accessToken, data.refreshToken)
      toast.success("Welcome back! 🎉")
      navigate("/app")
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width: "100%", padding: "13px 16px", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
    color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s"
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a0a12 0%,#0f0f1a 50%,#0a0a12 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      {/* Background blobs */}
      <div style={{ position: "fixed", top: "10%", left: "5%", width: "400px", height: "400px", background: "radial-gradient(circle,rgba(108,99,255,0.12),transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "10%", right: "5%", width: "350px", height: "350px", background: "radial-gradient(circle,rgba(255,101,132,0.1),transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "420px", position: "relative" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>💼</div>
            <span style={{ fontSize: "22px", fontWeight: 800, color: "#fff" }}>FreelanceFlow</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>Sign in to your account</p>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "36px", backdropFilter: "blur(20px)" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "6px" }}>Welcome back 👋</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "28px" }}>Enter your credentials to continue</p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Email Address</label>
              <input
                type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com" style={inp} autoComplete="email"
                onFocus={e => e.target.style.borderColor = "rgba(108,99,255,0.6)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={show ? "text" : "password"} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••" style={{ ...inp, paddingRight: "48px" }} autoComplete="current-password"
                  onFocus={e => e.target.style.borderColor = "rgba(108,99,255,0.6)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
                <button type="button" onClick={() => setShow(s => !s)}
                  style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "16px" }}>
                  {show ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "14px", background: loading ? "rgba(108,99,255,0.5)" : "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 800, fontSize: "15px", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", marginTop: "4px" }}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Don't have an account? </span>
            <Link to="/register" style={{ color: "#6c63ff", fontWeight: 700, fontSize: "14px", textDecoration: "none" }}>Sign up free</Link>
          </div>
        </div>
      </div>
    </div>
  )
}