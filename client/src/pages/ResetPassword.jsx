import { useState, useEffect } from "react"
import { useSearchParams, Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import api from "../lib/api"

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get("token")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    if (!token) setInvalid(true)
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }
    setLoading(true)
    try {
      await api.post("/auth/reset-password", { token, newPassword: password })
      toast.success("Password reset! Please login with new password")
      navigate("/login")
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
    color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box"
  }

  if (invalid) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a0a12 0%,#0f0f1a 50%,#0a0a12 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ width: "100%", maxWidth: "400px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#ff4d6d", marginBottom: "8px" }}>Invalid Link</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginBottom: "24px" }}>This reset link is invalid or has expired.</p>
          <Link to="/login" style={{ color: "#6c63ff", textDecoration: "none", fontSize: "14px" }}>← Back to sign in</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a0a12 0%,#0f0f1a 50%,#0a0a12 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔐</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#fff" }}>Set new password</div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginTop: "8px" }}>Enter your new password below</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "40px" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", color: "rgba(255,255,255,0.6)", marginBottom: "8px" }}>New Password</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError("") }}
                placeholder="Min 8 characters"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", color: "rgba(255,255,255,0.6)", marginBottom: "8px" }}>Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError("") }}
                placeholder="Repeat password"
                style={inputStyle}
              />
            </div>

            {error && <p style={{ color: "#ff4d6d", fontSize: "12px", marginBottom: "16px" }}>{error}</p>}

            <button type="submit" disabled={loading || !token} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>
              {loading ? "Resetting..." : "Reset password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}