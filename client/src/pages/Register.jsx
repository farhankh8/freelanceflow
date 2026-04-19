import { useState, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import api from "../lib/api"
import useAuthStore from "../store/authStore"
import useNotificationStore from "../store/notificationStore"

export default function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showBranding, setShowBranding] = useState(true)
  const [errors, setErrors] = useState({})
  const { setAuth } = useAuthStore()
  const { addNotification } = useNotificationStore()
  const navigate = useNavigate()
  const submittedRef = useRef(false)

  const validate = () => {
    const errs = {}
    if (!name.trim()) errs.name = "Full name is required"
    if (!email.trim()) errs.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Please enter a valid email"
    if (!password) errs.password = "Password is required"
    else if (password.length < 8) errs.password = "Must be at least 8 characters"
    if (!confirm) errs.confirm = "Please confirm your password"
    else if (password !== confirm) errs.confirm = "Passwords do not match"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submittedRef.current) return
    if (!validate()) return
    submittedRef.current = true
    setLoading(true)
    try {
      const response = await api.post("/auth/register", { name, email, password })
      if (response.data.accessToken) localStorage.setItem("ff_token", response.data.accessToken)
      setAuth(response.data.user)
      localStorage.setItem("ff_user", JSON.stringify(response.data.user))
      addNotification({ type: "success", title: "Welcome to FreelanceFlow!", message: `Thanks for signing up, ${name}!` })
      toast.success(`Welcome to FreelanceFlow, ${name}!`)
      navigate("/app")
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Registration failed"
      toast.error(errorMsg)
      addNotification({ type: "error", title: "Registration failed", message: errorMsg })
      submittedRef.current = false
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
    color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s"
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#0f3460 100%)" }}>
      {showBranding && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>💼</div>
        <h1 style={{ fontSize: "42px", fontWeight: 800, color: "#fff", marginBottom: "16px", letterSpacing: "-1px" }}>
          Start your free<br />
          <span style={{ background: "linear-gradient(135deg,#6c63ff,#ff6584)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>freelance journey</span>
        </h1>
        <p style={{ color: "#a8aec0", fontSize: "17px", lineHeight: "1.7", marginBottom: "40px" }}>Join thousands of freelancers who manage their business with FreelanceFlow.</p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[{ icon: "🧾", text: "Create and share professional invoices" },
            { icon: "👥", text: "Manage all your clients in one place" },
            { icon: "💰", text: "Get paid faster with INR support" },
            { icon: "🤖", text: "AI assistant to help you grow" }
          ].map(item => (
            <div key={item.text} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(108,99,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>{item.icon}</div>
              <span style={{ color: "#c4b5fd", fontSize: "14px" }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
      )}

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ width: "100%", maxWidth: "440px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>💼</div>
            <div style={{ fontSize: "22px", fontWeight: 800, background: "linear-gradient(135deg,#6c63ff,#ff6584)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FreelanceFlow</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "40px" }}>
            <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#fff", marginBottom: "6px" }}>Create account</h1>
            <p style={{ color: "#a8aec0", marginBottom: "28px", fontSize: "14px" }}>Free forever — no credit card required</p>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", color: "#a8aec0", marginBottom: "6px", fontWeight: 600 }}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: "" })) }}
                  placeholder="Your name"
                  style={{ ...inputStyle, borderColor: errors.name ? "#ff4d6d" : undefined }}
                />
                {errors.name && <p style={{ color: "#ff4d6d", fontSize: "12px", marginTop: "4px" }}>{errors.name}</p>}
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", color: "#a8aec0", marginBottom: "6px", fontWeight: 600 }}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })) }}
                  placeholder="you@example.com"
                  style={{ ...inputStyle, borderColor: errors.email ? "#ff4d6d" : undefined }}
                />
                {errors.email && <p style={{ color: "#ff4d6d", fontSize: "12px", marginTop: "4px" }}>{errors.email}</p>}
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", color: "#a8aec0", marginBottom: "6px", fontWeight: 600 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })) }}
                    placeholder="Min 8 characters"
                    style={{ ...inputStyle, paddingRight: "48px", borderColor: errors.password ? "#ff4d6d" : undefined }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#a8aec0", cursor: "pointer", fontSize: "16px" }}>
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
                {errors.password && <p style={{ color: "#ff4d6d", fontSize: "12px", marginTop: "4px" }}>{errors.password}</p>}
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", color: "#a8aec0", marginBottom: "6px", fontWeight: 600 }}>Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: "" })) }}
                  placeholder="Repeat password"
                  style={{ ...inputStyle, borderColor: errors.confirm ? "#ff4d6d" : "rgba(255,255,255,0.1)" }}
                />
                {errors.confirm && <p style={{ color: "#ff4d6d", fontSize: "12px", marginTop: "4px" }}>{errors.confirm}</p>}
              </div>

              <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: loading ? "rgba(108,99,255,0.5)" : "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>
                {loading ? "Creating account..." : "Create Free Account"}
              </button>
            </form>

            <div style={{ marginTop: "20px", padding: "14px", background: "rgba(0,217,126,0.08)", border: "1px solid rgba(0,217,126,0.2)", borderRadius: "10px", textAlign: "center" }}>
              <p style={{ color: "#00d97e", fontSize: "13px", margin: 0 }}>You'll receive a welcome email after signup!</p>
            </div>

            <p style={{ textAlign: "center", marginTop: "20px", color: "#a8aec0", fontSize: "14px" }}>
              Already have an account? <Link to="/login" style={{ color: "#6c63ff", fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}