import { useState } from "react"
import { Link } from "react-router-dom"
import toast from "react-hot-toast"
import api from "../lib/api"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await api.post("/auth/send-reset-email", { email })
      setSent(true)
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reset email")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
    color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box"
  }

  if (sent) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a0a12 0%,#0f0f1a 50%,#0a0a12 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ width: "100%", maxWidth: "400px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>Check your email</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginBottom: "24px" }}>We sent a password reset link to your email address.</p>
          <Link to="/login" style={{ color: "#6c63ff", textDecoration: "none", fontSize: "14px" }}>← Back to sign in</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a0a12 0%,#0f0f1a 50%,#0a0a12 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>💼</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#fff" }}>FreelanceFlow</div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginTop: "8px" }}>Forgot password?</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "40px" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", color: "rgba(255,255,255,0.6)", marginBottom: "8px" }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>

            <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px" }}>
            <Link to="/login" style={{ color: "#6c63ff", textDecoration: "none" }}>← Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}