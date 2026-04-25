import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import useAuthStore from "../store/authStore"

// Payment link for ₹1499 - create new one for real payments
const PAYMENT_LINK = "https://rzp.io/rzp/YUrHJws"

// Free for this specific email
const FREE_EMAIL = "25031@yenepoya.edu.in"

export default function Billing() {
  const { user, updateUser } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const isPro = user?.plan === 'pro'
  const isFreeUser = user?.email?.toLowerCase() === FREE_EMAIL.toLowerCase()

  useEffect(() => {
    // Grant free access for specific email
    if (isFreeUser) {
      const updatedUser = { ...user, plan: 'pro', planExpiry: new Date(Date.now() + 100*365*24*60*60*1000) }
      updateUser(updatedUser)
      localStorage.setItem("ff_user", JSON.stringify(updatedUser))
      navigate("/app")
    } else if (isPro) {
      navigate("/app")
    }
  }, [isPro, isFreeUser])

  const handlePay = async () => {
    setLoading(true)
    window.open(PAYMENT_LINK, "_blank")
    setLoading(false)
  }

  if (isFreeUser || isPro) return null

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ maxWidth: "420px", width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "56px", marginBottom: "20px" }}>💳</div>
        <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "12px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Complete Payment
        </h1>
        <p style={{ color: "#71717a", fontSize: "15px", marginBottom: "32px" }}>
          Pay once to unlock all features forever
        </p>

        <div style={{ background: "linear-gradient(135deg,rgba(108,99,255,0.12),rgba(255,101,132,0.12))", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "20px", padding: "32px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "20px" }}>
            <span style={{ fontSize: "48px", fontWeight: 900 }}>₹1499</span>
            <span style={{ fontSize: "16px", color: "#71717a" }}>/mo</span>
          </div>
          
          <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "12px" }}>
            {["Unlimited clients & projects", "GST-compliant invoices", "Custom branding", "AI-powered insights", "Priority support", "Advanced reports"].map(item => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
                <span style={{ color: "#00d97e", fontWeight: 700 }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <button onClick={handlePay} disabled={loading} style={{ width: "100%", padding: "16px", background: loading ? "rgba(108,99,255,0.5)" : "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "12px", color: "#fff", fontSize: "16px", fontWeight: 700, cursor: "pointer", marginBottom: "16px" }}>
          {loading ? "Processing..." : "Pay ₹1499 & Continue"}
        </button>
      </div>
    </div>
  )
}