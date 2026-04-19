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

  useEffect(() => {
    if (!token) setError("Invalid or expired reset link")
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
    width: "100%", padding: "14px 16px", background: "#fff", border: "1px solid #e0e0e0",
    borderRadius: "4px", color: "#333", fontSize: "16px", outline: "none", boxSizing: "border-box"
  }

  if (error && !token) {
    return (
      <div style={{ minHeight: "100vh", background: "#f6f6f6", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ background: "#fff", borderRadius: "8px", padding: "40px", boxShadow: "0 1px 3px rgba(0,0,0,0.12)", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
          <h2 style={{ fontSize: "20px", fontWeight: 500, color: "#d93025", marginBottom: "8px" }}>Invalid Link</h2>
          <p style={{ color: "#5f6368", fontSize: "14px", marginBottom: "24px" }}>{error}</p>
          <Link to="/login" style={{ color: "#1a73e8", textDecoration: "none", fontSize: "14px" }}>Back to sign in</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f6f6f6", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "64px", background: "#fff", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", padding: "0 24px", zIndex: 10 }}>
        <span style={{ fontSize: "22px", fontWeight: 500, color: "#5f6368" }}>FreelanceFlow</span>
      </div>

      <div style={{ width: "100%", maxWidth: "400px", marginTop: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "24px", fontWeight: 500, color: "#202124", marginTop: "16px" }}>Set new password</div>
          <p style={{ color: "#5f6368", fontSize: "14px", marginTop: "8px" }}>Enter your new password below</p>
        </div>

        <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.12)", padding: "40px", border: "1px solid #e0e0e0" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#5f6368", marginBottom: "8px" }}>New Password</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError("") }}
                placeholder="Min 8 characters"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#5f6368", marginBottom: "8px" }}>Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError("") }}
                placeholder="Repeat password"
                style={inputStyle}
              />
            </div>

            {error && <p style={{ color: "#d93025", fontSize: "12px", marginBottom: "16px" }}>{error}</p>}

            <button type="submit" disabled={loading || !token} style={{ width: "100%", padding: "10px 24px", background: "#1a73e8", border: "none", borderRadius: "4px", color: "#fff", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
              {loading ? "Resetting..." : "Reset password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}