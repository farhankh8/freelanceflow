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
    width: "100%", padding: "14px 16px", background: "#fff", border: "1px solid #e0e0e0",
    borderRadius: "4px", color: "#333", fontSize: "16px", outline: "none", boxSizing: "border-box"
  }

  if (sent) {
    return (
      <div style={{ minHeight: "100vh", background: "#f6f6f6", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "64px", background: "#fff", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", padding: "0 24px", zIndex: 10 }}>
          <span style={{ fontSize: "22px", fontWeight: 500, color: "#5f6368" }}>FreelanceFlow</span>
        </div>
        <div style={{ width: "100%", maxWidth: "400px", marginTop: "40px", background: "#fff", borderRadius: "8px", padding: "40px", boxShadow: "0 1px 3px rgba(0,0,0,0.12)", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
          <h2 style={{ fontSize: "20px", fontWeight: 500, color: "#202124", marginBottom: "8px" }}>Check your email</h2>
          <p style={{ color: "#5f6368", fontSize: "14px", marginBottom: "24px" }}>We sent a password reset link to your email address.</p>
          <Link to="/login" style={{ color: "#1a73e8", textDecoration: "none", fontSize: "14px" }}>Back to sign in</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f6f6f6", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "64px", background: "#fff", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", zIndex: 10 }}>
        <span style={{ fontSize: "22px", fontWeight: 500, color: "#5f6368" }}>FreelanceFlow</span>
        <Link to="/login" style={{ color: "#1a73e8", textDecoration: "none", fontSize: "14px" }}>Sign in</Link>
      </div>

      <div style={{ width: "100%", maxWidth: "400px", marginTop: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 87.8 127.4'%3E%3Cpath fill='%23FFCA28' d='M87.8 63.7L43.9 127.4z'/%3E%3Cpath fill='%23FBBC04' d='M43.9 63.7L87.8 0z'/%3E%3Cpath fill='%23EA4335' d='M0 63.7L43.9 127.4z'/%3E%3Cpath fill='%23FBBC04' d='M0 63.7L43.9 0z'/%3E%3Cpath fill='%2334A853' d='M43.9 25.5L0 63.7h25.9z'/%3E%3Cpath fill='%234285F4' d='M87.8 63.7L43.9 25.5H87.8z'/%3E%3Cpath fill='%23EA4335' d='M17.9 38.2l-12.8 14.9c-3.2 3.7-1 8.9 3.2 9.9l30.7 7.1c1.7 0.4 3.5 0.5 5.3 0.5c7.1 0 13-4.9 14.3-11.6L87.8 63.7 43.9 25.5 17.9 38.2z'/%3E%3Cpath fill='%234285F4' d='M69.9 101.9L43.9 63.7 69.9 101.9z'/%3E%3C/svg%3E" alt="Firebase" style={{ width: "52px", height: "52px" }} />
          <div style={{ fontSize: "24px", fontWeight: 500, color: "#202124", marginTop: "16px" }}>Forgot password?</div>
          <p style={{ color: "#5f6368", fontSize: "14px", marginTop: "8px" }}>Enter your email to get a reset link</p>
        </div>

        <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.12)", padding: "40px", border: "1px solid #e0e0e0" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "24px" }}>
              <label htmlFor="forgot-email" style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#5f6368", marginBottom: "8px" }}>Email</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>

            <button type="submit" disabled={loading} style={{ width: "100%", padding: "10px 24px", background: "#1a73e8", border: "none", borderRadius: "4px", color: "#fff", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px" }}>
            <Link to="/login" style={{ color: "#1a73e8", textDecoration: "none" }}>← Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}